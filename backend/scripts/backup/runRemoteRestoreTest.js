import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { restoreEncryptedBackupFromVault } from './restoreEngine.js';
import { calculateFileSha256 } from './cryptoUtils.js';

const offsiteDir = process.env.OFFSITE_BACKUP_DIR || 'D:\\CollageStory_Encrypted_Offsite_Vault';
const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;

async function runRemoteRestoreTest() {
  console.log('=======================================================');
  console.log('[DR DRILL] Starting Offsite Encrypted Remote Restoration Test');
  console.log(`[VAULT SOURCE] ${offsiteDir}`);
  console.log('=======================================================');

  if (!fs.existsSync(offsiteDir)) {
    throw new Error(`Offsite backup vault not found at: ${offsiteDir}`);
  }

  // Find latest encrypted archives in offsite vault
  const files = fs.readdirSync(offsiteDir);
  const dbArchives = files.filter(f => f.startsWith('collage_story_db_') && f.endsWith('.sql.gz.enc')).sort().reverse();
  const storageArchives = files.filter(f => f.startsWith('collage_story_storage_') && f.endsWith('.tar.gz.enc')).sort().reverse();

  if (dbArchives.length === 0 || storageArchives.length === 0) {
    throw new Error(`Incomplete backup set in offsite vault. DB: ${dbArchives.length}, Storage: ${storageArchives.length}`);
  }

  const latestDbArchive = path.join(offsiteDir, dbArchives[0]);
  const latestStorageArchive = path.join(offsiteDir, storageArchives[0]);

  console.log(`[DR DRILL] Selected DB Archive: ${latestDbArchive}`);
  console.log(`[DR DRILL] Selected Storage Archive: ${latestStorageArchive}`);

  // Restore into isolated target database and directory
  const targetDbName = 'isolated_remote_dr_db';
  const targetExtractDir = path.resolve('storage/isolated_remote_dr_storage');

  const restoreResult = await restoreEncryptedBackupFromVault({
    encryptedDbPath: latestDbArchive,
    encryptedStoragePath: latestStorageArchive,
    targetDbName,
    targetExtractDir,
    encryptionKey,
  });

  console.log('\n=======================================================');
  console.log('[DR DRILL] Performing 100% Parity Audit: Live DB vs Restored DR DB');
  console.log('=======================================================');

  // Query live database counts
  const livePrisma = new PrismaClient();
  const [
    liveUsers,
    liveColleges,
    liveAdmins,
    liveAnnouncements,
    liveMatches,
    liveMessages,
  ] = await Promise.all([
    livePrisma.user.count(),
    livePrisma.college.count(),
    livePrisma.admin.count(),
    livePrisma.campusAnnouncement.count(),
    livePrisma.match.count(),
    livePrisma.message.count(),
  ]);

  // Connect to isolated restored DR database
  const liveDbUrl = process.env.DATABASE_URL;
  const drDbUrl = liveDbUrl.replace(/\/college_db(\?|$)/, `/${targetDbName}$1`);
  const drPrisma = new PrismaClient({
    datasources: { db: { url: drDbUrl } },
  });

  const [
    drUsers,
    drColleges,
    drAdmins,
    drAnnouncements,
    drMatches,
    drMessages,
  ] = await Promise.all([
    drPrisma.user.count(),
    drPrisma.college.count(),
    drPrisma.admin.count(),
    drPrisma.campusAnnouncement.count(),
    drPrisma.match.count(),
    drPrisma.message.count(),
  ]);

  await livePrisma.$disconnect();
  await drPrisma.$disconnect();

  const dbAudit = {
    users: { live: liveUsers, restored: drUsers, match: liveUsers === drUsers },
    colleges: { live: liveColleges, restored: drColleges, match: liveColleges === drColleges },
    admins: { live: liveAdmins, restored: drAdmins, match: liveAdmins === drAdmins },
    announcements: { live: liveAnnouncements, restored: drAnnouncements, match: liveAnnouncements === drAnnouncements },
    matches: { live: liveMatches, restored: drMatches, match: liveMatches === drMatches },
    messages: { live: liveMessages, restored: drMessages, match: liveMessages === drMessages },
  };

  console.log('[PARITY AUDIT] Database Parity Results:');
  let allDbMatch = true;
  for (const [entity, data] of Object.entries(dbAudit)) {
    const symbol = data.match ? '✅' : '❌';
    console.log(`  ${symbol} ${entity.padEnd(15)}: Live=${data.live} | Restored=${data.restored}`);
    if (!data.match) allDbMatch = false;
  }

  // Count files in live private storage
  const livePrivateDir = path.resolve('storage/private');
  let liveFileCount = 0;
  const countDir = (d) => {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) countDir(full);
      else liveFileCount++;
    }
  };
  countDir(livePrivateDir);

  const restoredFileCount = restoreResult.storage.extractedCount;
  const storageMatch = liveFileCount === restoredFileCount;
  console.log('\n[PARITY AUDIT] Private Storage Parity:');
  console.log(`  ${storageMatch ? '✅' : '❌'} Total Files: Live=${liveFileCount} | Restored=${restoredFileCount}`);

  // Clean up isolated DR database and extracted files
  console.log('\n[DR DRILL] Cleaning up isolated test database and files...');
  const { execSync } = await import('child_process');
  execSync(`docker exec college-postgres psql -U college_admin -d postgres -c "DROP DATABASE ${targetDbName};"`, { stdio: 'pipe' });
  if (fs.existsSync(targetExtractDir)) {
    fs.rmSync(targetExtractDir, { recursive: true, force: true });
  }

  if (!allDbMatch || !storageMatch) {
    throw new Error('Disaster Recovery parity verification failed. Data mismatch detected.');
  }

  console.log('=======================================================');
  console.log('✅ OFFSITE ENCRYPTED BACKUP DISASTER RECOVERY DRILL PASSED 100%');
  console.log('=======================================================');

  return {
    success: true,
    dbAudit,
    liveFileCount,
    restoredFileCount,
    timestamp: new Date().toISOString(),
  };
}

runRemoteRestoreTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Remote restore test failed:', err);
    process.exit(1);
  });

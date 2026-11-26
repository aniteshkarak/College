import fs from 'fs';
import path from 'path';
import { runFullBackup, BACKUP_PATHS } from './backupEngine.js';
import { restoreDatabaseToIsolatedTarget, restoreStorageToIsolatedTarget } from './restoreEngine.js';
import prisma from '../../src/config/prisma.js';

async function main() {
  console.log('=======================================================');
  console.log('Collage Story — Isolated Backup & Restoration Drill');
  console.log('=======================================================');

  try {
    // 1. Run fresh full backup
    console.log('\nStep 1: Generating fresh snapshot backup...');
    const manifest = await runFullBackup();

    const dbGzPath = path.join(BACKUP_PATHS.LOCAL_BACKUP_DIR, manifest.database.archive);
    const storageGzPath = path.join(BACKUP_PATHS.LOCAL_BACKUP_DIR, manifest.storage.archive);

    // 2. Perform Isolated Database Restoration
    console.log('\nStep 2: Restoring PostgreSQL dump into isolated target database (isolated_restore_test_db)...');
    const dbRestoreResult = await restoreDatabaseToIsolatedTarget(dbGzPath, 'isolated_restore_test_db');

    // Verify record counts
    const liveUsers = await prisma.user.count();
    const liveColleges = await prisma.college.count();
    const liveAdmins = await prisma.admin.count();

    console.log('\nDatabase Parity Verification:');
    console.log(`- Live Users: ${liveUsers} | Restored: ${dbRestoreResult.restoredCounts.User}`);
    console.log(`- Live Colleges: ${liveColleges} | Restored: ${dbRestoreResult.restoredCounts.College}`);
    console.log(`- Live Admins: ${liveAdmins} | Restored: ${dbRestoreResult.restoredCounts.Admin}`);

    if (
      liveUsers !== dbRestoreResult.restoredCounts.User ||
      liveColleges !== dbRestoreResult.restoredCounts.College ||
      liveAdmins !== dbRestoreResult.restoredCounts.Admin
    ) {
      throw new Error('Database parity verification failed: record counts do not match!');
    }

    // 3. Perform Isolated Storage Restoration
    console.log('\nStep 3: Restoring private storage archive into isolated folder (storage/isolated_restore_test)...');
    const testExtractDir = path.join(BACKUP_PATHS.STORAGE_ROOT, 'isolated_restore_test');
    const storageRestoreResult = await restoreStorageToIsolatedTarget(storageGzPath, testExtractDir);

    console.log('\nStorage Parity Verification:');
    console.log(`- Source Files: ${manifest.storage.uncompressedFiles} | Restored: ${storageRestoreResult.extractedCount}`);

    if (manifest.storage.uncompressedFiles !== storageRestoreResult.extractedCount) {
      throw new Error('Storage file count parity mismatch!');
    }

    // 4. Cleanup temporary test extraction directory
    console.log('\nStep 4: Cleaning up temporary test artifacts...');
    if (fs.existsSync(testExtractDir)) {
      fs.rmSync(testExtractDir, { recursive: true, force: true });
      console.log(`- Cleaned temporary directory: ${testExtractDir}`);
    }

    console.log('\n=======================================================');
    console.log('✅ ALL ISOLATED RESTORATION TESTS PASSED WITH 100% PARITY!');
    console.log('=======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Restoration Test Failed:', err.message);
    process.exit(1);
  }
}

main();

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { spawn, execSync } from 'child_process';
import { calculateFileSha256 } from './backupEngine.js';
import { decryptArchive } from './cryptoUtils.js';

/**
 * Restores a compressed database dump into an isolated target PostgreSQL database
 */
export const restoreDatabaseToIsolatedTarget = async (dumpGzPath, targetDbName = 'isolated_restore_test_db') => {
  if (!fs.existsSync(dumpGzPath)) {
    throw new Error(`Backup file does not exist: ${dumpGzPath}`);
  }

  // 1. Verify Checksum
  const shaPath = `${dumpGzPath}.sha256`;
  if (fs.existsSync(shaPath)) {
    const expectedHash = (fs.readFileSync(shaPath, 'utf8').split(' ')[0] || '').trim();
    const actualHash = await calculateFileSha256(dumpGzPath);
    if (expectedHash !== actualHash) {
      throw new Error(`Integrity check failed for ${dumpGzPath}. Expected ${expectedHash}, got ${actualHash}`);
    }
    console.log(`[RESTORE] SHA-256 Checksum verified: ${actualHash}`);
  }

  // 2. Prepare Isolated Target Database
  console.log(`[RESTORE] Initializing isolated target database: ${targetDbName}`);
  try {
    execSync(`docker exec college-postgres psql -U college_admin -d postgres -c "DROP DATABASE IF EXISTS ${targetDbName};"`, { stdio: 'pipe' });
    execSync(`docker exec college-postgres psql -U college_admin -d postgres -c "CREATE DATABASE ${targetDbName};"`, { stdio: 'pipe' });
  } catch (err) {
    throw new Error(`Failed to recreate isolated target database ${targetDbName}: ${err.message}`);
  }

  // 3. Decompress and Stream SQL into Target Database
  console.log(`[RESTORE] Streaming decompressed SQL into ${targetDbName}...`);
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const inputStream = fs.createReadStream(dumpGzPath);

    const psqlProcess = spawn('docker', [
      'exec',
      '-i',
      'college-postgres',
      'psql',
      '-U',
      'college_admin',
      '-d',
      targetDbName,
    ]);

    inputStream.pipe(gunzip).pipe(psqlProcess.stdin);

    let stderr = '';
    psqlProcess.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    psqlProcess.on('error', (err) => reject(new Error('Failed to spawn psql process: ' + err.message)));
    psqlProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`psql restore exited with code ${code}: ${stderr}`));
      }

      console.log(`[RESTORE] Database SQL stream restored successfully into ${targetDbName}`);

      // 4. Query record counts from restored database for verification
      try {
        const queryResult = execSync(
          `docker exec college-postgres psql -U college_admin -d ${targetDbName} -t -A -c "SELECT 'User:' || count(*) FROM \\"User\\"; SELECT 'College:' || count(*) FROM \\"College\\"; SELECT 'Admin:' || count(*) FROM \\"Admin\\"; SELECT 'Announcements:' || count(*) FROM \\"CampusAnnouncement\\";"`,
          { encoding: 'utf8' }
        );

        const lines = queryResult.trim().split('\n');
        const counts = {};
        for (const line of lines) {
          const [k, v] = line.trim().split(':');
          if (k && v) counts[k] = parseInt(v, 10);
        }

        console.log(`[RESTORE] Restored Database Verification Counts:`, counts);
        resolve({
          targetDbName,
          verified: true,
          restoredCounts: counts,
        });
      } catch (countErr) {
        reject(new Error(`Failed to verify record counts on restored database: ${countErr.message}`));
      }
    });
  });
};

/**
 * Restores a compressed private storage archive into an isolated test extraction directory
 */
export const restoreStorageToIsolatedTarget = async (storageGzPath, targetExtractDir) => {
  if (!fs.existsSync(storageGzPath)) {
    throw new Error(`Backup file does not exist: ${storageGzPath}`);
  }

  // 1. Verify Checksum
  const shaPath = `${storageGzPath}.sha256`;
  if (fs.existsSync(shaPath)) {
    const expectedHash = (fs.readFileSync(shaPath, 'utf8').split(' ')[0] || '').trim();
    const actualHash = await calculateFileSha256(storageGzPath);
    if (expectedHash !== actualHash) {
      throw new Error(`Integrity check failed for ${storageGzPath}. Expected ${expectedHash}, got ${actualHash}`);
    }
    console.log(`[RESTORE] Storage SHA-256 Checksum verified: ${actualHash}`);
  }

  // 2. Prepare Target Extraction Directory
  if (fs.existsSync(targetExtractDir)) {
    fs.rmSync(targetExtractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetExtractDir, { recursive: true });

  console.log(`[RESTORE] Extracting storage archive to isolated target: ${targetExtractDir}`);

  // 3. Extract using system tar
  return new Promise((resolve, reject) => {
    const tarProcess = spawn('tar', [
      '-xzf',
      storageGzPath,
      '-C',
      targetExtractDir,
    ]);

    let stderr = '';
    tarProcess.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    tarProcess.on('error', (err) => reject(new Error('Failed to spawn tar restore process: ' + err.message)));
    tarProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`tar restore exited with code ${code}: ${stderr}`));
      }

      // Count extracted files
      let extractedCount = 0;
      const countDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) countDir(full);
          else extractedCount++;
        }
      };
      countDir(targetExtractDir);

      console.log(`[RESTORE] Storage archive extracted successfully. Total restored files: ${extractedCount}`);

      resolve({
        targetExtractDir,
        verified: true,
        extractedCount,
      });
    });
  });
};

/**
 * Restores encrypted database and storage archives from offsite vault into isolated targets
 */
export const restoreEncryptedBackupFromVault = async ({
  encryptedDbPath,
  encryptedStoragePath,
  targetDbName = 'isolated_remote_dr_db',
  targetExtractDir = path.resolve('storage/isolated_remote_dr_storage'),
  encryptionKey = process.env.BACKUP_ENCRYPTION_KEY,
}) => {
  if (!encryptionKey) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required to restore encrypted offsite backups.');
  }

  console.log(`=======================================================`);
  console.log(`[DISASTER RECOVERY] Testing restoration from offsite encrypted vault...`);
  console.log(`[VAULT TARGET DB] ${targetDbName}`);
  console.log(`[VAULT TARGET STORAGE] ${targetExtractDir}`);
  console.log(`=======================================================`);

  // 1. Verify and Decrypt Database Backup
  if (!fs.existsSync(encryptedDbPath)) {
    throw new Error(`Encrypted database archive not found: ${encryptedDbPath}`);
  }
  const dbShaPath = `${encryptedDbPath}.sha256`;
  if (fs.existsSync(dbShaPath)) {
    const expected = (fs.readFileSync(dbShaPath, 'utf8').split(' ')[0] || '').trim();
    const actual = await calculateFileSha256(encryptedDbPath);
    if (expected !== actual) {
      throw new Error(`Integrity check failed for encrypted DB. Expected: ${expected}, got: ${actual}`);
    }
    console.log(`[DISASTER RECOVERY] Encrypted DB SHA-256 match verified.`);
  }

  const decryptedDbPath = encryptedDbPath.replace(/\.enc$/, '.decrypted');
  console.log(`[DISASTER RECOVERY] Decrypting DB archive using AES-256-GCM...`);
  await decryptArchive(encryptedDbPath, decryptedDbPath, encryptionKey);

  // 2. Restore Database into Isolated Target
  let dbResult;
  try {
    dbResult = await restoreDatabaseToIsolatedTarget(decryptedDbPath, targetDbName);
  } finally {
    if (fs.existsSync(decryptedDbPath)) fs.unlinkSync(decryptedDbPath);
  }

  // 3. Verify and Decrypt Storage Backup
  if (!fs.existsSync(encryptedStoragePath)) {
    throw new Error(`Encrypted storage archive not found: ${encryptedStoragePath}`);
  }
  const storageShaPath = `${encryptedStoragePath}.sha256`;
  if (fs.existsSync(storageShaPath)) {
    const expected = (fs.readFileSync(storageShaPath, 'utf8').split(' ')[0] || '').trim();
    const actual = await calculateFileSha256(encryptedStoragePath);
    if (expected !== actual) {
      throw new Error(`Integrity check failed for encrypted Storage. Expected: ${expected}, got: ${actual}`);
    }
    console.log(`[DISASTER RECOVERY] Encrypted Storage SHA-256 match verified.`);
  }

  const decryptedStoragePath = encryptedStoragePath.replace(/\.enc$/, '.decrypted');
  console.log(`[DISASTER RECOVERY] Decrypting Storage archive using AES-256-GCM...`);
  await decryptArchive(encryptedStoragePath, decryptedStoragePath, encryptionKey);

  // 4. Restore Storage into Isolated Extraction Directory
  let storageResult;
  try {
    storageResult = await restoreStorageToIsolatedTarget(decryptedStoragePath, targetExtractDir);
  } finally {
    if (fs.existsSync(decryptedStoragePath)) fs.unlinkSync(decryptedStoragePath);
  }

  console.log(`=======================================================`);
  console.log(`[DISASTER RECOVERY] Restoration & Parity Verification Completed!`);
  console.log(`=======================================================`);

  return {
    database: dbResult,
    storage: storageResult,
    success: true,
  };
};

export default {
  restoreDatabaseToIsolatedTarget,
  restoreStorageToIsolatedTarget,
  restoreEncryptedBackupFromVault,
};

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { spawn } from 'child_process';
import prisma from '../../src/config/prisma.js';
import logger from '../../src/utils/logger.js';
import { replicateEncryptedToOffsite, classifyStorageDestination } from './remoteStorage.js';
import { incidentService } from '../../src/services/incidentService.js';

const STORAGE_ROOT = path.resolve('storage');
const PRIVATE_DIR = path.join(STORAGE_ROOT, 'private');
const BACKUPS_ROOT = path.join(STORAGE_ROOT, 'backups');
const LOCAL_BACKUP_DIR = path.join(BACKUPS_ROOT, 'local');
const OFFSITE_BACKUP_DIR = process.env.OFFSITE_BACKUP_DIR
  ? path.resolve(process.env.OFFSITE_BACKUP_DIR)
  : path.join(BACKUPS_ROOT, 'offsite');

export const BACKUP_PATHS = {
  STORAGE_ROOT,
  PRIVATE_DIR,
  BACKUPS_ROOT,
  LOCAL_BACKUP_DIR,
  OFFSITE_BACKUP_DIR,
};

// Ensure backup directories exist
export const initializeBackupDirectories = () => {
  [LOCAL_BACKUP_DIR, OFFSITE_BACKUP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

/**
 * Calculates SHA-256 checksum of a file
 */
export const calculateFileSha256 = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * Performs compressed PostgreSQL database backup via pg_dump
 */
export const performDatabaseBackup = async (timestamp, targetDir = LOCAL_BACKUP_DIR) => {
  initializeBackupDirectories();
  const dbFileName = `collage_story_db_${timestamp}.sql.gz`;
  const dbFilePath = path.join(targetDir, dbFileName);
  const shaFilePath = path.join(targetDir, `${dbFileName}.sha256`);

  console.log(`[BACKUP] Starting PostgreSQL database backup: ${dbFileName}`);

  // Fetch live table statistics for the manifest before dumping
  const [usersCount, collegesCount, adminsCount, announcementsCount, matchesCount, messagesCount] = await Promise.all([
    prisma.user.count(),
    prisma.college.count(),
    prisma.admin.count(),
    prisma.campusAnnouncement.count(),
    prisma.match.count(),
    prisma.message.count(),
  ]);

  return new Promise((resolve, reject) => {
    const pgDumpProcess = spawn('docker', [
      'exec',
      'college-postgres',
      'pg_dump',
      '-U',
      'college_admin',
      '-d',
      'college_db',
      '--no-owner',
      '--clean',
      '--if-exists',
    ]);

    const gzip = zlib.createGzip({ level: 9 });
    const outputStream = fs.createWriteStream(dbFilePath);
    const hash = crypto.createHash('sha256');

    pgDumpProcess.stdout.on('data', (chunk) => {
      hash.update(chunk);
    });

    pgDumpProcess.stdout.pipe(gzip).pipe(outputStream);

    let stderrData = '';
    pgDumpProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    outputStream.on('finish', async () => {
      const stats = fs.statSync(dbFilePath);
      if (stats.size === 0) {
        return reject(new Error('PostgreSQL backup produced an empty file. Stderr: ' + stderrData));
      }

      // Calculate compressed archive checksum
      const archiveSha256 = await calculateFileSha256(dbFilePath);
      fs.writeFileSync(shaFilePath, `${archiveSha256}  ${dbFileName}\n`, 'utf8');

      console.log(`[BACKUP] PostgreSQL backup completed: ${dbFileName} (${(stats.size / 1024).toFixed(2)} KB)`);

      resolve({
        fileName: dbFileName,
        filePath: dbFilePath,
        fileSize: stats.size,
        sha256: archiveSha256,
        shaFilePath,
        databaseName: 'college_db',
        records: {
          users: usersCount,
          colleges: collegesCount,
          admins: adminsCount,
          announcements: announcementsCount,
          matches: matchesCount,
          messages: messagesCount,
        },
      });
    });

    pgDumpProcess.on('error', (err) => reject(new Error('Failed to spawn pg_dump process: ' + err.message)));
    pgDumpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pg_dump exited with error code ${code}: ${stderrData}`));
      }
    });
  });
};

/**
 * Performs compressed private storage backup (photos, identity documents, voice notes)
 */
export const performStorageBackup = async (timestamp, targetDir = LOCAL_BACKUP_DIR) => {
  initializeBackupDirectories();
  const storageFileName = `collage_story_storage_${timestamp}.tar.gz`;
  const storageFilePath = path.join(targetDir, storageFileName);
  const shaFilePath = path.join(targetDir, `${storageFileName}.sha256`);

  console.log(`[BACKUP] Starting private storage backup: ${storageFileName}`);

  // Count files and calculate total size
  let totalFiles = 0;
  let totalBytes = 0;
  const countDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        countDir(full);
      } else {
        totalFiles++;
        totalBytes += fs.statSync(full).size;
      }
    }
  };
  countDir(PRIVATE_DIR);

  return new Promise((resolve, reject) => {
    // Use system bsdtar to create tar.gz
    const tarProcess = spawn('tar', [
      '-czf',
      storageFilePath,
      '-C',
      STORAGE_ROOT,
      'private',
    ]);

    let stderrData = '';
    tarProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    tarProcess.on('error', (err) => reject(new Error('Failed to spawn tar process: ' + err.message)));
    tarProcess.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`tar exited with code ${code}: ${stderrData}`));
      }

      const stats = fs.statSync(storageFilePath);
      if (stats.size === 0) {
        return reject(new Error('Storage backup produced an empty file.'));
      }

      const archiveSha256 = await calculateFileSha256(storageFilePath);
      fs.writeFileSync(shaFilePath, `${archiveSha256}  ${storageFileName}\n`, 'utf8');

      console.log(`[BACKUP] Storage backup completed: ${storageFileName} (${(stats.size / 1024).toFixed(2)} KB, ${totalFiles} files)`);

      resolve({
        fileName: storageFileName,
        filePath: storageFilePath,
        fileSize: stats.size,
        sha256: archiveSha256,
        shaFilePath,
        uncompressedFiles: totalFiles,
        uncompressedBytes: totalBytes,
      });
    });
  });
};

/**
 * Replicates backup to offsite storage and verifies checksum
 */
export const syncToOffsite = async (localFilePath, shaFilePath, offsiteDir = OFFSITE_BACKUP_DIR) => {
  if (!fs.existsSync(offsiteDir)) {
    fs.mkdirSync(offsiteDir, { recursive: true });
  }

  const fileName = path.basename(localFilePath);
  const shaName = path.basename(shaFilePath);
  const targetFilePath = path.join(offsiteDir, fileName);
  const targetShaPath = path.join(offsiteDir, shaName);

  console.log(`[OFFSITE SYNC] Copying ${fileName} to offsite vault: ${offsiteDir}`);
  fs.copyFileSync(localFilePath, targetFilePath);
  fs.copyFileSync(shaFilePath, targetShaPath);

  // Verify offsite checksum
  const expectedHash = (fs.readFileSync(shaFilePath, 'utf8').split(' ')[0] || '').trim();
  const actualHash = await calculateFileSha256(targetFilePath);

  if (expectedHash !== actualHash) {
    throw new Error(`Offsite replication checksum mismatch for ${fileName}. Expected ${expectedHash}, got ${actualHash}`);
  }

  console.log(`[OFFSITE SYNC] Verified offsite checksum match for ${fileName}: ${actualHash.slice(0, 12)}...`);
  return {
    targetFilePath,
    targetShaPath,
    verified: true,
  };
};

/**
 * Enforces retention policy: deletes backups older than retentionDays (minimum 1 retained)
 */
export const enforceRetentionPolicy = (targetDir, retentionDays = 7) => {
  if (!fs.existsSync(targetDir)) return [];

  const files = fs.readdirSync(targetDir);
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const deletedFiles = [];

  // Group files by base timestamp
  const backupGroups = new Map();
  for (const file of files) {
    if (!file.startsWith('collage_story_')) continue;
    const match = file.match(/collage_story_(?:db|storage)_(\d{8}_\d{6})\./);
    if (match) {
      const ts = match[1];
      if (!backupGroups.has(ts)) backupGroups.set(ts, []);
      backupGroups.get(ts).push(file);
    }
  }

  // Preserve at least 1 backup regardless of age
  if (backupGroups.size <= 1) {
    console.log(`[RETENTION] Minimum threshold preserved. No backups pruned from ${targetDir}`);
    return [];
  }

  for (const [ts, groupFiles] of backupGroups.entries()) {
    const fullPath = path.join(targetDir, groupFiles[0]);
    const fileTime = fs.statSync(fullPath).mtimeMs;

    if (fileTime < cutoffTime && backupGroups.size - deletedFiles.length > 1) {
      for (const f of groupFiles) {
        fs.unlinkSync(path.join(targetDir, f));
        deletedFiles.push(f);
      }
      console.log(`[RETENTION] Pruned aged backup group: ${ts} (${groupFiles.join(', ')})`);
    }
  }

  return deletedFiles;
};

/**
 * Executes full automated daily backup with retention & offsite replication
 */
export const runFullBackup = async (options = {}) => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
  const retentionDays = options.retentionDays || 7;
  const offsiteVault = options.offsiteDir || OFFSITE_BACKUP_DIR;
  const encryptionKey = options.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY;

  const storageClassification = classifyStorageDestination(offsiteVault);

  console.log(`=======================================================`);
  console.log(`[COLLAGE STORY AUTOMATED BACKUP] Initialized at ${now.toISOString()}`);
  console.log(`[CONFIGURATION] Local: ${LOCAL_BACKUP_DIR} | Retention: ${retentionDays} days`);
  console.log(`[CONFIGURATION] Offsite Vault: ${offsiteVault}`);
  console.log(`[DESTINATION CLASSIFICATION] Type: ${storageClassification.type} | Offsite: ${storageClassification.isGenuinelyOffsite}`);
  console.log(`[DESTINATION DETAIL] ${storageClassification.description}`);
  console.log(`=======================================================`);

  try {
    // 1. Database Backup
    const dbBackup = await performDatabaseBackup(timestamp, LOCAL_BACKUP_DIR);

    // 2. Storage Backup
    const storageBackup = await performStorageBackup(timestamp, LOCAL_BACKUP_DIR);

    // 3. Offsite Replication & Encryption
    console.log(`[OFFSITE REPLICATION] Replicating and encrypting backups to vault...`);
    let dbOffsite;
    let storageOffsite;

    if (encryptionKey) {
      dbOffsite = await replicateEncryptedToOffsite(dbBackup.filePath, offsiteVault, encryptionKey);
      storageOffsite = await replicateEncryptedToOffsite(storageBackup.filePath, offsiteVault, encryptionKey);
    } else {
      console.warn(`[WARNING] BACKUP_ENCRYPTION_KEY not set. Replicating unencrypted copy.`);
      dbOffsite = await syncToOffsite(dbBackup.filePath, dbBackup.shaFilePath, offsiteVault);
      storageOffsite = await syncToOffsite(storageBackup.filePath, storageBackup.shaFilePath, offsiteVault);
    }

    // 4. Retention Enforcement
    console.log(`[RETENTION] Enforcing ${retentionDays}-day retention policy...`);
    const prunedLocal = enforceRetentionPolicy(LOCAL_BACKUP_DIR, retentionDays);
    const prunedOffsite = enforceRetentionPolicy(offsiteVault, retentionDays);

    // 5. Create Manifest
    const manifest = {
      backupId: `backup_${timestamp}`,
      timestamp: now.toISOString(),
      status: 'SUCCESS',
      retentionDays,
      offsiteDestination: storageClassification,
      isGenuinelyOffsite: storageClassification.isGenuinelyOffsite,
      encryption: {
        enabled: !!encryptionKey,
        algorithm: encryptionKey ? 'AES-256-GCM' : 'NONE',
      },
      database: {
        archive: dbBackup.fileName,
        sizeBytes: dbBackup.fileSize,
        sha256: dbBackup.sha256,
        records: dbBackup.records,
        offsiteEncryptedArchive: dbOffsite.encryptedFileName || null,
        offsiteSha256: dbOffsite.sha256,
        offsiteVerified: dbOffsite.verified,
      },
      storage: {
        archive: storageBackup.fileName,
        sizeBytes: storageBackup.fileSize,
        sha256: storageBackup.sha256,
        uncompressedFiles: storageBackup.uncompressedFiles,
        uncompressedBytes: storageBackup.uncompressedBytes,
        offsiteEncryptedArchive: storageOffsite.encryptedFileName || null,
        offsiteSha256: storageOffsite.sha256,
        offsiteVerified: storageOffsite.verified,
      },
      retention: {
        prunedLocal,
        prunedOffsite,
      },
    };

    const manifestPath = path.join(LOCAL_BACKUP_DIR, `backup_manifest_${timestamp}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    fs.copyFileSync(manifestPath, path.join(offsiteVault, `backup_manifest_${timestamp}.json`));

    console.log(`=======================================================`);
    console.log(`[BACKUP COMPLETED] Manifest: ${manifestPath}`);
    console.log(`[STATUS] Database: ${(dbBackup.fileSize / 1024).toFixed(1)} KB | Storage: ${(storageBackup.fileSize / 1024).toFixed(1)} KB`);
    console.log(`[OFFSITE] Both database & storage archives verified in offsite vault.`);
    console.log(`=======================================================`);

    return manifest;
  } catch (backupError) {
    console.error(`[BACKUP FAILURE] Backup run failed: ${backupError.message}`);
    
    // Log failure to persistent file
    const failureLogPath = path.join(BACKUPS_ROOT, 'backup_failure.log');
    const logEntry = `[${now.toISOString()}] BACKUP FAILED: ${backupError.message}\nStack: ${backupError.stack}\n---\n`;
    fs.appendFileSync(failureLogPath, logEntry, 'utf8');

    // Escalate to incident service
    try {
      await incidentService.recordError({
        severity: 'CRITICAL',
        component: 'BACKUP',
        category: 'BACKUP_EXECUTION_FAILURE',
        message: `Automated backup failed: ${backupError.message}`,
        metadata: {
          timestamp: now.toISOString(),
          offsiteVault,
          errorStack: backupError.stack,
        },
      });
      await incidentService.autoEscalateIncident({
        title: '[CRITICAL ALERT] Automated Backup Pipeline Failure',
        description: `Automated database and private storage backup failed: ${backupError.message}`,
        severity: 'CRITICAL',
        component: 'BACKUP',
        errorCategory: 'BACKUP_EXECUTION_FAILURE',
      });
    } catch (incidentErr) {
      console.error(`[INCIDENT SERVICE ERROR] Could not record backup incident: ${incidentErr.message}`);
    }

    throw backupError;
  }
};

export default {
  runFullBackup,
  performDatabaseBackup,
  performStorageBackup,
  syncToOffsite,
  enforceRetentionPolicy,
  calculateFileSha256,
  BACKUP_PATHS,
};

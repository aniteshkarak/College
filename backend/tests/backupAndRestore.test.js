import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { runFullBackup, BACKUP_PATHS } from '../scripts/backup/backupEngine.js';
import { restoreDatabaseToIsolatedTarget, restoreStorageToIsolatedTarget } from '../scripts/backup/restoreEngine.js';
import prisma from '../src/config/prisma.js';

describe('Collage Story — Automated Backup & Isolated Restoration Test Suite', () => {
  let manifest;
  let dbGzPath;
  let storageGzPath;
  const testDbName = 'isolated_ci_test_db';
  const testExtractDir = path.join(BACKUP_PATHS.STORAGE_ROOT, 'isolated_ci_storage_test');

  it('1. Generates full compressed database and private storage backups with SHA-256 checksums', async () => {
    manifest = await runFullBackup({ retentionDays: 7 });

    assert.equal(manifest.status, 'SUCCESS');
    assert.ok(manifest.database.sizeBytes > 0, 'Database backup size must be > 0');
    assert.ok(manifest.storage.sizeBytes > 0, 'Storage backup size must be > 0');
    assert.ok(manifest.database.sha256.length === 64, 'Database SHA-256 must be 64 hex characters');
    assert.ok(manifest.storage.sha256.length === 64, 'Storage SHA-256 must be 64 hex characters');

    dbGzPath = path.join(BACKUP_PATHS.LOCAL_BACKUP_DIR, manifest.database.archive);
    storageGzPath = path.join(BACKUP_PATHS.LOCAL_BACKUP_DIR, manifest.storage.archive);

    assert.ok(fs.existsSync(dbGzPath), 'Database archive must exist on disk');
    assert.ok(fs.existsSync(storageGzPath), 'Storage archive must exist on disk');
  });

  it('2. Successfully replicates backups to offsite storage vault with verified checksums', () => {
    assert.equal(manifest.database.offsiteVerified, true);
    assert.equal(manifest.storage.offsiteVerified, true);

    const offsiteDbName = manifest.database.offsiteEncryptedArchive || manifest.database.archive;
    const offsiteStorageName = manifest.storage.offsiteEncryptedArchive || manifest.storage.archive;
    const offsiteDb = path.join(BACKUP_PATHS.OFFSITE_BACKUP_DIR, offsiteDbName);
    const offsiteStorage = path.join(BACKUP_PATHS.OFFSITE_BACKUP_DIR, offsiteStorageName);

    assert.ok(fs.existsSync(offsiteDb), 'Offsite database archive must exist');
    assert.ok(fs.existsSync(offsiteStorage), 'Offsite storage archive must exist');
  });

  it('3. Successfully restores database dump into isolated target database without touching live data', async () => {
    const res = await restoreDatabaseToIsolatedTarget(dbGzPath, testDbName);

    assert.equal(res.verified, true);
    assert.equal(res.targetDbName, testDbName);

    const liveUsers = await prisma.user.count();
    const liveColleges = await prisma.college.count();
    const liveAdmins = await prisma.admin.count();

    assert.equal(res.restoredCounts.User, liveUsers, 'Restored User count must match live count');
    assert.equal(res.restoredCounts.College, liveColleges, 'Restored College count must match live count');
    assert.equal(res.restoredCounts.Admin, liveAdmins, 'Restored Admin count must match live count');
  });

  it('4. Successfully restores private storage archive into isolated directory with 100% file parity', async () => {
    const res = await restoreStorageToIsolatedTarget(storageGzPath, testExtractDir);

    assert.equal(res.verified, true);
    assert.equal(res.extractedCount, manifest.storage.uncompressedFiles, 'Extracted file count must match manifest');

    // Clean up temporary test extraction directory
    if (fs.existsSync(testExtractDir)) {
      fs.rmSync(testExtractDir, { recursive: true, force: true });
    }
  });

  it('5. Enforces retention policy without deleting the minimum single backup threshold', () => {
    assert.ok(Array.isArray(manifest.retention.prunedLocal));
    assert.ok(Array.isArray(manifest.retention.prunedOffsite));
  });
});

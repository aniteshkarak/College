import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { calculateFileSha256, encryptArchive, decryptArchive } from './cryptoUtils.js';
import logger from '../../src/utils/logger.js';

export const STORAGE_DESTINATION_TYPES = {
  CLOUD_OBJECT_STORAGE: 'CLOUD_OBJECT_STORAGE',
  INDEPENDENT_PHYSICAL_VOLUME: 'INDEPENDENT_PHYSICAL_VOLUME',
  SAME_DISK_STANDBY: 'SAME_DISK_STANDBY',
};

/**
 * Determines whether a given path is located on an independent physical volume
 * compared to the application storage root.
 */
export const classifyStorageDestination = (targetPath, appRoot = process.cwd()) => {
  if (process.env.S3_BUCKET || process.env.AWS_S3_BUCKET) {
    return {
      type: STORAGE_DESTINATION_TYPES.CLOUD_OBJECT_STORAGE,
      isGenuinelyOffsite: true,
      description: 'Cloud object storage (S3-compatible remote bucket)',
    };
  }

  const resolvedTarget = path.resolve(targetPath);
  const resolvedApp = path.resolve(appRoot);

  const targetRoot = path.parse(resolvedTarget).root.toUpperCase();
  const appRootDrive = path.parse(resolvedApp).root.toUpperCase();

  if (targetRoot !== appRootDrive) {
    return {
      type: STORAGE_DESTINATION_TYPES.INDEPENDENT_PHYSICAL_VOLUME,
      isGenuinelyOffsite: true,
      description: `Independent physical drive/volume: ${targetRoot} (Application on: ${appRootDrive})`,
      targetRoot,
      appRootDrive,
    };
  }

  return {
    type: STORAGE_DESTINATION_TYPES.SAME_DISK_STANDBY,
    isGenuinelyOffsite: false,
    description: `Same physical drive (${appRootDrive}). WARNING: Not disaster-proof if physical disk fails!`,
    targetRoot,
    appRootDrive,
  };
};

/**
 * Encrypts and replicates an archive to the offsite vault, validating SHA-256 checksums
 */
export const replicateEncryptedToOffsite = async (
  localFilePath,
  offsiteVaultDir,
  encryptionKey = process.env.BACKUP_ENCRYPTION_KEY
) => {
  if (!encryptionKey) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required for offsite replication and encryption.');
  }

  if (!fs.existsSync(offsiteVaultDir)) {
    fs.mkdirSync(offsiteVaultDir, { recursive: true });
  }

  const destinationClassification = classifyStorageDestination(offsiteVaultDir);
  const baseFileName = path.basename(localFilePath);
  const encFileName = `${baseFileName}.enc`;
  const tempEncPath = path.join(path.dirname(localFilePath), encFileName);
  const destEncPath = path.join(offsiteVaultDir, encFileName);
  const destShaPath = path.join(offsiteVaultDir, `${encFileName}.sha256`);

  console.log(`[OFFSITE REPLICATION] Encrypting ${baseFileName} with AES-256-GCM...`);
  
  // 1. Encrypt archive locally using AES-256-GCM
  const { sha256: localEncSha256, encryptedBytes } = await encryptArchive(localFilePath, tempEncPath, encryptionKey);

  // 2. Replicate encrypted file to offsite vault
  console.log(`[OFFSITE REPLICATION] Replicating encrypted payload (${(encryptedBytes / 1024).toFixed(2)} KB) to ${destEncPath}...`);
  fs.copyFileSync(tempEncPath, destEncPath);

  // 3. Verify destination checksum
  const remoteSha256 = await calculateFileSha256(destEncPath);
  if (localEncSha256 !== remoteSha256) {
    // Remove corrupt destination copy
    if (fs.existsSync(destEncPath)) fs.unlinkSync(destEncPath);
    throw new Error(`Offsite replication checksum mismatch for ${encFileName}. Expected ${localEncSha256}, got ${remoteSha256}`);
  }

  // 4. Write destination checksum file
  fs.writeFileSync(destShaPath, `${remoteSha256}  ${encFileName}\n`, 'utf8');

  // 5. Clean up temporary local encrypted file
  if (fs.existsSync(tempEncPath)) {
    fs.unlinkSync(tempEncPath);
  }

  console.log(`[OFFSITE REPLICATION] Integrity verified! SHA-256: ${remoteSha256.slice(0, 16)}...`);

  return {
    baseFileName,
    encryptedFileName: encFileName,
    destEncPath,
    destShaPath,
    encryptedBytes,
    sha256: remoteSha256,
    storageClassification: destinationClassification,
    verified: true,
  };
};

export default {
  STORAGE_DESTINATION_TYPES,
  classifyStorageDestination,
  replicateEncryptedToOffsite,
};

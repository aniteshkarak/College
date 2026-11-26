import fs from 'fs';
import crypto from 'crypto';

/**
 * Derives a 32-byte key from a secret string or key
 */
export const deriveKey = (secretKey) => {
  if (!secretKey) {
    throw new Error('Missing backup encryption key. BACKUP_ENCRYPTION_KEY must be provided.');
  }
  return crypto.createHash('sha256').update(secretKey).digest();
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
 * Encrypts a file using AES-256-GCM
 * Output format: [12-byte IV][16-byte AuthTag][Ciphertext]
 */
export const encryptFile = (sourcePath, destPath, secretKey) => {
  return new Promise((resolve, reject) => {
    const key = deriveKey(secretKey);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const inputStream = fs.createReadStream(sourcePath);
    const outputStream = fs.createWriteStream(destPath);

    // Write IV first
    outputStream.write(iv);

    inputStream.pipe(cipher, { end: false });

    cipher.on('data', (chunk) => {
      outputStream.write(chunk);
    });

    cipher.on('end', () => {
      // Get authentication tag (16 bytes) and write it
      const authTag = cipher.getAuthTag();
      // We write auth tag right after IV before payload or append
      // To keep standard streaming: write tag at end of file header or stream
    });

    // Clean streaming approach with buffer for archives
    inputStream.on('error', reject);
    outputStream.on('error', reject);
  });
};

/**
 * Synchronous / Buffer-based AES-256-GCM for robust archive encryption
 * File structure: [MAGIC_BYTES: 'CS_ENC_v1'][12-byte IV][16-byte Tag][Encrypted Data]
 */
export const encryptArchive = async (sourcePath, destPath, secretKey) => {
  const key = deriveKey(secretKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const fileData = await fs.promises.readFile(sourcePath);
  const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()]);
  const tag = cipher.getAuthTag();

  const magic = Buffer.from('CS_ENC_v1', 'utf8'); // 9 bytes
  const header = Buffer.concat([magic, iv, tag]); // 9 + 12 + 16 = 37 bytes
  const finalBuffer = Buffer.concat([header, encrypted]);

  await fs.promises.writeFile(destPath, finalBuffer);

  const sha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');
  return {
    destPath,
    encryptedBytes: finalBuffer.length,
    sha256,
  };
};

/**
 * Decrypts an AES-256-GCM encrypted archive
 */
export const decryptArchive = async (sourcePath, destPath, secretKey) => {
  const key = deriveKey(secretKey);
  const buffer = await fs.promises.readFile(sourcePath);

  const magic = buffer.subarray(0, 9).toString('utf8');
  if (magic !== 'CS_ENC_v1') {
    throw new Error(`Invalid encrypted archive header. Magic bytes: ${magic}`);
  }

  const iv = buffer.subarray(9, 21); // 12 bytes
  const tag = buffer.subarray(21, 37); // 16 bytes
  const ciphertext = buffer.subarray(37);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  await fs.promises.writeFile(destPath, decrypted);

  const sha256 = crypto.createHash('sha256').update(decrypted).digest('hex');
  return {
    destPath,
    decryptedBytes: decrypted.length,
    sha256,
  };
};

export default {
  deriveKey,
  calculateFileSha256,
  encryptArchive,
  decryptArchive,
};

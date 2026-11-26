import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import S3StorageAdapter from '../scripts/backup/s3StorageAdapter.js';
import { encryptArchive, decryptArchive, calculateFileSha256 } from '../scripts/backup/cryptoUtils.js';

describe('Collage Story — S3-Compatible Cloud Storage Adapter & Encryption Verification', () => {
  let server;
  let port;
  let mockEndpoint;
  const mockBucket = 'collage-story-cloud-vault';
  const mockStorage = new Map();
  const testDir = path.resolve('storage/test_s3_mock');
  const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  before(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    // Ephemeral HTTP mock S3 server
    server = http.createServer((req, res) => {
      const authHeader = req.headers['authorization'] || '';
      const contentSha = req.headers['x-amz-content-sha256'] || '';
      const urlPath = req.url;

      // Verify SigV4 header format
      if (!authHeader.startsWith('AWS4-HMAC-SHA256')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('AccessDenied: Missing or invalid SigV4 authorization');
      }

      const key = urlPath.replace(`/${mockBucket}/`, '');

      if (req.method === 'PUT') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          const computedHash = crypto.createHash('sha256').update(body).digest('hex');

          if (contentSha && contentSha !== computedHash) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('BadDigest: Checksum mismatch');
          }

          mockStorage.set(key, body);
          res.writeHead(200, { ETag: `"${computedHash}"` });
          res.end();
        });
      } else if (req.method === 'GET') {
        if (!mockStorage.has(key)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('NoSuchKey');
        }
        const data = mockStorage.get(key);
        res.writeHead(200, { 'Content-Length': data.length });
        res.end(data);
      } else {
        res.writeHead(405);
        res.end();
      }
    });

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        mockEndpoint = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) await new Promise((res) => server.close(res));
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('1. Correctly calculates AWS Signature Version 4 (SigV4) headers', () => {
    const adapter = new S3StorageAdapter({
      bucket: 'test-bucket',
      region: 'us-east-1',
      endpoint: 's3.amazonaws.com',
      accessKeyId: 'AKIA_MOCK_TEST_ID',
      secretAccessKey: 'SECRET_MOCK_KEY_12345',
    });

    const headers = {};
    adapter.signRequest({
      method: 'PUT',
      urlStr: 'https://s3.amazonaws.com/test-bucket/sample.sql.gz.enc',
      headers,
      payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    assert.ok(headers['Authorization'].startsWith('AWS4-HMAC-SHA256 Credential=AKIA_MOCK_TEST_ID/'));
    assert.match(headers['Authorization'], /Signature=[0-9a-f]{64}/);
    assert.equal(headers['x-amz-content-sha256'], 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('2. Encrypts payload with AES-256-GCM, uploads to S3, and verifies checksum', async () => {
    // 1. Create original source file
    const sourcePath = path.join(testDir, 'database_dump.sql');
    const originalText = '-- Collage Story PostgreSQL Production Dump\nCREATE TABLE "User" (id UUID PRIMARY KEY);\nINSERT INTO "User" VALUES (\'00000000-0000-0000-0000-000000000001\');';
    fs.writeFileSync(sourcePath, originalText, 'utf8');

    // 2. Encrypt with AES-256-GCM
    const encPath = path.join(testDir, 'database_dump.sql.enc');
    const { sha256: encSha256 } = await encryptArchive(sourcePath, encPath, encryptionKey);

    // 3. Upload to S3-compatible mock endpoint
    const adapter = new S3StorageAdapter({
      bucket: mockBucket,
      region: 'us-east-1',
      endpoint: mockEndpoint,
      accessKeyId: 'OCI_S3_KEY_TEST',
      secretAccessKey: 'OCI_S3_SECRET_TEST',
    });

    const uploadRes = await adapter.uploadFile(encPath, 'backups/20261126/database_dump.sql.enc', encSha256);
    assert.equal(uploadRes.sha256, encSha256);
    assert.equal(uploadRes.key, 'backups/20261126/database_dump.sql.enc');
  });

  it('3. Downloads encrypted archive from S3, verifies integrity, and decrypts with 100% bit parity', async () => {
    const adapter = new S3StorageAdapter({
      bucket: mockBucket,
      region: 'us-east-1',
      endpoint: mockEndpoint,
      accessKeyId: 'OCI_S3_KEY_TEST',
      secretAccessKey: 'OCI_S3_SECRET_TEST',
    });

    const downloadedEncPath = path.join(testDir, 'downloaded.sql.enc');
    const downloadRes = await adapter.downloadFile('backups/20261126/database_dump.sql.enc', downloadedEncPath);

    assert.ok(fs.existsSync(downloadedEncPath));
    const downloadedSha = await calculateFileSha256(downloadedEncPath);
    assert.equal(downloadRes.sha256, downloadedSha);

    // Decrypt downloaded archive
    const restoredPlainTextPath = path.join(testDir, 'restored.sql');
    await decryptArchive(downloadedEncPath, restoredPlainTextPath, encryptionKey);

    const originalContent = fs.readFileSync(path.join(testDir, 'database_dump.sql'), 'utf8');
    const restoredContent = fs.readFileSync(restoredPlainTextPath, 'utf8');

    assert.equal(restoredContent, originalContent, 'Restored content must match original source exactly (100% bit parity)');
  });

  it('4. Rejects upload when local SHA-256 does not match expected hash', async () => {
    const adapter = new S3StorageAdapter({
      bucket: mockBucket,
      region: 'us-east-1',
      endpoint: mockEndpoint,
      accessKeyId: 'OCI_S3_KEY_TEST',
      secretAccessKey: 'OCI_S3_SECRET_TEST',
    });

    const sourcePath = path.join(testDir, 'database_dump.sql');
    await assert.rejects(
      async () => {
        await adapter.uploadFile(sourcePath, 'corrupt.sql', '0000000000000000000000000000000000000000000000000000000000000000');
      },
      /does not match expected hash/
    );
  });
});

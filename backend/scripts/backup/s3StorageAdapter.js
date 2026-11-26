import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Lightweight, zero-dependency S3-Compatible Cloud Storage Client
 * Supports Oracle Cloud Infrastructure (OCI) Object Storage, Cloudflare R2, AWS S3, MinIO, and Backblaze B2
 * Uses AWS Signature Version 4 (SigV4) with streaming and SHA-256 verification.
 */

// Helper to HMAC-SHA256 hash
const hmac = (key, string) => crypto.createHmac('sha256', key).update(string).digest();
const hash = (string) => crypto.createHash('sha256').update(string).digest('hex');

export class S3StorageAdapter {
  constructor(config = {}) {
    this.bucket = config.bucket || process.env.S3_BUCKET;
    this.region = config.region || process.env.S3_REGION || 'us-east-1';
    this.endpoint = config.endpoint || process.env.S3_ENDPOINT || 's3.amazonaws.com';
    this.accessKeyId = config.accessKeyId || process.env.S3_ACCESS_KEY_ID;
    this.secretAccessKey = config.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY;
    this.forcePathStyle = config.forcePathStyle ?? true;
  }

  isConfigured() {
    return Boolean(this.bucket && this.accessKeyId && this.secretAccessKey);
  }

  getSignatureKey(key, dateStamp, regionName, serviceName = 's3') {
    const kDate = hmac('AWS4' + key, dateStamp);
    const kRegion = hmac(kDate, regionName);
    const kService = hmac(kRegion, serviceName);
    const kSigning = hmac(kService, 'aws4_request');
    return kSigning;
  }

  signRequest({ method, urlStr, headers, payloadHash }) {
    const parsedUrl = new URL(urlStr);
    const host = parsedUrl.host;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    headers['host'] = host;
    headers['x-amz-date'] = amzDate;
    headers['x-amz-content-sha256'] = payloadHash;

    const canonicalUri = parsedUrl.pathname || '/';
    const canonicalQuerystring = Array.from(parsedUrl.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const canonicalHeaders = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
      .map((k) => `${k}:${headers[k].trim()}\n`)
      .join('');

    const signedHeaders = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
      .join(';');

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      hash(canonicalRequest),
    ].join('\n');

    const signingKey = this.getSignatureKey(this.secretAccessKey, dateStamp, this.region);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    headers['Authorization'] = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return headers;
  }

  async uploadFile(localFilePath, s3Key, sha256Expected) {
    if (!this.isConfigured()) {
      throw new Error('S3 Cloud Storage adapter is not configured. Missing credentials or bucket name.');
    }

    const fileBuffer = await fs.promises.readFile(localFilePath);
    const payloadHash = hash(fileBuffer);

    if (sha256Expected && payloadHash !== sha256Expected) {
      throw new Error(`Local file hash ${payloadHash} does not match expected hash ${sha256Expected}`);
    }

    const endpointUrl = this.endpoint.startsWith('http') ? this.endpoint : `https://${this.endpoint}`;
    const urlStr = `${endpointUrl}/${this.bucket}/${s3Key}`;

    const headers = {
      'content-length': fileBuffer.length.toString(),
      'content-type': 'application/octet-stream',
    };

    this.signRequest({
      method: 'PUT',
      urlStr,
      headers,
      payloadHash,
    });

    console.log(`[S3 CLOUD BACKUP] Uploading ${s3Key} (${(fileBuffer.length / 1024).toFixed(2)} KB) to ${this.bucket}...`);

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlStr);
      const transport = parsedUrl.protocol === 'http:' ? http : https;

      const req = transport.request(
        parsedUrl,
        {
          method: 'PUT',
          headers,
        },
        (res) => {
          let responseBody = '';
          res.on('data', (d) => (responseBody += d));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[S3 CLOUD BACKUP] Successfully uploaded ${s3Key}. HTTP Status: ${res.statusCode}`);
              resolve({
                bucket: this.bucket,
                key: s3Key,
                sha256: payloadHash,
                bytes: fileBuffer.length,
                etag: res.headers['etag'] || null,
              });
            } else {
              reject(new Error(`S3 upload failed with HTTP ${res.statusCode}: ${responseBody}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(new Error(`S3 network error: ${err.message}`)));
      req.write(fileBuffer);
      req.end();
    });
  }

  async downloadFile(s3Key, destLocalPath) {
    if (!this.isConfigured()) {
      throw new Error('S3 Cloud Storage adapter is not configured.');
    }

    const endpointUrl = this.endpoint.startsWith('http') ? this.endpoint : `https://${this.endpoint}`;
    const urlStr = `${endpointUrl}/${this.bucket}/${s3Key}`;
    const payloadHash = hash('');

    const headers = {};
    this.signRequest({
      method: 'GET',
      urlStr,
      headers,
      payloadHash,
    });

    console.log(`[S3 CLOUD RESTORE] Downloading ${s3Key} from ${this.bucket}...`);

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlStr);
      const transport = parsedUrl.protocol === 'http:' ? http : https;

      const req = transport.request(
        parsedUrl,
        {
          method: 'GET',
          headers,
        },
        (res) => {
          if (res.statusCode !== 200) {
            let body = '';
            res.on('data', (d) => (body += d));
            res.on('end', () => reject(new Error(`S3 download failed with HTTP ${res.statusCode}: ${body}`)));
            return;
          }

          const outStream = fs.createWriteStream(destLocalPath);
          const shaHash = crypto.createHash('sha256');

          res.on('data', (chunk) => shaHash.update(chunk));
          res.pipe(outStream);

          outStream.on('finish', () => {
            const actualSha = shaHash.digest('hex');
            console.log(`[S3 CLOUD RESTORE] Downloaded ${s3Key} successfully. SHA-256: ${actualSha.slice(0, 16)}...`);
            resolve({
              localPath: destLocalPath,
              sha256: actualSha,
            });
          });

          outStream.on('error', reject);
        }
      );

      req.on('error', (err) => reject(new Error(`S3 download network error: ${err.message}`)));
      req.end();
    });
  }
}

export default S3StorageAdapter;

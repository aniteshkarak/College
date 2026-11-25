import fs from 'fs';
import os from 'os';
import path from 'path';
import { checkDatabaseConnection } from '../config/prisma.js';
import { checkRedisConnection } from '../config/redis.js';
import { STORAGE_PATHS } from '../config/storage.js';
import { getIo } from './socketService.js';
import prisma from '../config/prisma.js';

export const getLivenessStatus = () => {
  return {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'Collage Story Backend API',
    mode: 'live',
  };
};

export const getReadinessStatus = async () => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const isReady = dbHealth.status === 'HEALTHY';

  return {
    status: isReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbHealth,
    redis: redisHealth,
  };
};

export const getDatabaseHealth = async () => {
  const startTime = Date.now();
  const result = await checkDatabaseConnection();
  return {
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    ...result,
  };
};

export const getRedisHealth = async () => {
  const startTime = Date.now();
  const result = await checkRedisConnection();
  return {
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    ...result,
  };
};

/**
 * Verifies local storage directories exist and are writable
 */
export const checkStorageHealth = () => {
  const results = {};
  let allHealthy = true;

  const dirs = {
    photos: STORAGE_PATHS.PHOTOS_DIR,
    thumbnails: STORAGE_PATHS.THUMBNAILS_DIR,
    discovery: STORAGE_PATHS.DISCOVERY_DIR,
    documents: STORAGE_PATHS.DOCUMENTS_DIR,
  };

  for (const [key, dirPath] of Object.entries(dirs)) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      // Test writability with a volatile probe file
      const testFile = path.join(dirPath, `.probe_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);

      results[key] = { status: 'AVAILABLE', path: dirPath, writable: true };
    } catch (err) {
      allHealthy = false;
      results[key] = { status: 'DEGRADED', path: dirPath, error: err.message };
    }
  }

  return {
    status: allHealthy ? 'HEALTHY' : 'DEGRADED',
    directories: results,
    vaults: results,
  };
};

/**
 * Checks active Socket.IO connections & adapter
 */
export const checkSocketHealth = () => {
  try {
    const io = getIo();
    if (!io) {
      return { status: 'OFFLINE', message: 'Socket.IO server instance not initialized', clientCount: 0 };
    }
    const clientCount = io.engine?.clientsCount || 0;
    return {
      status: 'HEALTHY',
      clientCount,
      adapter: io.adapter?.constructor?.name || 'DefaultAdapter',
      transports: ['websocket', 'polling'],
    };
  } catch (err) {
    return { status: 'DEGRADED', message: err.message, clientCount: 0 };
  }
};

/**
 * Comprehensive SRE System Health Overview
 */
export const getHealthStatus = async () => {
  const startTime = Date.now();
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const storageHealth = checkStorageHealth();
  const socketHealth = checkSocketHealth();

  const isHealthy =
    dbHealth.status === 'HEALTHY' &&
    redisHealth.status === 'HEALTHY' &&
    storageHealth.status === 'HEALTHY';

  const durationMs = Date.now() - startTime;
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: durationMs,
    version: '1.0.0',
    app: 'Collage Story Backend API',
    services: {
      database: {
        engine: 'PostgreSQL 17',
        status: dbHealth.status,
        message: dbHealth.message,
      },
      cache: {
        engine: 'Redis 7',
        status: redisHealth.status,
        message: redisHealth.message,
        latencyMs: redisHealth.latencyMs,
      },
      redis: {
        engine: 'Redis 7',
        status: redisHealth.status,
        message: redisHealth.message,
        latencyMs: redisHealth.latencyMs,
      },
      socketIo: socketHealth,
      storage: storageHealth,
      email: {
        status: process.env.SMTP_HOST ? 'CONFIGURED' : 'LOCAL_PREVIEW',
        provider: process.env.SMTP_HOST || 'Local Nodemailer Dispatch Preview',
      },
      backgroundWorkers: {
        status: 'HEALTHY',
        mode: 'Inline Event Driven + Redis PubSub',
      },
    },
    resources: {
      memory: {
        rssMb: parseFloat((memUsage.rss / (1024 * 1024)).toFixed(2)),
        heapUsedMb: parseFloat((memUsage.heapUsed / (1024 * 1024)).toFixed(2)),
        heapTotalMb: parseFloat((memUsage.heapTotal / (1024 * 1024)).toFixed(2)),
      },
      systemMemory: {
        totalMb: parseFloat((totalMem / (1024 * 1024)).toFixed(2)),
        usedMb: parseFloat((usedMem / (1024 * 1024)).toFixed(2)),
        freeMb: parseFloat((freeMem / (1024 * 1024)).toFixed(2)),
        usedPercent: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
      },
    },
    system: {
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      nodeVersion: process.version,
      memory: {
        processRssMb: (memUsage.rss / (1024 * 1024)).toFixed(2),
        processHeapUsedMb: (memUsage.heapUsed / (1024 * 1024)).toFixed(2),
        processHeapTotalMb: (memUsage.heapTotal / (1024 * 1024)).toFixed(2),
        systemTotalMb: (totalMem / (1024 * 1024)).toFixed(2),
        systemUsedMb: (usedMem / (1024 * 1024)).toFixed(2),
        systemFreeMb: (freeMem / (1024 * 1024)).toFixed(2),
        systemMemoryUsagePercent: ((usedMem / totalMem) * 100).toFixed(1),
      },
      loadAverage: os.loadavg(),
    },
  };
};

export default {
  getLivenessStatus,
  getReadinessStatus,
  getDatabaseHealth,
  getRedisHealth,
  getHealthStatus,
  checkStorageHealth,
  checkSocketHealth,
};

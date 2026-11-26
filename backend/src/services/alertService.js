import os from 'os';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import incidentService, { INCIDENT_SEVERITY } from './incidentService.js';
import { checkDatabaseConnection } from '../config/prisma.js';
import { checkRedisConnection } from '../config/redis.js';
import { checkStorageHealth } from './healthService.js';

// Alert Rule Configurations with Defaults
export const ALERT_CONFIG = {
  MEMORY_USAGE_PERCENT_THRESHOLD: 85,
  FAILED_LOGINS_THRESHOLD: 10,
  FAILED_LOGINS_WINDOW_MINUTES: 5,
  ERROR_RATE_PERCENT_THRESHOLD: 5.0,
  DEDUP_COOLOFF_MINUTES: 15,
};

// In-memory cool-off tracker to prevent alert storms
const alertCooldowns = new Map();

export const alertService = {
  ALERT_CONFIG,

  /**
   * Evaluates all active system rules and returns live status
   */
  evaluateSystemAlerts: async () => {
    const alerts = [];
    const now = Date.now();

    // 1. Database Connectivity Check
    const db = await checkDatabaseConnection();
    if (db.status !== 'HEALTHY') {
      alerts.push({
        rule: 'DATABASE_OFFLINE',
        severity: INCIDENT_SEVERITY.CRITICAL,
        message: `PostgreSQL connection failed: ${db.message}`,
        component: 'DATABASE',
      });
    }

    // 2. Redis Cache & Socket Adapter Check
    const redis = await checkRedisConnection();
    if (redis.status !== 'HEALTHY') {
      alerts.push({
        rule: 'REDIS_OFFLINE',
        severity: INCIDENT_SEVERITY.HIGH,
        message: `Redis connection failed: ${redis.message}`,
        component: 'REDIS',
      });
    }

    // 3. Storage Writability Check
    const storage = checkStorageHealth();
    if (storage.status !== 'HEALTHY') {
      alerts.push({
        rule: 'STORAGE_UNAVAILABLE',
        severity: INCIDENT_SEVERITY.HIGH,
        message: `Storage directory writability compromised.`,
        component: 'STORAGE',
      });
    }

    // 4. System Memory Pressure Check
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
    if (memUsagePercent >= ALERT_CONFIG.MEMORY_USAGE_PERCENT_THRESHOLD) {
      alerts.push({
        rule: 'HIGH_MEMORY_PRESSURE',
        severity: INCIDENT_SEVERITY.MEDIUM,
        message: `System memory utilization at ${memUsagePercent.toFixed(1)}% (Threshold: ${ALERT_CONFIG.MEMORY_USAGE_PERCENT_THRESHOLD}%)`,
        component: 'SYSTEM',
      });
    }

    // 5. Brute-Force / Repeated Auth Failures Check (Last 5 minutes)
    const fiveMinutesAgo = new Date(now - ALERT_CONFIG.FAILED_LOGINS_WINDOW_MINUTES * 60 * 1000);
    const recentAuthErrors = await prisma.systemErrorLog.count({
      where: {
        component: 'AUTH',
        category: 'LOGIN_FAILURE',
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentAuthErrors >= ALERT_CONFIG.FAILED_LOGINS_THRESHOLD) {
      alerts.push({
        rule: 'REPEATED_AUTHENTICATION_FAILURES',
        severity: INCIDENT_SEVERITY.HIGH,
        message: `High volume of authentication failures detected: ${recentAuthErrors} attempts in the last 5 minutes.`,
        component: 'AUTH',
      });
    }

    // 6. Daily Backup Recency & Integrity Check
    const localBackupDir = path.resolve('storage/backups/local');
    let backupHealthy = true;
    let backupMessage = 'Backups up to date';
    if (!fs.existsSync(localBackupDir)) {
      backupHealthy = false;
      backupMessage = 'Local backup directory does not exist.';
    } else {
      const manifests = fs.readdirSync(localBackupDir).filter(f => f.startsWith('backup_manifest_') && f.endsWith('.json'));
      if (manifests.length === 0) {
        backupHealthy = false;
        backupMessage = 'No backup manifests found. System has never completed an automated backup.';
      } else {
        manifests.sort().reverse();
        const latestManifestPath = path.join(localBackupDir, manifests[0]);
        const mtime = fs.statSync(latestManifestPath).mtimeMs;
        const hoursSinceBackup = (now - mtime) / (1000 * 60 * 60);
        if (hoursSinceBackup > 26) {
          backupHealthy = false;
          backupMessage = `Last successful backup was ${hoursSinceBackup.toFixed(1)} hours ago (Threshold: 26 hours).`;
        }
      }
    }

    if (!backupHealthy) {
      alerts.push({
        rule: 'BACKUP_OVERDUE',
        severity: INCIDENT_SEVERITY.CRITICAL,
        message: backupMessage,
        component: 'BACKUP',
      });
    }

    // Process alerts through deduplication and escalate to incidents
    for (const alert of alerts) {
      const cooldownKey = `${alert.rule}_${alert.component}`;
      const lastTriggered = alertCooldowns.get(cooldownKey) || 0;

      if (now - lastTriggered > ALERT_CONFIG.DEDUP_COOLOFF_MINUTES * 60 * 1000) {
        alertCooldowns.set(cooldownKey, now);

        // Auto-create incident if severity is HIGH or CRITICAL
        if (alert.severity === INCIDENT_SEVERITY.CRITICAL || alert.severity === INCIDENT_SEVERITY.HIGH) {
          await incidentService.autoEscalateIncident({
            title: `[ALERT TRIGGERED] ${alert.rule}`,
            description: alert.message,
            severity: alert.severity,
            component: alert.component,
            errorCategory: alert.rule,
          });
        }
      }
    }

    return {
      evaluatedAt: new Date().toISOString(),
      activeAlertsCount: alerts.length,
      alerts,
      thresholds: ALERT_CONFIG,
      checks: {
        databaseUp: db.status === 'HEALTHY',
        redisUp: redis.status === 'HEALTHY',
        storageWritable: storage.status === 'HEALTHY',
        memoryHealthy: memUsagePercent < ALERT_CONFIG.MEMORY_USAGE_PERCENT_THRESHOLD,
        backupUpToDate: backupHealthy,
      },
    };
  },
};

export default alertService;

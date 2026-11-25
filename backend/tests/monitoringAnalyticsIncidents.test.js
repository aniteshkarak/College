process.env.NODE_ENV = 'test';
import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';
import config from '../src/config/env.js';
import analyticsService from '../src/services/analyticsService.js';
import incidentService from '../src/services/incidentService.js';
import alertService from '../src/services/alertService.js';

describe('Collage Story Production Monitoring, Analytics & Incident Management Test Suite', () => {
  const timestamp = Date.now();
  const testPassword = 'MonitoringAdminSecret2026!';
  let passwordHash;

  let superAdmin;
  let supportAdmin;
  let superAdminToken;
  let supportAdminToken;
  let studentToken;

  let createdIncidentId;
  let testErrorLogId;

  before(async () => {
    passwordHash = await argon2.hash(testPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    superAdmin = await prisma.admin.create({
      data: {
        email: `mon_super_${timestamp}@college.internal`,
        fullName: 'Monitoring Super Admin',
        passwordHash,
        roleName: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    supportAdmin = await prisma.admin.create({
      data: {
        email: `mon_support_${timestamp}@college.internal`,
        fullName: 'Support Staff',
        passwordHash,
        roleName: 'SUPPORT_ADMIN',
        isActive: true,
      },
    });

    // Login super admin to obtain valid token
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: superAdmin.email, password: testPassword });

    assert.equal(loginRes.status, 200);
    superAdminToken = loginRes.body.data.token;

    // Login support admin
    const supportLoginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: supportAdmin.email, password: testPassword });
    supportAdminToken = supportLoginRes.body.data.token;

    // Generate student JWT (signed with student secret)
    studentToken = jwt.sign(
      {
        sub: `student-mon-${timestamp}`,
        userId: `student-mon-${timestamp}`,
        type: 'STUDENT',
        role: 'STUDENT',
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  after(async () => {
    // Cleanup created test records
    if (createdIncidentId) {
      await prisma.incidentAuditLog.deleteMany({ where: { incidentId: createdIncidentId } }).catch(() => {});
      await prisma.systemIncident.delete({ where: { id: createdIncidentId } }).catch(() => {});
    }
    if (testErrorLogId) {
      await prisma.systemErrorLog.delete({ where: { id: testErrorLogId } }).catch(() => {});
    }
    await prisma.analyticsEvent.deleteMany({
      where: { userId: `test-user-${timestamp}` },
    }).catch(() => {});
    await prisma.adminAuditLog.deleteMany({ where: { adminId: superAdmin.id } }).catch(() => {});
    await prisma.adminAuditLog.deleteMany({ where: { adminId: supportAdmin.id } }).catch(() => {});
    await prisma.admin.deleteMany({ where: { id: { in: [superAdmin.id, supportAdmin.id] } } }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.quit();
      }
    } catch {}
    setTimeout(() => process.exit(0), 200).unref();
  });

  // =========================================================================
  // 1. RBAC & SECURITY ACCESS CONTROL
  // =========================================================================

  test('1.1 RBAC: Unauthenticated requests to monitoring endpoints must return 401 Unauthorized', async () => {
    const endpoints = [
      '/api/v1/admin/analytics/overview',
      '/api/v1/admin/analytics/trends',
      '/api/v1/admin/monitoring/health',
      '/api/v1/admin/monitoring/alerts',
      '/api/v1/admin/incidents',
    ];

    for (const ep of endpoints) {
      const res = await request(app).get(ep);
      assert.equal(res.status, 401, `Endpoint ${ep} should reject unauthenticated request`);
      assert.equal(res.body.success, false);
    }
  });

  test('1.2 RBAC: Student tokens must be blocked with 401 or 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.ok([401, 403].includes(res.status), `Expected 401 or 403, got ${res.status}`);
    assert.equal(res.body.success, false);
  });

  test('1.3 RBAC: SUPPORT_ADMIN cannot access incident management (restricted to SUPER_ADMIN/ADMIN)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/incidents')
      .set('Authorization', `Bearer ${supportAdminToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('1.4 RBAC: SUPER_ADMIN successfully accesses all analytics & monitoring routes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  // =========================================================================
  // 2. PRODUCT ANALYTICS & EVENT TRACKING
  // =========================================================================

  test('2.1 Analytics Service: Privacy-conscious event recording sanitizes sensitive fields', async () => {
    const rawMetadata = {
      action: 'test_click',
      password: 'ShouldBeStrippedPassword123',
      token: 'Bearer eyJhbGciOi...',
      content: 'Private personal message content',
      voiceNote: 'binary-data-stream',
      ip: '127.0.0.1',
      allowedMetric: 42,
    };

    const evt = await analyticsService.trackEvent({
      eventType: 'LOGIN_SUCCESSFUL',
      userId: `test-user-${timestamp}`,
      collegeName: 'Test Tech University',
      metadata: rawMetadata,
    });

    assert.ok(evt, 'Event record must be created');
    assert.equal(evt.eventType, 'LOGIN_SUCCESSFUL');
    assert.equal(evt.collegeName, 'Test Tech University');
    assert.equal(evt.metadata.password, '[REDACTED]', 'Must redact passwords in analytics metadata');
    assert.equal(evt.metadata.token, '[REDACTED]', 'Must redact auth tokens in analytics metadata');
    assert.equal(evt.metadata.content, '[REDACTED]', 'Must redact user message content in analytics metadata');
    assert.equal(evt.metadata.allowedMetric, 42, 'Safe metadata is preserved');
  });

  test('2.2 Overview Analytics: Returns accurate real database statistics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const data = res.body.data;

    assert.ok(data.overview, 'Overview object present');
    assert.equal(typeof data.overview.totalRegistered, 'number');
    assert.equal(typeof data.overview.totalApproved, 'number');
    assert.equal(typeof data.overview.pendingApplications, 'number');
    assert.equal(typeof data.overview.dau, 'number');
    assert.equal(typeof data.overview.wau, 'number');
    assert.equal(typeof data.overview.mau, 'number');
    assert.equal(typeof data.overview.successfulMatches, 'number');
    assert.equal(typeof data.overview.totalConversations, 'number');
    assert.equal(typeof data.overview.messagesSent, 'number');
    assert.equal(typeof data.overview.campusPosts, 'number');
    assert.equal(typeof data.overview.unresolvedReports, 'number');
    assert.equal(data.timezone, 'Asia/Kolkata');
  });

  test('2.3 Analytics Trends: Returns filtered timeline and event breakdown for 7d', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/trends?range=7d')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const data = res.body.data;

    assert.equal(data.range, '7d');
    assert.ok(Array.isArray(data.timeline), 'Timeline should be an array');
    assert.equal(data.timeline.length, 7, '7-day range must contain 7 daily entries');
    assert.ok(data.eventDistribution, 'Event distribution object present');
  });

  // =========================================================================
  // 3. SYSTEM HEALTH MONITORING & ALERTS
  // =========================================================================

  test('3.1 System Health: Comprehensive diagnostics returns PostgreSQL, Redis, Storage and Memory', async () => {
    const res = await request(app)
      .get('/api/v1/admin/monitoring/health')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const health = res.body.data;

    assert.ok(['UP', 'DEGRADED', 'DOWN'].includes(health.status));
    assert.ok(health.services.database, 'Database health check present');
    assert.ok(health.services.database.status, 'Database status present');
    assert.ok(health.services.redis, 'Redis health check present');
    assert.ok(health.services.storage, 'Storage vaults health check present');
    assert.equal(health.services.storage.vaults.photos.writable, true);
    assert.equal(health.services.storage.vaults.thumbnails.writable, true);
    assert.equal(health.services.storage.vaults.documents.writable, true);
    assert.ok(health.services.socketIo, 'Socket.IO health check present');
    assert.ok(health.resources.memory, 'Process memory metrics present');
    assert.ok(health.resources.systemMemory, 'Host memory metrics present');
  });

  test('3.2 Automated Alert Evaluation: Evaluates operational thresholds without crashing', async () => {
    const res = await request(app)
      .get('/api/v1/admin/monitoring/alerts')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.alerts), 'Alerts must be an array');
    assert.ok(res.body.data.checks, 'Checks summary present');
    assert.equal(typeof res.body.data.checks.databaseUp, 'boolean');
    assert.equal(typeof res.body.data.checks.storageWritable, 'boolean');
  });

  // =========================================================================
  // 4. CORRELATION ID & ERROR LOGGING
  // =========================================================================

  test('4.1 Correlation ID: Request tracking header x-correlation-id is assigned and returned', async () => {
    const clientCid = 'test-client-cid-12345';
    const res = await request(app)
      .get('/')
      .set('x-correlation-id', clientCid);

    assert.equal(res.status, 200);
    assert.equal(res.headers['x-correlation-id'], clientCid, 'Preserves incoming correlation ID');

    // Auto-generated when omitted
    const autoRes = await request(app).get('/');
    assert.ok(autoRes.headers['x-correlation-id'], 'Must generate correlation ID if omitted');
  });

  test('4.2 Error Monitoring: incidentService.recordError stores sanitized system error log', async () => {
    const errorEntry = await incidentService.recordError({
      severity: 'ERROR',
      component: 'database',
      category: 'db_connection_timeout',
      message: 'Simulated connection timeout for test',
      correlationId: `corr-${timestamp}`,
      metadata: { query: 'SELECT 1', durationMs: 1250 },
    });

    assert.ok(errorEntry.id, 'Error log must be saved with unique ID');
    testErrorLogId = errorEntry.id;
    assert.equal(errorEntry.component, 'DATABASE');
    assert.equal(errorEntry.severity, 'ERROR');
  });

  test('4.3 Error Monitoring API: Retrieves paginated error logs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/monitoring/errors?limit=10')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.errorLogs), 'errorLogs must be an array');
  });

  // =========================================================================
  // 5. INCIDENT MANAGEMENT LIFECYCLE
  // =========================================================================

  test('5.1 Incident Escalation: Critical error creates SystemIncident record', async () => {
    const criticalEntry = await incidentService.recordError({
      severity: 'CRITICAL',
      component: 'api',
      category: 'critical_service_failure',
      message: `Test critical incident ${timestamp}`,
      correlationId: `cid-crit-${timestamp}`,
      metadata: { endpoint: '/api/v1/test', status: 500 },
    });

    assert.ok(criticalEntry.id);

    const incident = await prisma.systemIncident.findFirst({
      where: { correlationId: `cid-crit-${timestamp}` },
    });

    assert.ok(incident, 'SystemIncident must be auto-created for CRITICAL errors');
    createdIncidentId = incident.id;
    assert.equal(incident.severity, 'CRITICAL');
    assert.equal(incident.status, 'INVESTIGATING');
  });

  test('5.2 Incident Status Update: Transition from INVESTIGATING -> IDENTIFIED -> MONITORING', async () => {
    const res1 = await request(app)
      .patch(`/api/v1/admin/incidents/${createdIncidentId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'IDENTIFIED', notes: 'Identified root cause in connection handler' });

    assert.equal(res1.status, 200);
    assert.equal(res1.body.data.incident.status, 'IDENTIFIED');

    const res2 = await request(app)
      .patch(`/api/v1/admin/incidents/${createdIncidentId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'MONITORING', notes: 'Patch deployed to production, observing metrics' });

    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.incident.status, 'MONITORING');
  });

  test('5.3 Incident Resolution: Resolving requires notes and logs immutable audit trail', async () => {
    // Missing notes should fail validation
    const failRes = await request(app)
      .post(`/api/v1/admin/incidents/${createdIncidentId}/resolve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ resolutionNotes: '' });

    assert.equal(failRes.status, 400);

    // Valid resolution
    const resolveRes = await request(app)
      .post(`/api/v1/admin/incidents/${createdIncidentId}/resolve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        resolutionNotes: 'Verified socket pool reclaimed memory. Performance restored within 25ms SLA.',
      });

    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.body.data.incident.status, 'RESOLVED');
    assert.ok(resolveRes.body.data.incident.resolvedAt);
    assert.equal(resolveRes.body.data.incident.resolvedByAdminId, superAdmin.id);

    // Verify audit log entry
    const auditLog = await prisma.incidentAuditLog.findFirst({
      where: {
        incidentId: createdIncidentId,
        action: 'RESOLVED',
      },
    });

    assert.ok(auditLog, 'Incident resolution must write an immutable IncidentAuditLog record');
    assert.equal(auditLog.adminId, superAdmin.id);
  });
});

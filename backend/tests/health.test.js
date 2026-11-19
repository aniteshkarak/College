import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';

after(async () => {
  await prisma.$disconnect().catch(() => {});
  try {
    redis.disconnect();
  } catch {}
});

test('Health Check API returns correct schema and service definitions', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.ok(res.status === 200 || res.status === 503, 'Expected 200 or 503');

  const body = res.body;
  assert.ok(body.status === 'UP' || body.status === 'DEGRADED');
  assert.ok(body.services, 'Expected services object');
  assert.ok(body.services.database, 'Expected database service info');
  assert.ok(body.services.cache, 'Expected cache service info');
  assert.equal(body.services.database.engine, 'PostgreSQL');
  assert.equal(body.services.cache.engine, 'Redis');
  assert.ok(body.timestamp, 'Expected timestamp');
  assert.ok(typeof body.uptimeSeconds === 'number', 'Expected uptime number');
});

test('Root Endpoint returns API metadata', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Collégé Backend API');
  assert.equal(res.body.status, 'Running');
});

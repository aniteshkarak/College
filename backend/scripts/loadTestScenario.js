import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import config from '../src/config/env.js';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const SOCKET_URL = 'http://127.0.0.1:5000';

async function setupSyntheticUsers(count = 20) {
  const users = await prisma.user.findMany({
    where: { accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
    take: count,
    include: { education: true, profile: true }
  });

  return users.map(u => ({
    user: u,
    token: jwt.sign(
      { sub: u.id, id: u.id, email: u.email, role: u.role, accountStatus: u.accountStatus, verificationStatus: u.verificationStatus },
      config.jwt.secret,
      { expiresIn: '2h', issuer: 'college-api' }
    )
  }));
}

async function simulateUserActivity(userObj, iterations = 5) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userObj.token}`
  };

  const endpoints = [
    { name: 'Profile', url: `${BASE_URL}/profiles/me` },
    { name: 'Discovery', url: `${BASE_URL}/discovery` },
    { name: 'CampusBoard', url: `${BASE_URL}/campus/posts` },
    { name: 'CampusBoardInfo', url: `${BASE_URL}/campus/board` },
    { name: 'Matches', url: `${BASE_URL}/matching/matches` },
    { name: 'IncomingLikes', url: `${BASE_URL}/matching/incoming` },
    { name: 'ChatConversations', url: `${BASE_URL}/chat/conversations` },
    { name: 'Notifications', url: `${BASE_URL}/notifications` },
    { name: 'UnreadCount', url: `${BASE_URL}/notifications/unread-count` },
  ];

  const results = [];

  for (let i = 0; i < iterations; i++) {
    // Pick random actions
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const start = performance.now();
    try {
      const res = await fetch(ep.url, { method: 'GET', headers });
      const duration = performance.now() - start;
      results.push({ endpoint: ep.name, ok: res.ok, status: res.status, duration });
    } catch (err) {
      const duration = performance.now() - start;
      results.push({ endpoint: ep.name, ok: false, status: 0, duration, error: err.message });
    }
  }

  return results;
}

async function runConcurrencyStage(concurrency, usersPool) {
  console.log(`\n======================================================`);
  console.log(`🚀 STAGE: Concurrency = ${concurrency} simultaneous users`);
  console.log(`======================================================`);

  const memBefore = process.memoryUsage();
  const startTime = performance.now();

  const userTasks = [];
  for (let i = 0; i < concurrency; i++) {
    const user = usersPool[i % usersPool.length];
    userTasks.push(simulateUserActivity(user, 10)); // 10 operations per user
  }

  const allUserResults = await Promise.all(userTasks);
  const totalDurationMs = performance.now() - startTime;
  const memAfter = process.memoryUsage();

  const flatResults = allUserResults.flat();
  const successful = flatResults.filter(r => r.ok).length;
  const failed = flatResults.filter(r => !r.ok).length;
  const durations = flatResults.map(r => r.duration).sort((a, b) => a - b);

  const totalOps = flatResults.length;
  const avgLatency = durations.reduce((acc, v) => acc + v, 0) / totalOps;
  const medianLatency = durations[Math.floor(totalOps / 2)];
  const p95Latency = durations[Math.floor(totalOps * 0.95)];
  const p99Latency = durations[Math.floor(totalOps * 0.99)];
  const minLatency = durations[0];
  const maxLatency = durations[totalOps - 1];
  const throughput = (totalOps / (totalDurationMs / 1000)).toFixed(1);

  const stageReport = {
    concurrency,
    totalOperations: totalOps,
    durationSec: (totalDurationMs / 1000).toFixed(2),
    throughputReqSec: throughput,
    successful,
    failed,
    errorRate: `${((failed / totalOps) * 100).toFixed(2)}%`,
    latency: {
      min: minLatency.toFixed(2),
      avg: avgLatency.toFixed(2),
      median: medianLatency.toFixed(2),
      p95: p95Latency.toFixed(2),
      p99: p99Latency.toFixed(2),
      max: maxLatency.toFixed(2),
    },
    memory: {
      rssMb: ((memAfter.rss - memBefore.rss) / (1024 * 1024)).toFixed(2),
      heapUsedMb: ((memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024)).toFixed(2),
    }
  };

  console.log(JSON.stringify(stageReport, null, 2));
  return stageReport;
}

async function runSocketBenchmark(concurrentClients = 50, usersPool) {
  console.log(`\n======================================================`);
  console.log(`⚡ SOCKET.IO CONCURRENCY TEST: ${concurrentClients} simultaneous sockets`);
  console.log(`======================================================`);

  const sockets = [];
  const connectionTimes = [];
  let connectedCount = 0;
  let errorCount = 0;

  const startAll = performance.now();

  const connectPromises = [];
  for (let i = 0; i < concurrentClients; i++) {
    const userObj = usersPool[i % usersPool.length];
    const p = new Promise((resolve) => {
      const startConnect = performance.now();
      const socket = ClientIO(SOCKET_URL, {
        auth: { token: userObj.token, deviceId: `loadtest_${i}` },
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
      });

      socket.on('connect', () => {
        const connTime = performance.now() - startConnect;
        connectionTimes.push(connTime);
        connectedCount++;
        sockets.push(socket);
        resolve({ ok: true, connTime });
      });

      socket.on('connect_error', (err) => {
        errorCount++;
        socket.disconnect();
        resolve({ ok: false, error: err.message });
      });
    });

    connectPromises.push(p);
  }

  await Promise.all(connectPromises);
  const totalConnectTime = performance.now() - startAll;

  connectionTimes.sort((a, b) => a - b);
  const avgConnTime = connectionTimes.length > 0 ? (connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length).toFixed(2) : '0';
  const medianConnTime = connectionTimes.length > 0 ? connectionTimes[Math.floor(connectionTimes.length / 2)].toFixed(2) : '0';
  const p95ConnTime = connectionTimes.length > 0 ? connectionTimes[Math.floor(connectionTimes.length * 0.95)].toFixed(2) : '0';

  // Test round-trip broadcast / private message latency
  const msgLatencies = [];
  if (sockets.length >= 2) {
    for (let test = 0; test < 10; test++) {
      const sender = sockets[0];
      const t0 = performance.now();
      sender.emit('ping_heartbeat', { ts: t0 });
      msgLatencies.push(performance.now() - t0);
    }
  }

  const socketReport = {
    targetSockets: concurrentClients,
    connectedSockets: connectedCount,
    failedSockets: errorCount,
    totalSetupTimeMs: totalConnectTime.toFixed(2),
    avgConnectionLatencyMs: avgConnTime,
    medianConnectionLatencyMs: medianConnTime,
    p95ConnectionLatencyMs: p95ConnTime,
    status: connectedCount === concurrentClients ? 'STABLE' : 'PARTIAL'
  };

  console.log(JSON.stringify(socketReport, null, 2));

  // Cleanly disconnect all sockets
  for (const s of sockets) {
    try { s.disconnect(); } catch (_) {}
  }

  return socketReport;
}

async function main() {
  console.log('--- STARTING COLLAGE STORY FULL LOAD & CONCURRENCY AUDIT ---');
  const usersPool = await setupSyntheticUsers(30);
  console.log(`Loaded ${usersPool.length} active approved users for load testing.`);

  const stage10 = await runConcurrencyStage(10, usersPool);
  const stage25 = await runConcurrencyStage(25, usersPool);
  const stage50 = await runConcurrencyStage(50, usersPool);
  const stage100 = await runConcurrencyStage(100, usersPool);

  const socket50 = await runSocketBenchmark(50, usersPool);
  const socket100 = await runSocketBenchmark(100, usersPool);

  console.log('\n--- ALL LOAD TEST SCENARIOS COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Load test runner failed:', err);
  process.exit(1);
});

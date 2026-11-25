import jwt from 'jsonwebtoken';
import config from '../src/config/env.js';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function runBenchmark() {
  console.log('--- COLLAGE STORY BASELINE PERFORMANCE BENCHMARK ---');

  // Find a verified active user
  const user = await prisma.user.findFirst({
    where: { accountStatus: 'ACTIVE', verificationStatus: 'APPROVED' },
    include: { education: true, profile: true }
  });

  if (!user) {
    console.error('No approved user found for benchmarking.');
    process.exit(1);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, accountStatus: user.accountStatus, verificationStatus: user.verificationStatus },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const endpoints = [
    { name: 'Health Check', url: `${BASE_URL}/health`, method: 'GET', auth: false },
    { name: 'Registration Colleges', url: `${BASE_URL}/registration/colleges?q=IIT`, method: 'GET', auth: false },
    { name: 'Student Profile (me)', url: `${BASE_URL}/profiles/me`, method: 'GET', auth: true },
    { name: 'Discovery Feed', url: `${BASE_URL}/discovery`, method: 'GET', auth: true },
    { name: 'Incoming Likes', url: `${BASE_URL}/matching/incoming`, method: 'GET', auth: true },
    { name: 'Sent Requests', url: `${BASE_URL}/matching/sent`, method: 'GET', auth: true },
    { name: 'Mutual Matches', url: `${BASE_URL}/matching/matches`, method: 'GET', auth: true },
    { name: 'Chat Conversations', url: `${BASE_URL}/chat/conversations`, method: 'GET', auth: true },
    { name: 'Notifications Feed', url: `${BASE_URL}/notifications`, method: 'GET', auth: true },
    { name: 'Unread Notifications Count', url: `${BASE_URL}/notifications/unread-count`, method: 'GET', auth: true },
    { name: 'Campus Board Info', url: `${BASE_URL}/campus/board`, method: 'GET', auth: true },
    { name: 'Campus Board Posts', url: `${BASE_URL}/campus/posts`, method: 'GET', auth: true },
    { name: 'Campus Board Events', url: `${BASE_URL}/campus/events`, method: 'GET', auth: true }
  ];

  const results = {};
  const ITERATIONS = 30;

  for (const ep of endpoints) {
    const latencies = [];
    let successCount = 0;
    let failCount = 0;

    const headers = { 'Content-Type': 'application/json' };
    if (ep.auth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Warm-up run
    try {
      await fetch(ep.url, { method: ep.method, headers });
    } catch (_) {}

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      try {
        const res = await fetch(ep.url, { method: ep.method, headers });
        const end = performance.now();
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
        latencies.push(end - start);
      } catch (err) {
        failCount++;
      }
    }

    latencies.sort((a, b) => a - b);
    const sum = latencies.reduce((acc, v) => acc + v, 0);
    const avg = sum / latencies.length;
    const median = latencies[Math.floor(latencies.length / 2)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const min = latencies[0];
    const max = latencies[latencies.length - 1];

    results[ep.name] = {
      samples: ITERATIONS,
      min: min.toFixed(2),
      avg: avg.toFixed(2),
      median: median.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      max: max.toFixed(2),
      errorRate: `${((failCount / ITERATIONS) * 100).toFixed(1)}%`
    };
  }

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
}

runBenchmark();

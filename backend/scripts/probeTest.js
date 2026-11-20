import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, '..');

function checkEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:5000${path}`, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body.slice(0, 300) });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

async function run() {
  console.log('[PROBE] Checking running server on port 5000...');
  let serverProc = null;

  try {
    const rootTest = await checkEndpoint('/');
    console.log('[PROBE] Existing server is running and healthy on port 5000.');
  } catch (e) {
    console.log('[PROBE] No server detected, launching server process...');
    serverProc = spawn(process.execPath, ['src/server.js'], {
      cwd: BACKEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((r) => setTimeout(r, 3000));
  }

  try {
    console.log('\n--- Probing / ---');
    const rootRes = await checkEndpoint('/');
    console.log(`HTTP ${rootRes.status}:`, rootRes.body);

    console.log('\n--- Probing /api/v1/health/live ---');
    const liveRes = await checkEndpoint('/api/v1/health/live');
    console.log(`HTTP ${liveRes.status}:`, liveRes.body);

    console.log('\n--- Probing /api/v1/registration/colleges?q=Xavier ---');
    const collegesRes = await checkEndpoint('/api/v1/registration/colleges?q=Xavier');
    console.log(`HTTP ${collegesRes.status}:`, collegesRes.body);

    console.log('\n[PROBE] All probed endpoints responded successfully!');
  } finally {
    if (serverProc) {
      serverProc.kill();
    }
  }
}

run().catch((e) => {
  console.error('[PROBE] Error:', e);
  process.exit(1);
});

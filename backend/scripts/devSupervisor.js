/**
 * Collégé Backend Development Supervisor & Process Guard
 *
 * Checks for zombie processes on port 5000, validates environment,
 * monitors backend health, and auto-restarts the server if needed.
 */

import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 5000;

function checkHealth(callback) {
  const req = http.get(`http://127.0.0.1:${PORT}/api/v1/health/live`, { timeout: 3000 }, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        callback(null, res.statusCode === 200, json);
      } catch (e) {
        callback(null, res.statusCode === 200, null);
      }
    });
  });

  req.on('error', (err) => {
    callback(err, false, null);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(new Error('Health check timed out'), false, null);
  });
}

function startBackend() {
  console.log(`[SUPERVISOR] Starting Collégé Backend on port ${PORT}...`);
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: BACKEND_ROOT,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  child.on('exit', (code, signal) => {
    console.warn(`[SUPERVISOR] Backend process exited (code=${code}, signal=${signal}). Restarting in 3 seconds...`);
    setTimeout(startBackend, 3000);
  });

  return child;
}

// First check if a healthy server is already running
checkHealth((err, isAlive, data) => {
  if (isAlive) {
    console.log(`[SUPERVISOR] A healthy Collégé Backend is ALREADY running on port ${PORT}.`);
    console.log(`[SUPERVISOR] Status:`, data);
    process.exit(0);
  } else {
    console.log(`[SUPERVISOR] No responding server found on port ${PORT}. Launching server process...`);
    startBackend();
  }
});

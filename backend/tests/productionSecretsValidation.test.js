import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import path from 'path';
import { pathToFileURL } from 'url';

describe('Collage Story — Production Fallback Secrets & Startup Validation', () => {
  const envScriptUrl = pathToFileURL(path.resolve('src/config/env.js')).href;

  const runWithEnv = (envOverrides) => {
    return spawnSync(
      process.execPath,
      ['-e', `import('${envScriptUrl}')`],
      {
        env: {
          ...process.env,
          ...envOverrides,
        },
        encoding: 'utf8',
      }
    );
  };

  it('1. Throws fatal error in production when JWT_SECRET is missing', () => {
    const res = runWithEnv({
      NODE_ENV: 'production',
      JWT_SECRET: '',
      JWT_REFRESH_SECRET: 'a'.repeat(40),
      ADMIN_JWT_SECRET: 'b'.repeat(40),
      DATABASE_URL: 'postgresql://prod_user:Secure_Prod_Pass@db.prod.internal:5432/college_prod',
    });

    assert.notEqual(res.status, 0, 'Must exit with non-zero status in production with missing JWT_SECRET');
    assert.match(res.stderr, /Missing required production secret: JWT_SECRET/);
  });

  it('2. Throws fatal error in production when secret is too short (<32 chars)', () => {
    const res = runWithEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'short_secret_123',
      JWT_REFRESH_SECRET: 'a'.repeat(40),
      ADMIN_JWT_SECRET: 'b'.repeat(40),
      DATABASE_URL: 'postgresql://prod_user:Secure_Prod_Pass@db.prod.internal:5432/college_prod',
    });

    assert.notEqual(res.status, 0, 'Must exit with non-zero status when secret is too short');
    assert.match(res.stderr, /must be at least 32 characters/);
  });

  it('3. Throws fatal error in production when insecure template secret is used', () => {
    const res = runWithEnv({
      NODE_ENV: 'production',
      JWT_SECRET: '8Sdx63629iATw/8EIF8+YB/9aN0yjjo1nw6KCBF7bnAFtXugS8JVGCQZlcR5G/GN', // dev default
      JWT_REFRESH_SECRET: 'a'.repeat(40),
      ADMIN_JWT_SECRET: 'b'.repeat(40),
      DATABASE_URL: 'postgresql://prod_user:Secure_Prod_Pass@db.prod.internal:5432/college_prod',
    });

    assert.notEqual(res.status, 0, 'Must exit with non-zero status when default secret is used');
    assert.match(res.stderr, /Insecure or default template secret detected/);
  });

  it('4. Throws fatal error in production when default dev credentials in DATABASE_URL are used', () => {
    const res = runWithEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'c'.repeat(40),
      JWT_REFRESH_SECRET: 'a'.repeat(40),
      ADMIN_JWT_SECRET: 'b'.repeat(40),
      DATABASE_URL: 'postgresql://college_user:CollegeDev_2026_StrongPass@127.0.0.1:5432/college_db?schema=public',
    });

    assert.notEqual(res.status, 0, 'Must exit with non-zero status when default DATABASE_URL is used in production');
    assert.match(res.stderr, /Default development credentials detected in DATABASE_URL/);
  });

  it('5. Succeeds in production when all secrets are secure and unique (>=32 chars)', () => {
    const res = runWithEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'c'.repeat(40),
      JWT_REFRESH_SECRET: 'a'.repeat(40),
      ADMIN_JWT_SECRET: 'b'.repeat(40),
      DATABASE_URL: 'postgresql://prod_user:Secure_Prod_Pass_2026@db.prod.internal:5432/college_prod?sslmode=require',
    });

    assert.equal(res.status, 0, `Must exit with code 0 on valid production secrets. Error was: ${res.stderr}`);
  });

  it('6. Allows safe development and test execution in development mode', () => {
    const res = runWithEnv({
      NODE_ENV: 'development',
    });

    assert.equal(res.status, 0, `Must succeed in development mode. Error was: ${res.stderr}`);
  });
});

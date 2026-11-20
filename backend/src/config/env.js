
import dotenv from 'dotenv';

dotenv.config();

const optionalEnv = (name, fallback = '') => {
  return process.env[name] !== undefined ? process.env[name] : fallback;
};

const requiredEnv = (name, fallback) => {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const configuredCors = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || defaultCorsOrigins.join(','),
  corsOrigins: Array.from(new Set([...defaultCorsOrigins, ...configuredCors])),

  databaseUrl: requiredEnv(
    'DATABASE_URL',
    'postgresql://college_user:CollegeDev_2026_StrongPass@127.0.0.1:5432/college_db?schema=public'
  ),

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD.trim() : undefined,
  },

  jwt: {
    // Student authentication
    secret: requiredEnv('JWT_SECRET', '8Sdx63629iATw/8EIF8+YB/9aN0yjjo1nw6KCBF7bnAFtXugS8JVGCQZlcR5G/GN'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: requiredEnv('JWT_REFRESH_SECRET', 'LdbH3QyYyuAqUrIMUVHi/msSjTktrLLKQiNRKC9qvZtr6WWvx0BeTkpzHVjrlS6T'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

    // Separate administrator authentication
    adminSecret: requiredEnv('ADMIN_JWT_SECRET', 'uYzoaCRtaS8OeskY6pczoR0yXccwBRBjH1DwzMUOR/f4oTm3jZFJr7Cn8sJxF8tKMDGepV7TJC45eRGF0UF1hA=='),
    adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'College Campus Team <no-reply@college.internal>',
  },

  storage: {
    maxFileSizeBytes: 5 * 1024 * 1024,
  },
};

export default config;

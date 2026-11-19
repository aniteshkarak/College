
import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  databaseUrl: requiredEnv('DATABASE_URL'),

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: requiredEnv('REDIS_PASSWORD'),
  },

  jwt: {
  // Student authentication
  secret: requiredEnv('JWT_SECRET'),
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: requiredEnv('JWT_REFRESH_SECRET'),
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Separate administrator authentication
  adminSecret: requiredEnv('ADMIN_JWT_SECRET'),
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

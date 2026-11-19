import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  APP_NAME: process.env.APP_NAME || 'Collégé',
  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim()),

  JWT: {
    SECRET: process.env.JWT_SECRET || 'college_default_dev_jwt_secret_2026',
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  COOKIE_SECRET: process.env.COOKIE_SECRET || 'college_default_cookie_secret_2026',

  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || 'admin@college.internal',
    PASSWORD: process.env.ADMIN_PASSWORD || 'AdminSecurePassword2026!',
    ROLE: process.env.ADMIN_ROLE || 'SUPER_ADMIN',
    DISPLAY_NAME: process.env.ADMIN_DISPLAY_NAME || 'Campus SuperAdmin',

    VERIFIER_EMAIL: process.env.VERIFICATION_ADMIN_EMAIL || 'verifier@college.internal',
    VERIFIER_PASSWORD: process.env.VERIFICATION_ADMIN_PASSWORD || 'VerifierPass2026!'
  },

  UPLOAD: {
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    MAX_DOC_SIZE_MB: parseInt(process.env.MAX_DOC_SIZE_MB || '10', 10),
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOC_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  },

  SMTP: {
    HOST: process.env.SMTP_HOST || '',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || 'Collégé Campus Security <security@college.internal>'
  }
};

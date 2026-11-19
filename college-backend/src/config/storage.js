import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_ROOT = path.resolve(__dirname, '../../storage');

export const STORAGE_PATHS = {
  ROOT: STORAGE_ROOT,
  APPLICATIONS_DIR: path.join(STORAGE_ROOT, 'applications'),
  APPLICATIONS_FILE: path.join(STORAGE_ROOT, 'applications', 'applications.json'),

  USERS_DIR: path.join(STORAGE_ROOT, 'users'),
  USERS_FILE: path.join(STORAGE_ROOT, 'users', 'users.json'),

  REVIEWS_DIR: path.join(STORAGE_ROOT, 'reviews'),
  REVIEWS_FILE: path.join(STORAGE_ROOT, 'reviews', 'reviews.json'),

  NOTIFICATIONS_DIR: path.join(STORAGE_ROOT, 'notifications'),
  NOTIFICATIONS_FILE: path.join(STORAGE_ROOT, 'notifications', 'notifications.json'),

  PRIVATE_DIR: path.join(STORAGE_ROOT, 'private'),
  PRIVATE_DOCUMENTS_DIR: path.join(STORAGE_ROOT, 'private', 'identity-documents'),
  PRIVATE_PHOTOS_DIR: path.join(STORAGE_ROOT, 'private', 'profile-photos'),

  LOGS_DIR: path.resolve(__dirname, '../../logs')
};

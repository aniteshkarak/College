import path from 'path';
import fs from 'fs';

const STORAGE_ROOT = path.resolve('storage');
const PRIVATE_ROOT = path.join(STORAGE_ROOT, 'private');

export const STORAGE_PATHS = {
  STORAGE_ROOT,
  PRIVATE_ROOT,
  DOCUMENTS_DIR: path.join(PRIVATE_ROOT, 'documents'),
  PHOTOS_DIR: path.join(PRIVATE_ROOT, 'photos'),
  THUMBNAILS_DIR: path.join(PRIVATE_ROOT, 'thumbnails'),
  DISCOVERY_DIR: path.join(PRIVATE_ROOT, 'discovery'),
  VOICE_DIR: path.join(PRIVATE_ROOT, 'voice'),
};

// Ensure all isolated private storage directories exist on boot
export const initializeStorageDirectories = () => {
  Object.values(STORAGE_PATHS).forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

initializeStorageDirectories();

export default STORAGE_PATHS;

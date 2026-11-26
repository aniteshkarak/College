import path from 'path';
import fs from 'fs';
import { runFullBackup } from './backupEngine.js';

const logDir = path.resolve('storage/backups');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'scheduled_backup.log');

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
  process.stdout.write(line);
};

async function main() {
  log('====================================================');
  log('Scheduled Daily Backup Task Invoked by OS Scheduler');
  log('====================================================');

  try {
    const manifest = await runFullBackup({
      offsiteDir: process.env.OFFSITE_BACKUP_DIR || 'D:\\CollageStory_Encrypted_Offsite_Vault',
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    });
    log(`SUCCESS: Backup ID ${manifest.backupId} completed.`);
    log(`Database: ${manifest.database.archive} (${(manifest.database.sizeBytes / 1024).toFixed(1)} KB)`);
    log(`Storage: ${manifest.storage.archive} (${(manifest.storage.sizeBytes / 1024).toFixed(1)} KB)`);
    log(`Offsite Destination: ${manifest.offsiteDestination.description} (Genuinely Offsite: ${manifest.isGenuinelyOffsite})`);
    log('====================================================');
    process.exit(0);
  } catch (err) {
    log(`ERROR: Scheduled Backup Failed: ${err.message}`);
    log(err.stack);
    log('====================================================');
    process.exit(1);
  }
}

main();

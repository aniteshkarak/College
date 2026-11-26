import { runFullBackup } from './backupEngine.js';

async function main() {
  try {
    const manifest = await runFullBackup();
    console.log('\n✅ Automated Backup Succeeded!');
    console.log(JSON.stringify(manifest, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Backup Failed:', err.message);
    process.exit(1);
  }
}

main();

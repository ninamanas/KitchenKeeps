
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECIPE_DB = path.join(__dirname, '../recipes.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Create timestamped backup
const backupFile = path.join(BACKUP_DIR, `recipes-${Date.now()}.json`);
fs.copyFileSync(RECIPE_DB, backupFile);
console.log(`Backup created: ${backupFile}`);
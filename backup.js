import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the correct directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use raw string for Windows paths
const RECIPE_DB = path.join(__dirname, 'recipes.json').replace(/\\/g, '\\\\');
const BACKUP_DIR = path.join(__dirname, 'backups').replace(/\\/g, '\\\\');

// Debug output
console.log('Looking for recipes at:', RECIPE_DB);
console.log('Backup directory:', BACKUP_DIR);

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Verify source file exists
if (!fs.existsSync(RECIPE_DB)) {
    console.error('Error: recipes.json not found at:', RECIPE_DB);
    process.exit(1);
}

// Create backup
try {
    const timestamp = Date.now();
    const backupFile = path.join(BACKUP_DIR, `recipes_${timestamp}.json`).replace(/\\/g, '\\\\');
    fs.copyFileSync(RECIPE_DB, backupFile);
    console.log('Backup successful:', backupFile);
} catch (err) {
    console.error('Backup failed:', err);
}
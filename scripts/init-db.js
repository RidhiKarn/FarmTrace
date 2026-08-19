const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking database...');

const dbPath = path.join(process.cwd(), 'dev.db');

if (!fs.existsSync(dbPath)) {
  console.log('Database not found. Creating...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('Database created successfully!');
  } catch (error) {
    console.error('Failed to create database:', error);
  }
} else {
  console.log('Database exists.');
}

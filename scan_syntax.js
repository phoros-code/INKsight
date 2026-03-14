const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function scanDir(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        try {
          const code = fs.readFileSync(fullPath, 'utf8');
          parser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
          });
        } catch (e) {
          console.log('FAIL:', fullPath, '-', e.message.substring(0, 150));
        }
      }
    }
  } catch (e) {
    // skip unreadable dirs
  }
}

scanDir('app');
scanDir('src');
console.log('--- SCAN COMPLETE ---');

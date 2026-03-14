const fs = require('fs');
const path = require('path');

// Find ALL .tsx files recursively
function findFiles(dir, ext) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results = results.concat(findFiles(full, ext));
      } else if (item.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch(e) {}
  return results;
}

const allFiles = [...findFiles('app', '.tsx'), ...findFiles('app', '.ts')];

for (const fullPath of allFiles) {
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Calculate relative path to src/utils/webSafe
  const fileDir = path.dirname(fullPath);
  const relToRoot = path.relative(fileDir, '.').replace(/\\/g, '/');
  const webSafePath = relToRoot + '/src/utils/webSafe';

  // Fix expo-haptics direct import
  if (content.includes("import * as Haptics from 'expo-haptics';")) {
    content = content.replace(
      "import * as Haptics from 'expo-haptics';",
      `import { SafeHaptics as Haptics } from '${webSafePath}';`
    );
    changed = true;
  }

  // Fix react-native-mmkv import (if not already fixed by settings.tsx manual edit)
  if (content.includes("import { MMKV } from 'react-native-mmkv';") && !content.includes('Platform-safe imports')) {
    content = content.replace(
      "import { MMKV } from 'react-native-mmkv';",
      "// MMKV handled web-safe\nimport { Platform } from 'react-native';"
    );
    // Replace new MMKV() with web-safe version
    if (content.includes('const storage = new MMKV();')) {
      content = content.replace(
        'const storage = new MMKV();',
        "const MMKV_Class = Platform.OS !== 'web' ? require('react-native-mmkv').MMKV : null;\nconst storage = MMKV_Class ? new MMKV_Class() : { getString: () => null, getBoolean: () => false, set: () => {} };"
      );
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('FIXED:', path.relative('.', fullPath));
  }
}

console.log('--- DONE ---');

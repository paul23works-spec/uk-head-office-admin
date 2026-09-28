import fs from 'fs';
import path from 'path';

const UUID = '739bed9a-5b64-4c1e-900b-e753ae6274c9';
const OLD_ID = 'PRJ-2024-001';

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const files = walk(path.join(process.cwd(), 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (file.includes('mock-data.ts') || file.includes('mock-data.tsx')) {
    if (content.includes("code: 'UK-BGA-33KV'")) {
      content = content.replace("code: 'UK-BGA-33KV'", "code: 'PRJ-2024-001'");
      changed = true;
    }
  }

  if (content.includes(`id: '${OLD_ID}'`)) {
    content = content.replace(new RegExp(`id: '${OLD_ID}'`, 'g'), `id: '${UUID}'`);
    changed = true;
  }
  if (content.includes(`projectId: '${OLD_ID}'`)) {
    content = content.replace(new RegExp(`projectId: '${OLD_ID}'`, 'g'), `projectId: '${UUID}'`);
    changed = true;
  }
  if (content.includes(`projectId === '${OLD_ID}'`)) {
    content = content.replace(new RegExp(`projectId === '${OLD_ID}'`, 'g'), `projectId === '${UUID}'`);
    changed = true;
  }
  if (content.includes(`/projects/${OLD_ID}`)) {
    content = content.replace(new RegExp(`/projects/${OLD_ID}`, 'g'), `/projects/${UUID}`);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

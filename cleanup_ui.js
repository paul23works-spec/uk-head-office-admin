const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function removeDemoTags(content) {
  let newContent = content;

  // Remove full imports
  newContent = newContent.replace(/import\s*{\s*EnvironmentBadge\s*}\s*from\s*['"][./@a-zA-Z-]+Badge['"];?\r?\n/g, '');
  newContent = newContent.replace(/import\s*{\s*DemoTag\s*}\s*from\s*['"][./@a-zA-Z-]+Badge['"];?\r?\n/g, '');
  newContent = newContent.replace(/import\s*{\s*DemoTag,\s*EnvironmentBadge\s*}\s*from\s*['"][./@a-zA-Z-]+Badge['"];?\r?\n/g, '');
  newContent = newContent.replace(/import\s*{\s*EnvironmentBadge,\s*DemoTag\s*}\s*from\s*['"][./@a-zA-Z-]+Badge['"];?\r?\n/g, '');
  
  // Partial import replacements
  newContent = newContent.replace(/,\s*DemoTag,\s*EnvironmentBadge/g, '');
  newContent = newContent.replace(/,\s*EnvironmentBadge,\s*DemoTag/g, '');
  newContent = newContent.replace(/,\s*DemoTag/g, '');
  newContent = newContent.replace(/,\s*EnvironmentBadge/g, '');
  newContent = newContent.replace(/DemoTag,\s*/g, '');
  newContent = newContent.replace(/EnvironmentBadge,\s*/g, '');

  // Remove JSX tags
  newContent = newContent.replace(/<EnvironmentBadge[^>]*\/>/g, '');
  newContent = newContent.replace(/<DemoTag[^>]*\/>/g, '');

  return newContent;
}

let modifiedFiles = [];

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  const originalContent = fs.readFileSync(filePath, 'utf-8');
  let content = originalContent;

  if (filePath.replace(/\\/g, '/').includes('/src/components/common/Badge.tsx')) {
    // Remove the two components from Badge.tsx
    // Instead of regex, I'll just remove them explicitly by finding their lines.
    content = content.replace(/export function EnvironmentBadge[\s\S]*?}\n/g, '');
    content = content.replace(/export function DemoTag[\s\S]*?}\n/g, '');
  } else if (filePath.replace(/\\/g, '/').includes('/src/components/common/GlobalSearchModal.tsx')) {
    content = content.replace(/Demo Database/g, 'Production Database');
    content = removeDemoTags(content);
  } else if (filePath.replace(/\\/g, '/').includes('/src/app/page.tsx')) {
    content = removeDemoTags(content);
    // Remove the Phase 5 banner
    const bannerRegex = /\{\/\*\s*Phase 5 Banner\s*\*\/\}\s*<div className="rounded-lg bg-indigo-50\/80[\s\S]*?<\/div>\s*<\/div>/g;
    content = content.replace(bannerRegex, '');
  } else {
    content = removeDemoTags(content);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedFiles.push(filePath);
  }
});

console.log('Modified files:', modifiedFiles.length);
modifiedFiles.forEach(f => console.log(' - ' + f));

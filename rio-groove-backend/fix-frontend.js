const fs = require('fs');
const path = require('path');

const downloadsDir = path.resolve('../../');
const files = fs.readdirSync(downloadsDir);
const frontendDirs = files.filter(f => f.startsWith('rio-groove-cloudflare-final') && fs.statSync(path.join(downloadsDir, f)).isDirectory());

let fileList = [];
for (const dir of frontendDirs) {
  const fullPath = path.join(downloadsDir, dir);
  findHtml(fullPath, fileList);
}

function findHtml(dir, list) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item.startsWith('.')) continue;
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findHtml(fullPath, list);
    } else if (item.endsWith('.html') || item.endsWith('.js')) {
      list.push(fullPath);
    }
  }
}

for (const file of fileList) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add id: normalizedShipping.id if missing
  if (content.includes('shipping: {') && content.includes('label: normalizedShipping.label,') && !content.includes('id: normalizedShipping.id,')) {
    content = content.replace(
      /shipping:\s*\{\s*label:\s*normalizedShipping\.label,/g,
      'shipping: {\n                id: normalizedShipping.id,\n                label: normalizedShipping.label,'
    );
    changed = true;
  }

  // Add checkout frontend log
  if (content.includes('frontend_url: RIO_GROOVE_CONFIG.frontendUrl') && !content.includes('[CHECKOUT FRONTEND] Payload enviado')) {
    content = content.replace(
      /return\s*\{\s*items:\s*normalizedItems,[\s\S]*?frontend_url:\s*RIO_GROOVE_CONFIG\.frontendUrl\s*\};/g,
      match => {
        return `const payload = ${match.substring(7)};\n\n            console.log('[CHECKOUT FRONTEND] Payload enviado', payload);\n            return payload;`;
      }
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}

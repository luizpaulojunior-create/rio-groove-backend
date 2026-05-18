const fs = require('fs');
const file = '../../rio-groove-cloudflare-final-corrigido/index.html';
let html = fs.readFileSync(file, 'utf8');

const collections = [
  'colecao-samba',
  'colecao-malandragem',
  'colecao-rainhas',
  'colecao-ancestralidade',
  'colecao-luz'
];

collections.forEach(col => {
  const startTag = `<section id="${col}"`;
  const endTag = '</section>';
  
  let startIndex = html.indexOf(startTag);
  while (startIndex !== -1) {
    let endIndex = html.indexOf(endTag, startIndex);
    if (endIndex !== -1) {
      endIndex += endTag.length;
      html = html.substring(0, startIndex) + html.substring(endIndex);
    } else {
      break;
    }
    startIndex = html.indexOf(startTag);
  }
});

fs.writeFileSync(file, html);
console.log('Removed hardcoded collections');

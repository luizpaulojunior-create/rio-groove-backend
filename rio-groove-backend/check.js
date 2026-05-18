const fs = require('fs');
const html = fs.readFileSync('../../rio-groove-cloudflare-final-corrigido/index.html', 'utf8');

const sections = [...html.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
console.log('Sections:', sections.join(', '));

const productCards = html.match(/class="[^"]*product-card[^"]*"/g) || [];
console.log('Product cards count in HTML:', productCards.length);

const fs = require('fs');
const path = '../../rio-groove-cloudflare-final-corrigido/index.html';
let content = fs.readFileSync(path, 'utf8');

const startTag = '<section id="colecao-samba"';
const endTag = '<section id="sobre"';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.slice(0, startIndex);
  const after = content.slice(endIndex);
  
  const newSections = `      <section id="produtos" class="page-section section-padding">
        <div class="container">
          <h2 class="heading-lg text-center" style="margin-bottom: 4rem">Nossos <span class="text-red">Produtos</span></h2>
          <div id="products-grid" class="product-grid">
            <!-- Os produtos serão renderizados aqui pelo JavaScript -->
          </div>
        </div>
      </section>\n\n      `;

  content = before + newSections + after;
  fs.writeFileSync(path, content);
  console.log('HTML sections replaced successfully');
} else {
  console.log('Could not find sections to replace');
}

const fs = require('fs');
const file = '../../rio-groove-cloudflare-final-corrigido/index.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Add missing detail sections if not exist
if (!html.includes('id="produto-detalhe"')) {
  html = html.replace('</main>', `
      <section id="produto-detalhe" class="page-section section-padding" style="display: none;">
        <div class="container" id="product-detail-container">
          <div class="loading-placeholder">Carregando produto...</div>
        </div>
      </section>

      <section id="colecao-detalhe" class="page-section section-padding" style="display: none;">
        <div class="container">
          <div id="collection-detail-header"></div>
          <div id="collection-products-grid" class="product-grid"></div>
        </div>
      </section>
    </main>`);
}

// 2. Update navigation links to use true paths instead of hashes
html = html.replace(/href="#inicio"/g, 'href="/"');
html = html.replace(/href="#colecoes"/g, 'href="/collections"');
html = html.replace(/href="#produtos"/g, 'href="/products"');
html = html.replace(/href="#sobre"/g, 'href="/sobre"');
html = html.replace(/href="#entrega"/g, 'href="/entrega"');
html = html.replace(/href="#pagamento"/g, 'href="/pagamento"');
html = html.replace(/href="#politicas"/g, 'href="/politicas"');
html = html.replace(/href="#contato"/g, 'href="/contato"');
html = html.replace(/href="#carrinho"/g, 'href="/carrinho"');
html = html.replace(/href="#checkout"/g, 'href="/checkout"');
html = html.replace(/href="#politica-trocas"/g, 'href="/politica-trocas"');
html = html.replace(/href="#politica-privacidade"/g, 'href="/politica-privacidade"');
html = html.replace(/href="#politica-termos"/g, 'href="/politica-termos"');

// Replace any remaining href="#carrinho" etc that were not matched
html = html.replace(/href="#(.*?)"/g, 'href="/$1"');

// Explicitly add /products to header if not there
if (!html.includes('<a href="/products">Produtos</a>')) {
  html = html.replace('<a href="/collections">Coleções</a>', '<a href="/collections">Coleções</a>\n          <a href="/products">Produtos</a>');
}

// 3. Patch inline routing logic
html = html.replace(
  "const internalLinks = Array.from(document.querySelectorAll('a[href^=\"#\"]'));",
  "const internalLinks = Array.from(document.querySelectorAll('a[href^=\"/\"]'));"
);

// Replace getTargetSectionId
const oldGetTarget = `function getTargetSectionId(hash) {
          const cleanHash = (hash || '').replace('#', '').trim();
          if (!cleanHash) return defaultSectionId;
          const target = document.getElementById(cleanHash);
          return target ? cleanHash : defaultSectionId;
        }`;

const newGetTarget = `function getTargetSectionId(path) {
          const cleanPath = (path || '').replace(/\\/$/, '') || '/';
          if (cleanPath === '/') return 'inicio';
          if (cleanPath === '/collections') return 'colecoes';
          if (cleanPath === '/products') return 'produtos';
          if (cleanPath.startsWith('/collection/')) return 'colecao-detalhe';
          if (cleanPath.startsWith('/product/')) return 'produto-detalhe';
          
          const sectionId = cleanPath.substring(1);
          const target = document.getElementById(sectionId);
          return target ? sectionId : defaultSectionId;
        }`;
html = html.replace(oldGetTarget, newGetTarget);

// Replace showSection
const oldShowSection = `function showSection(sectionId, updateHistory) {
          const targetId = getTargetSectionId(sectionId);

          body.classList.add('js-ready');

          sections.forEach(function (section) {
            const isActive = section.id === targetId;
            section.classList.toggle('active', isActive);

            if (section.dataset.requiresPaymentStatus === 'true') {
              section.style.display = isActive ? 'block' : 'none';
            }
          });

          navLinks.forEach(function (link) {
            const linkTarget = link.getAttribute('href');
            link.removeAttribute('aria-current');

            if (linkTarget === '#' + targetId) {
              link.setAttribute('aria-current', 'page');
            }
          });

          if (updateHistory) {
            history.pushState(null, '', '#' + targetId);
          }

          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }`;

const newShowSection = `function showSection(path, updateHistory) {
          const targetId = getTargetSectionId(path);

          body.classList.add('js-ready');

          sections.forEach(function (section) {
            const isActive = section.id === targetId;
            section.classList.toggle('active', isActive);

            if (section.dataset.requiresPaymentStatus === 'true') {
              section.style.display = isActive ? 'block' : 'none';
            }
          });

          navLinks.forEach(function (link) {
            const linkTarget = link.getAttribute('href');
            link.removeAttribute('aria-current');

            if (path === linkTarget || (linkTarget !== '/' && path.startsWith(linkTarget))) {
              link.setAttribute('aria-current', 'page');
            }
          });

          if (updateHistory) {
            history.pushState(null, '', path);
          }

          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }`;
// Note: due to formatting variations, let's use regex for showSection
html = html.replace(/function showSection\(sectionId, updateHistory\) \{[\s\S]*?window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\);\s*\}/, newShowSection);


// Replace internalLinks event listener
const oldInternalLinks = `internalLinks.forEach(function (link) {
          link.addEventListener('click', function (event) {
            const href = link.getAttribute('href');

            if (!href || href === '#') return;

            const targetId = getTargetSectionId(href);
            const targetSection = document.getElementById(targetId);

            if (!targetSection) return;

            event.preventDefault();
            showSection(targetId, true);
          });
        });`;
const newInternalLinks = `internalLinks.forEach(function (link) {
          link.addEventListener('click', function (event) {
            const href = link.getAttribute('href');
            if (!href || href === '#' || href.startsWith('http') || href.startsWith('mailto')) return;
            
            event.preventDefault();
            
            const url = new URL(href, window.location.origin);
            history.pushState(null, '', url.pathname);
            handleRoute();
          });
        });`;
// Regex for internalLinks
html = html.replace(/internalLinks\.forEach\(function \(link\) \{[\s\S]*?\}\);\s*\}\);/, newInternalLinks);


// Replace window.addEventListener('hashchange' ...
const newRouting = `
        window.addEventListener('popstate', function () {
          handleRoute();
        });

        function handleRoute() {
          const path = window.location.pathname;
          showSection(path, false);
          
          const routeEvent = new CustomEvent('routechange', { detail: { path } });
          window.dispatchEvent(routeEvent);
        }

        window.getRouteSlug = function() {
          const path = window.location.pathname;
          const parts = path.split('/');
          return parts[parts.length - 1];
        };
`;
html = html.replace(/window\.addEventListener\('hashchange', function \(\) \{\s*showSection\(window\.location\.hash, false\);\s*\}\);/, newRouting);


// Replace initial load
html = html.replace(/if \(!urlParams\.get\('payment'\)\) \{\s*showSection\(window\.location\.hash, false\);\s*\}/, 
`if (!urlParams.get('payment')) {
          handleRoute();
        }`);

fs.writeFileSync(file, html);
console.log('HTML Router patched successfully');

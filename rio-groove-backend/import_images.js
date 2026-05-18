require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
}

function extractColor(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('branco') || lowerUrl.includes('branca')) return 'Branco';
  if (lowerUrl.includes('preto') || lowerUrl.includes('preta')) return 'Preto';
  if (lowerUrl.includes('off-white') || lowerUrl.includes('offwhite')) return 'Off White';
  if (lowerUrl.includes('vermelha') || lowerUrl.includes('vermelho')) return 'Vermelho';
  return null;
}

async function run() {
  console.log('Lendo arquivo index.html...');
  const htmlPath = path.resolve(__dirname, '../../rio-groove-cloudflare-final-corrigido/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Clear existing product_images
  console.log('Limpando product_images antigos...');
  await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data: dbProducts, error: pErr } = await supabase.from('products').select('id, slug');
  const { data: dbCollections, error: cErr } = await supabase.from('collections').select('id, slug');
  
  if (pErr) console.error(pErr);
  if (cErr) console.error(cErr);

  console.log(`Produtos no banco: ${dbProducts?.length || 0}`);
  console.log(`Coleções no banco: ${dbCollections?.length || 0}`);

  if (!dbProducts || dbProducts.length === 0) {
      console.log('Nenhum produto encontrado. Execute migrate.js primeiro se necessário.');
  }

  const productMap = {};
  dbProducts?.forEach(p => productMap[p.slug] = p.id);

  const collectionMap = {};
  dbCollections?.forEach(c => collectionMap[c.slug] = c.id);

  const collectionUpdates = [];
  const imageInserts = [];

  const processedProducts = new Set();

  $('section.page-section').each((i, section) => {
    const id = $(section).attr('id');
    if (id && id.startsWith('colecao-') && id !== 'colecoes') {
      const collectionSlug = id.replace('colecao-', '');
      const coverImg = $(section).find('.collection-cover img').attr('src');
      
      const banner_url = coverImg ? (coverImg.startsWith('./') ? coverImg.replace('./', '/') : coverImg) : null;
      
      if (collectionMap[collectionSlug]) {
        collectionUpdates.push({
          id: collectionMap[collectionSlug],
          banner_url: banner_url,
          mobile_banner_url: banner_url,
          thumbnail_url: banner_url
        });
      }
    }
  });

  $('.product-card').each((j, card) => {
    const name = $(card).attr('data-name');
    if (!name) return;
    const slug = slugify(name);
    
    if (productMap[slug] && !processedProducts.has(slug)) {
      processedProducts.add(slug);
      const productId = productMap[slug];
      let sort_order = 0;
      
      const thumbnails = $(card).find('.product-thumbnails img');
      
      if (thumbnails.length > 0) {
                thumbnails.each((k, img) => {
                  let src = $(img).attr('src');
                  // Algumas imagens podem estar vazias, evitar bug
                  if (!src) return;
                  const alt = $(img).attr('alt') || name;
                  // Se for ./images, substitui por /images.
                  // Porém no HTML tá como "./images/miguel-arcanjo-preto.jpg"
                  const imageUrl = src.startsWith('./') ? src.replace('./', '/') : src;
          
          if (imageUrl) {
            const color = extractColor(imageUrl);
            imageInserts.push({
              product_id: productId,
              image_url: imageUrl,
              sort_order: sort_order++,
              alt_text: alt,
              color_variant: color
            });
          }
        });
      } else {
         const mainSrc = $(card).find('.product-main-img').attr('src');
         const imageUrl = mainSrc ? (mainSrc.startsWith('./') ? mainSrc.replace('./', '/') : mainSrc) : null;
         if (imageUrl) {
            const color = extractColor(imageUrl);
            imageInserts.push({
              product_id: productId,
              image_url: imageUrl,
              sort_order: 0,
              alt_text: name,
              color_variant: color
            });
         }
      }
    } else if (!productMap[slug]) {
      // Apenas avisa a primeira vez
      if (!processedProducts.has(slug)) {
        processedProducts.add(slug);
        console.log(`Produto não encontrado no banco: ${slug}`);
      }
    }
  });

  console.log(`Atualizando ${collectionUpdates.length} coleções...`);
  for (const update of collectionUpdates) {
    await supabase.from('collections').update({
      banner_url: update.banner_url,
      mobile_banner_url: update.mobile_banner_url,
      thumbnail_url: update.thumbnail_url
    }).eq('id', update.id);
  }

  console.log(`Inserindo ${imageInserts.length} imagens de produtos...`);
  for (const img of imageInserts) {
    const { error } = await supabase.from('product_images').insert(img);
    if (error) {
        console.error('Erro ao inserir imagem:', error);
    }
  }

  console.log('Importação de imagens concluída!');
}

run().catch(console.error);

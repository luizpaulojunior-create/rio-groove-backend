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

async function run() {
  console.log('Lendo arquivo index.html...');
  const htmlPath = path.resolve(__dirname, '../../rio-groove-cloudflare-final-corrigido/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Limpar dados existentes (opcional, mas bom para garantir)
  console.log('Limpando dados antigos...');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('collections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const collections = [];
  const products = [];

  $('section.page-section').each((i, section) => {
    const id = $(section).attr('id');
    if (id && id.startsWith('colecao-') && id !== 'colecoes') {
      const collectionSlug = id.replace('colecao-', '');
      const coverImg = $(section).find('.collection-cover img').attr('src');
      let title = '';
      $(section).find('h2.heading-lg').contents().each((_, el) => {
        if (el.type === 'text') {
          title += $(el).text();
        } else if (el.type === 'tag' && el.name === 'span') {
          title += ' ' + $(el).text();
        }
      });
      title = title.replace(/\s+/g, ' ').trim();
      const description = $(section).find('p.text-muted').first().text().trim();

      collections.push({
        id_temp: id, // internal use
        name: title,
        slug: collectionSlug,
        description: description,
        banner_url: coverImg ? (coverImg.startsWith('./') ? coverImg.replace('./', '/') : coverImg) : null
      });

      // Products in this collection
      $(section).find('.product-card').each((j, card) => {
        const name = $(card).attr('data-name');
        const priceStr = $(card).attr('data-price');
        const price = parseFloat(priceStr || '0');
        const imageUrl = $(card).attr('data-image');
        const colors = $(card).attr('data-colors') || '';

        let desc = `Peça premium Rio Groove Store. Modelagem exclusiva e acabamento impecável.\nCores disponíveis: ${colors}`;

        products.push({
          collection_temp_id: id,
          name: name,
          slug: slugify(name),
          price: price,
          description: desc,
          image_url: imageUrl ? (imageUrl.startsWith('./') ? imageUrl.replace('./', '/') : imageUrl) : null,
          category: title,
          stock: 50, // mock stock
          active: true
        });
      });
    }
  });

  console.log(`Encontradas ${collections.length} coleções e ${products.length} produtos.`);

  // Insert collections
  const colMap = {};
  for (const col of collections) {
    console.log(`Inserindo coleção: ${col.name}`);
    const { data, error } = await supabase.from('collections').insert({
      name: col.name,
      slug: col.slug,
      description: col.description,
      banner_url: col.banner_url
    }).select('*').single();

    if (error) {
      console.error('Erro ao inserir coleção:', error);
    } else {
      colMap[col.id_temp] = data.id;
    }
  }

  // Insert products
  for (const prod of products) {
    console.log(`Inserindo produto: ${prod.name}`);
    const colId = colMap[prod.collection_temp_id];
    
    const { data, error } = await supabase.from('products').insert({
      name: prod.name,
      slug: prod.slug,
      price: prod.price,
      description: prod.description,
      image_url: prod.image_url,
      category: prod.category,
      stock: prod.stock,
      active: prod.active,
      collection_id: colId
    }).select('*').single();

    if (error) {
      console.error('Erro ao inserir produto:', error);
    } else if (prod.image_url) {
      // Create primary image in product_images
      const { error: imgError } = await supabase.from('product_images').insert({
        product_id: data.id,
        image_url: prod.image_url,
        sort_order: 0
      });
      if (imgError) {
        console.error('Erro ao inserir product_image:', imgError);
      }
    }
  }

  console.log('Migração concluída!');
}

run().catch(console.error);

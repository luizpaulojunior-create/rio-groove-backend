require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function inspect() {
  console.log('Fetching files from product-images bucket...');
  const { data: files, error: filesError } = await supabase.storage.from('product-images').list();
  
  if (filesError) {
    console.error('Error fetching files:', filesError);
    return;
  }
  
  const fileNames = files.map(f => f.name).filter(n => n !== '.emptyFolderPlaceholder');
  console.log(`Found ${fileNames.length} files in bucket:`);
  console.log(fileNames);

  console.log('\nFetching all products and images...');
  
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      slug,
      product_images (
        id, 
        image_url
      )
    `);

  if (prodError) {
    console.error('Error fetching products:', prodError);
    return;
  }

  products.forEach(p => {
    console.log(`\nProduct: ${p.name} (${p.slug})`);
    if (p.product_images) {
      p.product_images.forEach(img => {
        console.log(` - ID: ${img.id}, URL: ${img.image_url}`);
      });
    }
  });
}

inspect();

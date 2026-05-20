const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function checkImages() {
  const { data: images, error } = await supabase.from('product_images').select('id, image_url');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Checking ${images.length} images...`);
  
  for (const img of images) {
    try {
      const res = await fetch(img.image_url, { method: 'HEAD' });
      console.log(`[${res.status}] ${img.image_url}`);
    } catch (err) {
      console.log(`[ERROR] ${img.image_url}: ${err.message}`);
    }
  }
}

checkImages();
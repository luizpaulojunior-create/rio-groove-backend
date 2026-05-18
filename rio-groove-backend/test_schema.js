require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSchema() {
  const { data, error } = await supabase.from('product_images').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('product_images exists! Data:', data);
  }

  const { data: cData, error: cError } = await supabase.from('collections').select('thumbnail_url').limit(1);
  if (cError) {
    console.error('Error on collections.thumbnail_url:', cError.message);
  } else {
    console.log('collections.thumbnail_url exists!', cData);
  }
}

testSchema();
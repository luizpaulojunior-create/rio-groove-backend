require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  // Just try to select image_url explicitly
  const { error: err2 } = await supabase.from('products').select('image_url').limit(1);
  console.log('Has image_url?', !err2);
  if (err2) console.log(err2);
}
check();

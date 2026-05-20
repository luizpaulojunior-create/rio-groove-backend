const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
  const url = 'https://cvpobvvkhcqasumhfwps.supabase.co/storage/v1/object/public/product-images/ogum-o-guerreiro-preto.jpg';
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    console.log(`Status: ${res.status}`);
    console.log(`Size: ${buffer.byteLength} bytes`);
  } catch(e) {
    console.error(e);
  }
}

test();

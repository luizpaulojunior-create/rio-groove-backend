const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function fixBucket() {
  const { data, error } = await supabase.storage.getBucket('product-images');
  if (error) {
    console.error('Error getting bucket:', error);
  } else {
    console.log('Bucket config:', data);
    
    if (!data.public) {
      console.log('Bucket is not public, updating...');
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });
      console.log('Update result:', updateData, updateError);
    }
  }
}

fixBucket();

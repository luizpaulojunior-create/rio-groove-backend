require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createBuckets() {
  const buckets = ['products', 'collections', 'campaigns'];
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'],
      fileSizeLimit: 20971520 // 20MB (personalizados — artes até ~20 MB)
    });
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`Bucket ${bucket} already exists.`);
        // Try to update to public just in case
        await supabase.storage.updateBucket(bucket, { public: true });
      } else {
        console.log(`Error creating ${bucket}:`, error.message);
      }
    } else {
      console.log(`Bucket ${bucket} created successfully.`);
    }
  }
}
createBuckets();

const supabase = require('../lib/supabase');
const crypto = require('crypto');

const uploadImage = async (file, bucket, folderPath = '') => {
  console.log('FILE:', file);
  console.log('FILE NAME:', file.originalname);
  console.log('MIME:', file.mimetype);
  console.log('SIZE:', file.size);

  const extension = file.originalname.split('.').pop();
  const filename = `${crypto.randomUUID()}.${extension}`;
  const filePath = folderPath ? `${folderPath}/${filename}` : filename;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  console.log('UPLOAD DATA:', data);
  console.log('UPLOAD ERROR:', error);

  if (error) {
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

module.exports = {
  uploadImage
};

const supabase = require('../lib/supabase');
const crypto = require('crypto');

const uploadImage = async (file, bucket, folderPath = '') => {
  const extension = file.originalname.split('.').pop();
  const filename = `${crypto.randomUUID()}.${extension}`;
  const filePath = folderPath ? `${folderPath}/${filename}` : filename;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

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

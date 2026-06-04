const supabase = require('../lib/supabase');
const crypto = require('crypto');

const { STORAGE_BUCKET } = require('../config/storage');

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const CUSTOM_ORDER_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'svg', 'ai', 'eps', 'ps',
]);

async function uploadBuffer(file, bucket, folderPath, allowedExtensions) {
  const safeName = String(file.originalname || 'file')
    .replace(/[/\\]/g, '')
    .replace(/[^\w.\-]+/g, '_');
  const extension = (safeName.split('.').pop() || 'bin').toLowerCase().slice(0, 8);
  if (!allowedExtensions.has(extension)) {
    throw Object.assign(new Error('Extensão de arquivo não permitida.'), { statusCode: 400 });
  }
  const filename = `${crypto.randomUUID()}.${extension}`;
  const filePath = folderPath ? `${folderPath}/${filename}` : filename;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

const uploadImage = (file, bucket, folderPath) =>
  uploadBuffer(file, bucket, folderPath, IMAGE_EXTENSIONS);

const uploadCustomOrderFile = (file, bucket, folderPath) =>
  uploadBuffer(file, bucket, folderPath, CUSTOM_ORDER_EXTENSIONS);

module.exports = {
  uploadImage,
  uploadCustomOrderFile,
};

const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function imageFileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
    cb(null, true);
    return;
  }
  cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'));
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 20 },
  fileFilter: imageFileFilter,
});

module.exports = {
  imageUpload,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
};

const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const CUSTOM_ORDER_MIME_TYPES = new Set([
  ...ALLOWED_MIME_TYPES,
  'application/pdf',
  'image/svg+xml',
  'application/postscript',
  'application/illustrator',
  'application/vnd.adobe.illustrator',
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

function customOrderFileFilter(_req, file, cb) {
  if (CUSTOM_ORDER_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
    cb(null, true);
    return;
  }
  cb(new Error('Tipo de arquivo não permitido. Use imagem, PDF ou vetor.'));
}

const customOrderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 10 },
  fileFilter: customOrderFileFilter,
});

module.exports = {
  imageUpload,
  customOrderUpload,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  CUSTOM_ORDER_MIME_TYPES,
};

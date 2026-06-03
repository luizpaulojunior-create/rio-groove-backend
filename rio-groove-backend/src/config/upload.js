const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — uploads gerais (produtos, etc.)
const CUSTOM_ORDER_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB — arte/referência personalizados

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

const CUSTOM_ORDER_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.svg', '.ai', '.eps', '.ps',
]);

function customOrderFileFilter(_req, file, cb) {
  const mime = String(file.mimetype || '').toLowerCase();
  if (CUSTOM_ORDER_MIME_TYPES.has(mime)) {
    cb(null, true);
    return;
  }

  const name = String(file.originalname || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';
  if (mime === 'application/octet-stream' && CUSTOM_ORDER_EXTENSIONS.has(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('Tipo de arquivo não permitido. Use imagem, PDF ou vetor.'));
}

const customOrderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CUSTOM_ORDER_MAX_FILE_SIZE_BYTES, files: 10 },
  fileFilter: customOrderFileFilter,
});

module.exports = {
  imageUpload,
  customOrderUpload,
  MAX_FILE_SIZE_BYTES,
  CUSTOM_ORDER_MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  CUSTOM_ORDER_MIME_TYPES,
};

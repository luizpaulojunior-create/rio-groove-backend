const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/upload.service');
const { STORAGE_BUCKET } = require('../config/storage');

const uploadFile = asyncHandler(async (req, res) => {
  console.log('--- UPLOAD REQUEST INICIADO ---');
  console.log('req.body:', req.body);
  console.log('req.file info:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'Nenhum arquivo recebido');

  if (!req.file) {
    console.error('Erro: Nenhum arquivo enviado');
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const { path } = req.body;

  // Bucket fixo — ignora bucket arbitrário do client
  const targetBucket = STORAGE_BUCKET;
  console.log('Target Bucket:', targetBucket, 'Path:', path);

  const publicUrl = await uploadService.uploadImage(req.file, targetBucket, path);
  console.log('Upload finalizado, URL pública:', publicUrl);
  
  return res.json({ url: publicUrl });
});

module.exports = {
  uploadFile
};

const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/upload.service');
const { STORAGE_BUCKET } = require('../config/storage');
const { sanitizeStorageFolderPath } = require('../utils/sanitize-storage-path');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const folderPath = sanitizeStorageFolderPath(req.body.path);
  const publicUrl = await uploadService.uploadImage(req.file, STORAGE_BUCKET, folderPath);

  return res.json({ url: publicUrl });
});

module.exports = {
  uploadFile
};

const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/upload.service');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const { bucket, path } = req.body;
  if (!bucket) {
    return res.status(400).json({ error: 'Bucket não especificado' });
  }

  const publicUrl = await uploadService.uploadImage(req.file, bucket, path);
  
  return res.json({ url: publicUrl });
});

module.exports = {
  uploadFile
};

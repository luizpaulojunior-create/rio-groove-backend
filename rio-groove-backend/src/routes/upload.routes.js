const express = require('express');
const { imageUpload } = require('../config/upload');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const requireMinRole = require('../middlewares/require-min-role');
const { uploadFile } = require('../controllers/upload.controller');

const router = express.Router();
const upload = imageUpload;

router.post('/api/upload', requireAdminAuth, requireMinRole('editor'), upload.single('file'), uploadFile);

module.exports = router;

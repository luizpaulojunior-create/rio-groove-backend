const express = require('express');
const multer = require('multer');
const requireAdminAuth = require('../middlewares/require-admin-auth');
const { uploadFile } = require('../controllers/upload.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/upload', requireAdminAuth, upload.single('file'), uploadFile);

module.exports = router;

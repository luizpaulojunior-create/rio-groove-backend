const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/upload.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/upload', upload.single('file'), uploadFile);

module.exports = router;

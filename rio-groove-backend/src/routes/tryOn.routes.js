const express = require('express');
const { imageUpload } = require('../config/upload');
const { tryOnLimiter } = require('../middlewares/rate-limit');
const { tryOnStatus, createTryOn } = require('../controllers/tryOn.controller');

const router = express.Router();

router.get('/api/try-on', tryOnStatus);
router.post('/api/try-on', tryOnLimiter, imageUpload.single('photo'), createTryOn);

module.exports = router;

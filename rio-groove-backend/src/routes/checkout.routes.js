const express = require('express');
const { checkout } = require('../controllers/checkout.controller');

const router = express.Router();

router.post('/api/checkout', checkout);

module.exports = router;

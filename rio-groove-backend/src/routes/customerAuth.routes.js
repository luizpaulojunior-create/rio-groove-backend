const express = require('express');
const {
  registerCustomer,
  activateCustomer,
} = require('../controllers/customerAuth.controller');
const { customerAuthLimiter } = require('../middlewares/rate-limit');

const router = express.Router();

router.post('/register', customerAuthLimiter, registerCustomer);
router.post('/activate', customerAuthLimiter, activateCustomer);

module.exports = router;

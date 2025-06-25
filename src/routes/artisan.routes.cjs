const express = require('express');
const router = express.Router();
const artisanCtrl = require('../controllers/artisan.controller.cjs');
const verifyToken = require('../middlewares/verifyTokens.cjs');

router.post('/add-product', verifyToken, artisanCtrl.addProduct);

module.exports = router;
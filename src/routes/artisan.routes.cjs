const express = require('express');
const router = express.Router();
const artisanCtrl = require('../controllers/artisan.controller.cjs');
const verifyToken = require('../middlewares/verifyTokens.cjs');

router.post('/add-product', verifyToken, artisanCtrl.addProduct);
router.get('/get-products', verifyToken, artisanCtrl.getProductsArtisan);
router.delete('/delete-product', verifyToken, artisanCtrl.deleteProduct);

module.exports = router;
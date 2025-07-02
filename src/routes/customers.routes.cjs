const express = require('express');
const router = express.Router();
const customersCtrl = require('../controllers/customers.controller.cjs');
const verifyToken = require('../middlewares/verifyTokens.cjs');

router.get('/get-products', verifyToken, customersCtrl.getClientProducts);
router.get('/get-deliveries', verifyToken, customersCtrl.getDelivery);
router.post('/create-delivery', verifyToken, customersCtrl.createDelivery);
router.post('/add-product', verifyToken, customersCtrl.addProductToKart);

module.exports = router;
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller.cjs');
const verifyToken = require('../middlewares/verifyTokens.cjs');

router.get('/get-users', verifyToken, adminCtrl.getUsers);
router.post('/change-type', verifyToken, adminCtrl.changeType);

module.exports = router;
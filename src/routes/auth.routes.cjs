const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller.cjs');
const verifyToken = require('../middlewares/verifyTokens.cjs');

router.post('/login', authCtrl.login);
router.post('/register/client', authCtrl.registerClient);
router.post('/register/pro', authCtrl.registerPro);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);
router.get('/user', verifyToken ,authCtrl.getUser);

module.exports = router;

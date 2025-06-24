const express = require('express');
const router = express.Router();
const accountCtrl = require('../controllers/account.controller.cjs');
const verifyToken = require('../middlewares/verifyTokens.cjs');

router.post('/upload-profile-picture', verifyToken, accountCtrl.setProfilePicture);
module.exports = router;
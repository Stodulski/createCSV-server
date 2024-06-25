const express = require('express');
const router = express.Router();
const authController = require('../controller/user');

router.post('/login', authController.login);

module.exports = router;
const express = require('express');
const { register, login, forgotPassword, refreshSession } = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/refresh', refreshSession); // Mount refresh session route

module.exports = router;

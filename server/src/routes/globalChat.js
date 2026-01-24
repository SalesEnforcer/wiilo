const express = require('express');
const { getRecentMessages } = require('../controllers/chat');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/recent', getRecentMessages);

module.exports = router;

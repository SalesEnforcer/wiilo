const express = require('express');
const { getMessages, sendMessage } = require('../controllers/chat');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getMessages)
  .post(sendMessage);

module.exports = router;

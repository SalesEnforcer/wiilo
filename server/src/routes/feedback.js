const express = require('express');
const { submitFeedback } = require('../controllers/feedback');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', submitFeedback);

module.exports = router;

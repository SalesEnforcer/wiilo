const express = require('express');
const { getNotifications, markNotificationsRead } = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read', markNotificationsRead);

module.exports = router;

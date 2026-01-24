const express = require('express');
const { getTeam, addMember, updateProfile } = require('../controllers/users');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTeam)
  .post(addMember);

// New Route for Profile
router.route('/profile')
  .put(updateProfile);

module.exports = router;

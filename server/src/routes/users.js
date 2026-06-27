const express = require('express');
const { getTeam, addMember, updateMember, updateProfile } = require('../controllers/users');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTeam)
  .post(addMember);

router.route('/profile')
  .put(updateProfile);

router.route('/:id')
  .put(updateMember);

module.exports = router;

const express = require('express');
const { getResources, addResource } = require('../controllers/resources');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getResources)
  .post(addResource);

module.exports = router;

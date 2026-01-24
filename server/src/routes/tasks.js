const express = require('express');
const { getTasks, createTask, updateTask, addComment } = require('../controllers/tasks');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask);

// Comment Route: POST /api/tasks/:id/comments
router.route('/:id/comments')
  .post(addComment);

module.exports = router;

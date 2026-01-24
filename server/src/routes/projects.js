const express = require('express');
const { getProjects, createProject } = require('../controllers/projects');
const { protect } = require('../middleware/auth');

const taskRouter = require('./tasks');
const chatRouter = require('./chat');
const resourceRouter = require('./resources'); // <--- New

const router = express.Router();

router.use('/:projectId/tasks', taskRouter);
router.use('/:projectId/messages', chatRouter);
router.use('/:projectId/resources', resourceRouter); // <--- New

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

module.exports = router;

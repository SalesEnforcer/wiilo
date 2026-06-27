const express = require('express');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projects');
const { protect } = require('../middleware/auth');

const taskRouter = require('./tasks');
const chatRouter = require('./chat');
const resourceRouter = require('./resources');

const router = express.Router();

router.use('/:projectId/tasks', taskRouter);
router.use('/:projectId/messages', chatRouter);
router.use('/:projectId/resources', resourceRouter);

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;

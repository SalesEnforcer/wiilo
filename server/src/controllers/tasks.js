const Task = require('../models/Task');

// Get Tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
                            .populate('comments.user', 'name role'); // Get commenter names
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    req.body.project = req.params.projectId;
    req.body.organization = req.user.organization;
    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update Task (Status, Notes, Milestone)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('comments.user', 'name role');
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Add Comment
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newComment = {
      text: req.body.text,
      user: req.user.id
    };

    task.comments.unshift(newComment); // Add to top
    await task.save();
    
    // Populate user info for the new comment to return fully formed object
    await task.populate('comments.user', 'name role');

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const Message = require('../models/Message');
const Project = require('../models/Project');

// @desc    Get messages for a specific project
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ project: req.params.projectId })
                                  .populate('sender', 'name role')
                                  .sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Send a message
exports.sendMessage = async (req, res) => {
  try {
    const message = await Message.create({
      content: req.body.content,
      project: req.params.projectId,
      sender: req.user.id
    });
    await message.populate('sender', 'name role');
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get Recent Messages (Global Feed)
// @route   GET /api/chat/recent
exports.getRecentMessages = async (req, res) => {
  try {
    // 1. Find Projects the user is part of
    let projectQuery = { organization: req.user.organization };
    
    if (req.user.role === 'client') projectQuery.client = req.user.id;
    if (req.user.role === 'dev') projectQuery.devs = req.user.id;

    const myProjects = await Project.find(projectQuery).select('_id');
    const projectIds = myProjects.map(p => p._id);

    // 2. Find messages in those projects (Limit 5, Newest first)
    const messages = await Message.find({ project: { $in: projectIds } })
                                  .sort({ createdAt: -1 })
                                  .limit(5)
                                  .populate('sender', 'name role')
                                  .populate('project', 'name'); // We need project name for the UI

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

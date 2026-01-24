const Project = require('../models/Project');

// @desc    Get Projects (SECURE FILTERING)
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    let query = { organization: req.user.organization };

    // SECURITY CHECK:
    // If not Admin, restrict query to assigned projects only
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'dev') {
      query.devs = req.user.id;
    }
    // Superadmin sees all (default query)

    const projects = await Project.find(query)
      .populate('client', 'name email')
      .populate('devs', 'name email');
    
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    req.body.organization = req.user.organization;
    const project = await Project.create(req.body);

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

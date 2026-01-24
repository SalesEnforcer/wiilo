const Resource = require('../models/Resource');

// @desc Get Resources for Project
exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ project: req.params.projectId });
    res.status(200).json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc Add Resource
exports.addResource = async (req, res) => {
  try {
    req.body.project = req.params.projectId;
    req.body.organization = req.user.organization;
    const resource = await Resource.create(req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

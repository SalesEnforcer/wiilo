const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  budget: {
    type: Number,
    required: [true, 'Please add a total budget']
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  // NEW: Explicit Assignments
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  devs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', ProjectSchema);

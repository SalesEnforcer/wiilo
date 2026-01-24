const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String, // Internal Notes
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'review', 'done'], 
    default: 'todo' 
  },
  isBlocked: { type: Boolean, default: false },
  milestone: { type: String, default: 'Backlog' }, // E.g., "Sprint 1", "Launch"
  dueDate: Date,
  
  // Embedded Comments (Array is fine for < 500 comments per task)
  comments: [{
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);

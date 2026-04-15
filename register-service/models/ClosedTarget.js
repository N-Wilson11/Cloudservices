var mongoose = require('mongoose');

var closedTargetSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  closedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  deadlineAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClosedTarget', closedTargetSchema);

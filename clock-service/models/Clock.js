var mongoose = require('mongoose');

var clockSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  ownerId: {
    type: String,
    required: true,
    trim: true
  },
  ownerEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  deadlineAt: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['running', 'reached', 'cancelled'],
    default: 'running',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  reminderSentAt: {
    type: Date,
    default: null
  },
  reachedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Clock', clockSchema);

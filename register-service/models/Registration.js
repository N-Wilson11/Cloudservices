var mongoose = require('mongoose');

var registrationSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['participant', 'target-owner']
  },
  targetOwnerId: {
    type: String,
    required: true,
    trim: true
  },
  targetDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

registrationSchema.index(
  { targetId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);

module.exports = mongoose.model('Registration', registrationSchema);

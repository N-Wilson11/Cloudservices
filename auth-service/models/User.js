var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'target-owner'],
    default: 'participant'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

var mongoose = require('mongoose');

var winnerSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  winnerSubmissionId: {
    type: String,
    default: null
  },
  winnerUserId: {
    type: String,
    default: null
  },
  winnerUserEmail: {
    type: String,
    default: null
  },
  similarityScore: {
    type: Number,
    default: null
  },
  finalScore: {
    type: Number,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  deadlineAt: {
    type: Date,
    required: true
  },
  calculatedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Winner', winnerSchema);

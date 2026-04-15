var mongoose = require('mongoose');

var voteSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  vote: {
    type: String,
    enum: ['up', 'down'],
    required: true
  }
}, {
  timestamps: true
});

voteSchema.index({ targetId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);

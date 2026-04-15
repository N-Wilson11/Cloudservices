var mongoose = require('mongoose');

var submissionSchema = new mongoose.Schema({
  sourceSubmissionId: {
    type: String
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  similarityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

submissionSchema.index({ targetId: 1, userId: 1, createdAt: -1 });
submissionSchema.index({ sourceSubmissionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Submission', submissionSchema);

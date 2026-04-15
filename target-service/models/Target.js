var mongoose = require('mongoose');

var targetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  locationDescription: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  radiusMeters: {
    type: Number,
    required: true,
    min: 1,
    default: 250
  },
  deadlineAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  ownerId: {
    type: String,
    required: true
  },
  ownerEmail: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

targetSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Target', targetSchema);

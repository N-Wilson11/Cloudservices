var mongoose = require('mongoose');

module.exports = function connectDatabase(mongoUri) {
  return mongoose.connect(mongoUri);
};

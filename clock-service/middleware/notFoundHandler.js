module.exports = function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      message: 'Route not found'
    }
  });
};

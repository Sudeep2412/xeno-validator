/**
 * Global error handler middleware for Express
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err);
  
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;

import createError from 'http-errors';

// 404 handler (for unknown routes)
export const notFound = (req, _res, next) => {
  next(createError(404, 'Endpoint Not Found'));
};

// Global error handler
export const errorHandler = (err, req, res, _next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

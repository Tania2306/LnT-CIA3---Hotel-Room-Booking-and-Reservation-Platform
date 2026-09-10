// Small helper controllers throw so the centralized handler below can map
// it to the correct HTTP status/errorCode instead of a generic 500.
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// 404 handler for unmatched routes - runs before the error handler.
const notFound = (req, res, next) => {
  const err = new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(err);
};

// Centralized Express error-handling middleware. Every controller in this
// project calls next(err) on failure instead of building its own response,
// so all error responses share one consistent JSON shape and the server
// never crashes on a normal invalid request.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'SERVER_ERROR';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found for id: ${err.value}`;
    errorCode = 'INVALID_ID';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for field: ${field}`;
    errorCode = 'DUPLICATE_RECORD';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

module.exports = { AppError, notFound, errorHandler };

/**
 * Global Express Error Handler
 */
function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Unhandled Error:`, err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  const responsePayload = {
    error: message,
    status: status
  };

  // Attach stack trace if not in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(status).json(responsePayload);
}

module.exports = errorHandler;

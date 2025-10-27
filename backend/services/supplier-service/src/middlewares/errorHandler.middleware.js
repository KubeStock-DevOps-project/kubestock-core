const logger = require("../config/logger");

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default error structure
  const error = {
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };

  // Set status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json(error);
};

// Not found handler
const notFoundHandler = (req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

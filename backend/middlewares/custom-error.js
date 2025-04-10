const handleError = (err, req, res, next) => {
  // Use err.statusCode if available, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Use err.message or err.msg, or a default message
  const message = err.message || err.msg || "An unexpected error occurred";

  res.status(statusCode).json({ message });
};

module.exports = handleError;

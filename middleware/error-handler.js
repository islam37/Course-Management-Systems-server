function errorHandler(error, req, res, next) {
  console.error("Unhandled error:", error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Resource already exists" });
  }

  res.status(500).json({ message: "Internal server error" });
}

module.exports = errorHandler;

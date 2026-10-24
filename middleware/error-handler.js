function errorHandler(error, req, res, next) {
  console.error("Unhandled error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({ message: "Internal server error" });
}

module.exports = errorHandler;

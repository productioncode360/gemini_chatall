// src/middleware/error.middleware.js
import log from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  log.error(`[${req.method}] ${req.path} - ${message}`, err);

  res.status(status).json({
    success: false,
    error: message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
};

export default errorMiddleware;
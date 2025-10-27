require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./config/logger");
const errorHandler = require("./middlewares/errorHandler.middleware");
const orderRoutes = require("./routes/order.routes");

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    query: req.query,
    body: req.body,
  });
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "order-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/orders", orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.url,
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Order Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;

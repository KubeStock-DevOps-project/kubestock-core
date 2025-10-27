require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const db = require("./config/database");
const logger = require("./config/logger");
const supplierRoutes = require("./routes/supplier.routes");
const purchaseOrderRoutes = require("./routes/purchaseOrder.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/errorHandler.middleware");

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "supplier-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
  logger.info(`Supplier Service running on port ${PORT}`);
});

module.exports = app;

const { body, param } = require("express-validator");

const supplierValidation = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Supplier name is required")
      .isLength({ min: 2, max: 255 })
      .withMessage("Name must be between 2 and 255 characters"),
    body("contact_person")
      .trim()
      .notEmpty()
      .withMessage("Contact person is required")
      .isLength({ max: 255 })
      .withMessage("Contact person must not exceed 255 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Must be a valid email address"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .isLength({ max: 20 })
      .withMessage("Phone must not exceed 20 characters"),
    body("address")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Address must not exceed 500 characters"),
    body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be either 'active' or 'inactive'"),
  ],

  update: [
    param("id").isInt().withMessage("Supplier ID must be a valid integer"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage("Name must be between 2 and 255 characters"),
    body("contact_person")
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage("Contact person must not exceed 255 characters"),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Must be a valid email address"),
    body("phone")
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Phone must not exceed 20 characters"),
    body("address")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Address must not exceed 500 characters"),
    body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be either 'active' or 'inactive'"),
  ],
};

const purchaseOrderValidation = {
  create: [
    body("supplier_id")
      .notEmpty()
      .withMessage("Supplier ID is required")
      .isInt({ gt: 0 })
      .withMessage("Supplier ID must be a positive integer"),
    body("order_date")
      .notEmpty()
      .withMessage("Order date is required")
      .isISO8601()
      .withMessage("Order date must be a valid date"),
    body("expected_delivery_date")
      .optional()
      .isISO8601()
      .withMessage("Expected delivery date must be a valid date"),
    body("total_amount")
      .notEmpty()
      .withMessage("Total amount is required")
      .isFloat({ min: 0 })
      .withMessage("Total amount must be a positive number"),
    body("status")
      .optional()
      .isIn(["pending", "approved", "ordered", "received", "cancelled"])
      .withMessage(
        "Status must be one of: pending, approved, ordered, received, cancelled"
      ),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must not exceed 1000 characters"),
  ],

  update: [
    param("id")
      .isInt()
      .withMessage("Purchase order ID must be a valid integer"),
    body("supplier_id")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Supplier ID must be a positive integer"),
    body("order_date")
      .optional()
      .isISO8601()
      .withMessage("Order date must be a valid date"),
    body("expected_delivery_date")
      .optional()
      .isISO8601()
      .withMessage("Expected delivery date must be a valid date"),
    body("actual_delivery_date")
      .optional()
      .isISO8601()
      .withMessage("Actual delivery date must be a valid date"),
    body("total_amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Total amount must be a positive number"),
    body("status")
      .optional()
      .isIn(["pending", "approved", "ordered", "received", "cancelled"])
      .withMessage(
        "Status must be one of: pending, approved, ordered, received, cancelled"
      ),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must not exceed 1000 characters"),
  ],

  updateStatus: [
    param("id")
      .isInt()
      .withMessage("Purchase order ID must be a valid integer"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["pending", "approved", "ordered", "received", "cancelled"])
      .withMessage(
        "Status must be one of: pending, approved, ordered, received, cancelled"
      ),
  ],
};

module.exports = {
  supplierValidation,
  purchaseOrderValidation,
};

const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: {
    name: String,
    email: String,
  },
  product: {
    type: { type: String },
    size: String,
    quantity: Number,
    priceCents: Number,
  },
  design: {
    mode: String,
    frontUrl: String,
    backUrl: String,
    pdfUrl: String,
  },
  mailing: {
    recipient: Object,
    csvUrl: String,
  },
  proof: {
    frontProofUrl: String,
    backProofUrl: String,
    approvedByUserAt: Date,
  },
  payment: {
    provider: { type: String, default: "paypal" },
    paypalOrderId: String,
    status: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paidAt: Date,
  },
  admin: {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: String,
    approvedAt: Date,
    printerJobId: String,
    printerResponse: Object,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);

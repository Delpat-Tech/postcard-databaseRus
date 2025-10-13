const mongoose = require("mongoose");

const RecipientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  externalReferenceNumber: { type: String },
});

const ReturnAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
});

const OrderSchema = new mongoose.Schema({
  designType: {
    type: String,
    enum: ["single", "split", "drip"],
    default: 'single'
  },
  designId: { type: String },
  designName: { type: String },
  designSize: { type: String },
  isCustomDesign: { type: Boolean, default: false },
  mailClass: {
    type: String,
    enum: ["FirstClass", "Standard"],
    default: "FirstClass",
  },
  externalReference: { type: String },
  mailDate: { type: String, required: true },
  brochureFold: {
    type: String,
    enum: ["Tri-Fold", "Bi-Fold"],
    default: "Bi-Fold",
  },
  returnAddress: ReturnAddressSchema,
  recipients: [RecipientSchema],
  status: {
    type: String,
    enum: [
      "draft",
      "pending_admin_approval",
      "submitted_to_pcm",
      "approved",
      "rejected",
    ],
    default: "draft",
  },
  pcmOrderId: { type: String },
  pcmResponse: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);

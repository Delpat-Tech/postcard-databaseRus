const mongoose = require("mongoose");

const DesignVariableSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

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
  variables: [DesignVariableSchema],
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
  phone: { type: String },
  email: { type: String },
});

const AddressingConfigSchema = new mongoose.Schema({
  font: {
    type: String,
    enum: [
      "Bradley Hand",
      "Blackjack",
      "FG Cathies Hand",
      "Crappy Dan",
      "Dakota",
      "Jenna Sue",
      "Reenie Beanie",
    ],
  },
  fontColor: { type: String, enum: ["Black", "Green", "Blue"] },
  exceptionalAddressingType: { type: String, enum: ["resident", "occupant", "business"] },
  extRefNbr: { type: String },
});

const OrderSchema = new mongoose.Schema({
  designType: {
    type: String,
    enum: ["single", "split", "drip"],
    default: "single",
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
  userDet: {
    phone: { type: String },
    email: { type: String },
  },
  recipients: {
    type: [RecipientSchema],
    validate: [v => v.length > 0, "Order must have at least one recipient"],
  },
  addons: [{ addon: { type: String, enum: ["UV", "Livestamping"] } }],
  front: { type: String },
  back: { type: String },
  frontPdf: { type: Buffer },
  backPdf: { type: Buffer },
  addressing: AddressingConfigSchema,
  globalDesignVariables: [DesignVariableSchema],
  qrCodeID: { type: Number },
  status: {
    type: String,
    enum: ["draft", "pending_admin_approval", "submitted_to_pcm", "approved", "rejected"],
    default: "draft",
  },
  pcmOrderId: { type: String },
  pcmResponse: { type: Object },
  frontproof: { type: String },
  backproof: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);

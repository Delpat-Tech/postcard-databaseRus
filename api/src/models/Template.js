const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  pcmDesignId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  previewUrl: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Template", TemplateSchema);

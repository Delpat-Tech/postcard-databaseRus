const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  previewUrl: { type: String },
  templateType: { type: String, default: "front/back" },
  sizes: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Template", TemplateSchema);

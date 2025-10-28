const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  pcmDesignId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  size: { type: String, required: true }, // flattened from size.label
  // Template type: used to separate postcards, letters, brochures, bookmarks etc.
  type: { type: String, enum: ["postcard", "letter", "brochure", "bookmark"], default: "postcard" },
  previewUrl: { type: String },
  // soft-delete flag: when true the template is hidden from listings but kept in DB
  deleted: { type: Boolean, default: false },
  // store the original PostcardMania design payload so we don't lose any data
  rawData: { type: mongoose.Schema.Types.Mixed },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Template", TemplateSchema);

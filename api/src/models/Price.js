const mongoose = require('mongoose');

// Pricing rule shape
const PricingRule = new mongoose.Schema({
  sizeKey: { type: String, required: true },
  sizeLabel: { type: String },
  mailClass: { type: String, enum: ["FirstClass", "Standard"], required: true },
  one: { type: Number, required: true },
  twoTo99: { type: Number, required: true },
  hundredUp: { type: Number, required: true },
});

const PriceSchema = new mongoose.Schema({
  // pricingByType holds arrays of PricingRule for each product type
  pricingByType: {
    postcard: { type: [PricingRule], default: [] },
    letter: { type: [PricingRule], default: [] },
    brochure: { type: [PricingRule], default: [] },
    bookmark: { type: [PricingRule], default: [] },
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Price', PriceSchema);

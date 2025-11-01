const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Tempalate = require("../models/Template");
const { adminAuth } = require("../middleware/auth");
const postcardManiaService = require("../services/postcard");

const Price = require("../models/Price");

/**
 * Calculate price per piece using pricing rules fetched from DB.
 * @param {Array} rules - Array of pricing rules for the product type
 * @param {string} size - design size key
 * @param {string} mailClass - mail class
 * @param {number} quantity - recipient count
 */
function calculatePricePerPieceFromRules(rules, size, mailClass, quantity) {
  if (!Array.isArray(rules) || rules.length === 0) return 0;
  const rule = rules.find((r) => r.sizeKey === size && r.mailClass === mailClass);
  if (!rule) return 0;

  if (quantity === 1) return rule.one;
  if (quantity >= 2 && quantity <= 99) return rule.twoTo99;
  if (quantity >= 100) return rule.hundredUp;

  return 0;
}

// ✅ POST /api/orders - Create draft order with custom validation and pricing
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    console.log("Incoming order data:", data);

    // --- Step 1: Custom Validation Checks ---

    if (!data.mailDate) {
      return res.status(400).json({ error: "Mail date is required." });
    }

    if (!data.returnAddress) {
      return res.status(400).json({ error: "Return address is required." });
    } else {
      const ra = data.returnAddress;
      if (!ra.firstName || !ra.lastName)
        return res.status(400).json({ error: "Return address must include first and last name." });
      if (!ra.address1 || !ra.city || !ra.state || !ra.zipCode)
        return res.status(400).json({ error: "Return address must include full address details (address1, city, state, zipCode)." });
    }

    if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
      return res.status(400).json({ error: "At least one recipient is required." });
    }
    const recipientCount = data.recipients.length;

    // Validate recipients one by one
    for (const [index, r] of data.recipients.entries()) {
      if (!r.firstName || !r.lastName)
        return res.status(400).json({ error: `Recipient ${index + 1}: First name and last name are required.` });
      if (!r.address1 || !r.city || !r.state || !r.zipCode)
        return res.status(400).json({ error: `Recipient ${index + 1}: Address1, City, State, and Zip Code are required.` });
    }

    // Design validation (either custom or from library)
    if (!data.isCustomDesign && !data.front) {
      if (!data.designId && !data.designName) {
        return res.status(400).json({ error: "Design ID or name is required for non-custom designs." });
      }
    } else {
      if (!data.designSize) {
        return res.status(400).json({ error: "Design size is required for custom designs." });
      }
    }

    // --- Step 2: Calculate Pricing ---
    const designSize = data.designSize;
    const mailClass = data.mailClass;

    if (!designSize || !mailClass) {
      // Should have been caught by frontend/design validation, but for safety:
      return res.status(400).json({ error: "Design size and mail class are required for pricing calculation." });
    }

    // Determine product type (default to postcard when not provided)
    const productType = data.productType || "postcard";

    // Fetch pricing rules from DB
    let pricePerPiece = 0;
    try {
      const priceDoc = await Price.findOne();
      const rules = (priceDoc && priceDoc.pricingByType && priceDoc.pricingByType[productType]) || [];
      pricePerPiece = calculatePricePerPieceFromRules(rules, designSize, mailClass, recipientCount);
    } catch (priceErr) {
      console.error("Error fetching pricing from DB:", priceErr);
      pricePerPiece = 0;
    }
    const totalPrice = Number((pricePerPiece * recipientCount).toFixed(2));

    if (totalPrice === 0 && recipientCount > 0) {
      console.warn(`Pricing rule not found for Size: ${designSize}, Class: ${mailClass}. Setting total to 0.`);
    }

    // --- Step 3: Proceed to save ---
    const orderData = {
      ...data,
      status: "draft",
      pricePerPiece: pricePerPiece,
      totalPrice: totalPrice
    };

    const order = new Order(orderData);
    await order.save();

    res.status(201).json(order);

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/config - Update order configuration
router.put("/:id/config", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error updating order config:", error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/:id/recipients - Add recipients
router.post("/:id/recipients", async (req, res) => {
  try {
    const { recipients } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: "Order not found" });

    order.recipients = [...(order.recipients || []), ...recipients];
    order.updatedAt = new Date();

    await order.save();
    res.json(order);
  } catch (error) {
    console.error("Error adding recipients:", error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/:id/submit - Submit order
router.post("/:id/submit", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "pending_admin_approval", updatedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    const template = await Tempalate.findOneAndUpdate({ pcmDesignId: order.designId, isCustomDesign: true },
      {
        previewUrl: order.frontproof,
        isPublic: false
      },
      {
        new: true
      })


    res.json(order);
  } catch (error) {
    console.error("Error submitting order:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/orders - Get all orders (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id - Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/approve - Approve order and send to PostcardMania
router.post("/:id/approve", adminAuth, async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status !== "pending_admin_approval") {
      return res.status(400).json({ error: "Order is not pending approval" });
    }

    let pcmResponse;
    if (order.productType === "postcard") {
      try {
        const pcmOrderData = postcardManiaService.formatOrderForPCMpostcard(order);
        pcmResponse = await postcardManiaService.createOrderpostcard(pcmOrderData);
      } catch (pcmError) {
        console.error("Error sending order to PostcardMania:", pcmError);
        return res.status(500).json({ error: "Failed to submit order to PostcardMania" });
      }

      try {
        order.status = "submitted_to_pcm";
        order.pcmOrderId = pcmResponse.id;
        order.pcmResponse = pcmResponse;
        order.updatedAt = new Date();
        await order.save();
      } catch (saveError) {
        console.error("Error updating order after PCM submission:", saveError);
        return res.status(500).json({ error: "Failed to update order status after PCM submission" });
      }
    }
    else if (order.productType === "letter") {
      try {
        const pcmOrderData = postcardManiaService.formatOrderForPCMletter(order);
        pcmResponse = await postcardManiaService.createOrderletter(pcmOrderData);
      } catch (pcmError) {
        console.error("Error sending letter order to PostcardMania:", pcmError);
        return res.status(500).json({ error: "Failed to submit letter order to PostcardMania" });
      }
      try {
        order.status = "submitted_to_pcm";
        order.pcmOrderId = pcmResponse.id;
        order.pcmResponse = pcmResponse;
        order.updatedAt = new Date();
        await order.save();
      } catch (saveError) {
        console.error("Error updating order after PCM submission:", saveError);
        return res.status(500).json({ error: "Failed to update order status after PCM submission" });
      }
    }

    else {
      return res.status(400).json({ error: "Unsupported product type for approval" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/:id/reject - Reject order
router.post("/:id/reject", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", updatedAt: new Date() },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error rejecting order:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

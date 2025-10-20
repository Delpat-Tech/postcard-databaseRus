const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Tempalate = require("../models/Template");
const { adminAuth } = require("../middleware/auth");
const postcardManiaService = require("../services/postcard");

// --- Pricing Definitions (Moved from Frontend) ---

// Note: Removed sizeLabel as it's not needed for backend calculation, 
// and adjusted the structure for plain JavaScript.
const pricingTable = [
  { sizeKey: "46", mailClass: "FirstClass", one: 1.99, twoTo99: 0.99, hundredUp: 0.89 },
  { sizeKey: "68", mailClass: "Standard", one: 2.15, twoTo99: 1.14, hundredUp: 1.04 },
  { sizeKey: "68", mailClass: "FirstClass", one: 2.35, twoTo99: 1.24, hundredUp: 1.10 },
  { sizeKey: "611", mailClass: "Standard", one: 2.55, twoTo99: 1.41, hundredUp: 1.31 },
  { sizeKey: "611", mailClass: "FirstClass", one: 2.75, twoTo99: 1.51, hundredUp: 1.41 },
  { sizeKey: "811", mailClass: "Standard", one: 2.95, twoTo99: 1.57, hundredUp: 1.47 },
  { sizeKey: "811", mailClass: "FirstClass", one: 3.25, twoTo99: 1.77, hundredUp: 1.67 },
];

/**
 * Calculates the price per piece based on size, mail class, and quantity.
 * @param {string} size - The design size key (e.g., "46").
 * @param {('FirstClass'|'Standard')} mailClass - The mailing class.
 * @param {number} quantity - The number of recipients/pieces.
 * @returns {number} The price per piece.
 */
function calculatePricePerPiece(size, mailClass, quantity) {
  // Find the matching pricing rule
  const rule = pricingTable.find(r => r.sizeKey === size && r.mailClass === mailClass);
  if (!rule) return 0;

  // Determine the price tier
  if (quantity === 1) return rule.one;
  if (quantity >= 2 && quantity <= 99) return rule.twoTo99;
  if (quantity >= 100) return rule.hundredUp;

  return 0; // Default case
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

    const pricePerPiece = calculatePricePerPiece(designSize, mailClass, recipientCount);
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

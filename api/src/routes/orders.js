const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Tempalate = require("../models/Template");
const { adminAuth } = require("../middleware/auth");
const postcardManiaService = require("../services/postcard");

// ✅ POST /api/orders - Create draft order with custom validation
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    // 🧩 Step 1: Custom validation checks
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

    // Validate recipients one by one
    for (const [index, r] of data.recipients.entries()) {
      if (!r.firstName || !r.lastName)
        return res.status(400).json({ error: `Recipient ${index + 1}: First name and last name are required.` });
      if (!r.address1 || !r.city || !r.state || !r.zipCode)
        return res.status(400).json({ error: `Recipient ${index + 1}: Address1, City, State, and Zip Code are required.` });
    }

    // Design validation (either custom or from library)
    if (!data.isCustomDesign) {
      if (!data.designId && !data.designName) {
        return res.status(400).json({ error: "Design ID or name is required for non-custom designs." });
      }
    } else {
      if (!data.designSize) {
        return res.status(400).json({ error: "Design size is required for custom designs." });
      }
    }

    // 🧾 Step 2: Proceed to save
    const orderData = { ...data, status: "draft" };

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
    const template = await Tempalate.findOneAndUpdate({ pcmDesignId: order.designId },
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
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status !== "pending_admin_approval") {
      return res.status(400).json({ error: "Order is not pending approval" });
    }

    let pcmResponse;
    try {
      const pcmOrderData = postcardManiaService.formatOrderForPCM(order);
      pcmResponse = await postcardManiaService.createOrder(pcmOrderData);
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

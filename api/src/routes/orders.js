const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { adminAuth } = require("../middleware/auth");
const postcardManiaService = require("../services/postcardManiaService");

// POST /api/orders - Create draft order
router.post("/", async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      status: "draft",
    };
    const order = new Order(orderData);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/:id/recipients - Add recipients to order
router.post("/:id/recipients", async (req, res) => {
  try {
    const { recipients } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.recipients = [...(order.recipients || []), ...recipients];
    order.updatedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/:id/submit - Submit order for admin approval
router.post("/:id/submit", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: "pending_admin_approval",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/orders - Get all orders (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id - Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/:id/approve - Approve order and send to PostcardMania (admin only)
router.post("/:id/approve", adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "pending_admin_approval") {
      return res.status(400).json({ error: "Order is not pending approval" });
    }

    // Format order data for PostcardMania
    const pcmOrderData = postcardManiaService.formatOrderForPCM(order);

    // Send to PostcardMania
    const pcmResponse = await postcardManiaService.createOrder(pcmOrderData);

    // Update order status
    order.status = "submitted_to_pcm";
    order.pcmOrderId = pcmResponse.id;
    order.pcmResponse = pcmResponse;
    order.updatedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/orders/:id/reject - Reject order (admin only)
router.post("/:id/reject", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const Order = require("../models/Order");
const Template = require("../models/Template");
const postcardManiaService = require("../services/postcardManiaService");

// GET /api/admin/designs/import - Import latest designs from PostcardMania
router.get("/designs/import", adminAuth, async (req, res) => {
  try {
    const pcmDesigns = await postcardManiaService.getAllDesigns();

    // Process and save designs to local database
    const importedDesigns = [];
    for (const design of pcmDesigns) {
      const templateData = postcardManiaService.formatDesignForLocal(design);

      // Check if design already exists
      const existingTemplate = await Template.findOne({
        pcmDesignId: templateData.pcmDesignId,
      });

      if (!existingTemplate) {
        const template = new Template(templateData);
        await template.save();
        importedDesigns.push(template);
      } else {
        // Update existing template
        existingTemplate.name = templateData.name;
        existingTemplate.size = templateData.size;
        existingTemplate.previewUrl = templateData.previewUrl;
        existingTemplate.updatedAt = new Date();
        await existingTemplate.save();
        importedDesigns.push(existingTemplate);
      }
    }

    res.json({
      message: `Imported ${importedDesigns.length} designs from PostcardMania`,
      designs: importedDesigns,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders - List all orders (admin only)
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders/:id - Get specific order (admin only)
router.get("/orders/:id", adminAuth, async (req, res) => {
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

// POST /api/admin/orders/:id/approve - Approve order and send to PostcardMania
router.post("/orders/:id/approve", adminAuth, async (req, res) => {
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

    res.json({
      message: "Order approved and sent to PostcardMania",
      order,
      pcmResponse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/orders/:id/reject - Reject order
router.post("/orders/:id/reject", adminAuth, async (req, res) => {
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

    res.json({ message: "Order rejected", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

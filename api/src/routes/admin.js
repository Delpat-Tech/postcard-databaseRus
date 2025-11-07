const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const Order = require("../models/Order");
const Template = require("../models/Template");
const Price = require("../models/Price");
const postcardManiaService = require("../services/postcard");

// GET /api/admin/designs/import - Import latest designs from PostcardMania
router.get("/designs/import", adminAuth, async (req, res) => {
  try {
    const pcmDesignspostcard = (
      await postcardManiaService.getAllDesigns("postcard")
    ).results;
    const pcmDesignsletter = (
      await postcardManiaService.getAllDesigns("letter")
    ).results;
    const pcmDesigns = pcmDesignspostcard.concat(pcmDesignsletter);
    console.log(`Fetched ${pcmDesigns.length} designs from PostcardMania`);
    console.log(pcmDesigns[0]);

    const importedDesigns = [];

    for (const design of pcmDesigns) {
      const templateData = postcardManiaService.formatDesignForLocal(design);
      // console.log("Formatted design:", templateData);

      if (!templateData.pcmDesignId) {
        console.warn("Skipping design without pcmDesignId:", design);
        continue;
      }

      const existingTemplate = await Template.findOne({
        pcmDesignId: templateData.pcmDesignId,
      });

      if (!existingTemplate) {
        const template = new Template(templateData);
        await template.save();
        importedDesigns.push(template);
      } else {
        // update existing
        existingTemplate.name = templateData.name;
        existingTemplate.size = templateData.size;
        existingTemplate.previewUrl =
          templateData.previewUrl || existingTemplate.previewUrl;
        existingTemplate.rawData =
          templateData.rawData || existingTemplate.rawData;
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
    console.error(error);
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

// POST /api/admin/templates/:id/soft-delete - soft-delete template (hide from listings)
router.post("/templates/:id/soft-delete", adminAuth, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { deleted: true, isPublic: false, updatedAt: new Date() },
      { new: true }
    );
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json({ message: "Template soft-deleted", template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/templates/:id/delete-external - permanently delete template from PostcardMania and DB
router.post("/templates/:id/delete-external", adminAuth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const designId = template.pcmDesignId;
    if (!designId)
      return res
        .status(400)
        .json({ error: "Template has no PostcardMania design id" });

    // Check if any orders reference this template
    const ordersUsingTemplate = await Order.find({ templateId: req.params.id });

    if (ordersUsingTemplate.length > 0) {
      // Soft delete only (hide from public, keep in DB for existing orders)
      const softDeletedTemplate = await Template.findByIdAndUpdate(
        req.params.id,
        { deleted: true, isPublic: false, updatedAt: new Date() },
        { new: true }
      );
      return res.json({
        message: `Template soft-deleted (hidden from public). ${ordersUsingTemplate.length} existing order(s) still reference this template.`,
        template: softDeletedTemplate,
        ordersCount: ordersUsingTemplate.length,
      });
    }

    // No orders reference it - safe to hard delete
    // Attempt to delete on PostcardMania
    await postcardManiaService.deleteDesign(designId);

    // Remove local DB record permanently
    await Template.findByIdAndDelete(req.params.id);

    res.json({
      message: "Template permanently deleted from PostcardMania and database",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/prices?type=postcard - get current pricing rules for a type
router.get("/prices", adminAuth, async (req, res) => {
  try {
    const type = String(req.query.type || "postcard");
    const p = await Price.findOne();
    if (!p) return res.json({ pricing: [] });
    const mapType = type === "bookmark" ? "bookmark" : type;
    const pricing = (p.pricingByType && p.pricingByType[mapType]) || [];
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/prices?type=postcard - replace pricing rules for a type
router.put("/prices", adminAuth, async (req, res) => {
  try {
    const type = String(req.query.type || "postcard");
    const rules = req.body.pricing || [];
    if (!Array.isArray(rules))
      return res.status(400).json({ error: "pricing must be an array" });

    const key = type === "bookmark" ? "bookmark" : type;
    const updateObj = { updatedAt: new Date() };
    updateObj[`pricingByType.${key}`] = rules;

    const p = await Price.findOneAndUpdate(
      {},
      { $set: updateObj },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(p);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

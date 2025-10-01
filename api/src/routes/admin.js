const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const Order = require("../models/Order");
const { sendToPrinter } = require("../services/printerService");

// list pending orders
router.get("/orders", adminAuth, async (req, res) => {
  const q = await Order.find({ "admin.status": "pending" }).sort({
    createdAt: -1,
  });
  res.json(q);
});

// get order
router.get("/orders/:id", adminAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

// approve and send to printer
router.post("/orders/:id/approve", adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Not found" });

    // call printer API
    const result = await sendToPrinter(order, req.user);
    order.admin.status = "approved";
    order.admin.approvedBy = req.user.username;
    order.admin.approvedAt = new Date();
    order.admin.printerJobId = result.jobId || null;
    order.admin.printerResponse = result;
    await order.save();

    res.json({ ok: true, printer: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Printer error" });
  }
});

module.exports = router;

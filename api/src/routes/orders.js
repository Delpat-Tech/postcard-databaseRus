const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const {
  generateProofForOrder,
  createPaypalOrder,
  capturePaypalOrder,
} = require("../services/orderService");

// create order (before payment)
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    // generate proof (async) - we generate server-side canonical proof for uploaded PDFs
    const proofs = await generateProofForOrder(order);
    if (proofs) {
      order.proof = proofs;
      await order.save();
    }

    // create PayPal order (server-side)
    const paypal = await createPaypalOrder(order);

    res.json({ orderId: order._id, paypalOrder: paypal, proof: order.proof });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PayPal webhook: mark order paid (simple endpoint; you should validate via SDK/webhook verification in prod)
router.post("/:id/paypal-complete", async (req, res) => {
  const id = req.params.id;
  const { paypalOrderId } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // capture & verify via PayPal SDK
    const capture = await capturePaypalOrder(paypalOrderId);
    if (!capture || !capture.id)
      return res.status(400).json({ error: "Failed to capture" });

    order.payment.paypalOrderId = paypalOrderId;
    order.payment.status = "paid";
    order.payment.paidAt = new Date();
    await order.save();
    res.json({ ok: true, orderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// get order
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

module.exports = router;

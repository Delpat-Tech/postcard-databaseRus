// paypalRoutes.js

const express = require("express");
const axios = require("axios");
const Order = require("../models/Order.js");

const router = express.Router();

/* ================================
   1️⃣ Create PayPal Order Route
   ================================ */
router.post("/create-order", async (req, res) => {
  console.log("📝 [CREATE-ORDER] Incoming request:", req.body);

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    console.log(`📝 [CREATE-ORDER] Found Order in DB: $${order.totalPrice}`);

    // 1️⃣ Get OAuth Access Token
    const token = await getPayPalAccessToken();

    // 2️⃣ Create PayPal Order
    const response = await axios.post(
      `${getPayPalUrl()}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order._id.toString(),
            amount: {
              currency_code: "USD",
              value: order.totalPrice.toFixed(2),
            },
          },
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paypalOrderId = response.data.id;
    console.log(`✅ [CREATE-ORDER] PayPal order created: ${paypalOrderId}`);
    res.json({ id: paypalOrderId });
  } catch (err) {
    console.error(" [CREATE-ORDER] Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

/* ================================
   2️⃣ PayPal Webhook Route
   ================================ */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let parsedBody;
    if (Buffer.isBuffer(req.body)) {
      parsedBody = JSON.parse(req.body.toString("utf-8"));
    } else {
      parsedBody = req.body;
    }

    console.log("🔔 [WEBHOOK] Event received:", parsedBody.event_type);

    const {
      "paypal-transmission-id": transmissionId,
      "paypal-transmission-sig": transmissionSig,
      "paypal-transmission-time": transmissionTime,
      "paypal-cert-url": certUrl,
      "paypal-auth-algo": authAlgo,
    } = req.headers;

    try {
      // 1️⃣ Get OAuth Access Token
      const token = await getPayPalAccessToken();

      // 2️⃣ Verify the PayPal webhook signature
      const verifyResponse = await axios.post(
        `${getPayPalUrl()}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: parsedBody,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (verifyResponse.data.verification_status !== "SUCCESS") {
        console.error(" [WEBHOOK] Invalid signature:", verifyResponse.data);
        return res.status(400).send("Invalid webhook signature");
      }

      console.log("✅ [WEBHOOK] Valid webhook signature");

      // ✅ Valid Signature: Process Event
      const { event_type: eventType, resource } = parsedBody;

      if (eventType === "CHECKOUT.ORDER.APPROVED") {
        const paypalOrderId = resource.id;

        if (!paypalOrderId) {
          console.error(" [WEBHOOK] PayPal order ID not found in resource");
          return res.status(400).send("Missing PayPal order ID");
        }

        console.log(`✅ [WEBHOOK] Payment completed for order: ${paypalOrderId}`);

        const updatedOrder = await Order.findOneAndUpdate(
          { paypalorderid: paypalOrderId, status: "pending_payment_verification" },
          {
            status: "pending_admin_approval",
            paypalData: resource,
          },
          { new: true }
        );

        if (updatedOrder) {
          console.log("✅ [WEBHOOK] Updated DB Order:", updatedOrder._id);
        } else {
          console.error(" [WEBHOOK] Order not found in DB:", paypalOrderId);
        }
      } else {
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${eventType}`);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error(" [WEBHOOK] Error:", err.message || err);
      res.status(500).send("Internal Server Error");
    }
  }
);

/* ================================
   🔑 Helper Functions
   ================================ */

// Get PayPal API base URL
function getPayPalUrl() {
  return process.env.NODE_ENV === "prod"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

// Get OAuth2 token from PayPal
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    `${getPayPalUrl()}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

module.exports = router;

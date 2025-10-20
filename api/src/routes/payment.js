const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const Order = require("../models/Order.js");

const router = express.Router();

// ✅ PayPal SDK client
const Environment = paypal.core.SandboxEnvironment; // or LiveEnvironment
const client = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

// =====================================================
// 1️⃣ Create order (frontend calls this to get PayPal order ID)
// =====================================================
router.post("/create-order", async (req, res) => {
  console.log("📝 [CREATE-ORDER] Incoming request");
  console.log(
    "📝 [CREATE-ORDER] Request body:",
    JSON.stringify(req.body, null, 2)
  );

  const { orderId } = req.body;

  if (!orderId) {
    console.error("❌ [CREATE-ORDER] orderId is missing from request");
    return res.status(400).json({ error: "orderId is required" });
  }

  console.log(`📝 [CREATE-ORDER] Fetching order: ${orderId}`);

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      console.error(`❌ [CREATE-ORDER] Order not found: ${orderId}`);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(
      `📝 [CREATE-ORDER] Order found:`,
      JSON.stringify(order, null, 2)
    );
    console.log(`📝 [CREATE-ORDER] Order total price: $${order.totalPrice}`);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE", // So PayPal auto-captures funds on approval
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
    });

    console.log("📝 [CREATE-ORDER] Creating PayPal order...");
    const paypalOrder = await client.execute(request);

    const paypalOrderId = paypalOrder.result.id;
    console.log(
      `✅ [CREATE-ORDER] PayPal order created successfully: ${paypalOrderId}`
    );
    console.log(
      `✅ [CREATE-ORDER] PayPal order status: ${paypalOrder.result.status}`
    );

    res.json({ id: paypalOrderId });
  } catch (err) {
    console.error("❌ [CREATE-ORDER] Error creating PayPal order:", err);
    console.error("❌ [CREATE-ORDER] Error details:", {
      message: err.message,
      statusCode: err.statusCode,
      name: err.name,
    });
    res
      .status(500)
      .json({ error: "Failed to create PayPal order", details: err.message });
  }
});

// =====================================================
// 2️⃣ Webhook (PayPal calls this automatically)
// =====================================================
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔔 [WEBHOOK] Incoming webhook request");
    console.log("🔔 [WEBHOOK] URL:", req.url);
    console.log("🔔 [WEBHOOK] Method:", req.method);

    // Log all headers
    console.log("🔔 [WEBHOOK] Headers:", {
      "Paypal-Transmission-Id": req.header("Paypal-Transmission-Id"),
      "Paypal-Transmission-Sig": req.header("Paypal-Transmission-Sig"),
      "Paypal-Transmission-Time": req.header("Paypal-Transmission-Time"),
      "Paypal-Cert-Url": req.header("Paypal-Cert-Url"),
      "Paypal-Auth-Algo": req.header("Paypal-Auth-Algo"),
      "content-type": req.header("content-type"),
    });

    const body = req.body;
    console.log("🔔 [WEBHOOK] Raw body type:", typeof body);
    console.log("🔔 [WEBHOOK] Raw body length:", body?.length);

    // Convert body to string if it's a buffer
    let parsedBody;
    if (Buffer.isBuffer(body)) {
      console.log("🔔 [WEBHOOK] Body is a Buffer, converting to string");
      const bodyString = body.toString("utf-8");
      console.log("🔔 [WEBHOOK] Body string:", bodyString);
      parsedBody = JSON.parse(bodyString);
    } else {
      parsedBody = body;
    }

    console.log(
      "🔔 [WEBHOOK] Parsed body:",
      JSON.stringify(parsedBody, null, 2)
    );

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    console.log(
      "🔔 [WEBHOOK] Webhook ID from env:",
      webhookId ? "✅ Set" : "❌ NOT SET"
    );

    const transmissionId = req.header("Paypal-Transmission-Id");
    const transmissionSig = req.header("Paypal-Transmission-Sig");
    const transmissionTime = req.header("Paypal-Transmission-Time");
    const certUrl = req.header("Paypal-Cert-Url");
    const authAlgo = req.header("Paypal-Auth-Algo");

    console.log("🔔 [WEBHOOK] Verification headers present:", {
      transmissionId: !!transmissionId,
      transmissionSig: !!transmissionSig,
      transmissionTime: !!transmissionTime,
      certUrl: !!certUrl,
      authAlgo: !!authAlgo,
    });

    try {
      console.log("🔔 [WEBHOOK] Starting webhook verification...");

      // Verify webhook authenticity
      const verifyRequest =
        new paypal.notifications.VerifyWebhookSignatureRequest();
      verifyRequest.requestBody({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: parsedBody,
      });

      console.log("🔔 [WEBHOOK] Executing verification request...");
      const verifyResponse = await client.execute(verifyRequest);

      console.log(
        "🔔 [WEBHOOK] Verification response:",
        JSON.stringify(verifyResponse.result, null, 2)
      );

      if (verifyResponse.result.verification_status !== "SUCCESS") {
        console.warn(
          "⚠️ [WEBHOOK] Invalid webhook signature - Status:",
          verifyResponse.result.verification_status
        );
        return res.status(400).send("Invalid signature");
      }

      console.log("✅ [WEBHOOK] Signature verification successful");

      // Process the event
      const eventType = parsedBody.event_type;
      const resource = parsedBody.resource;

      console.log("✅ [WEBHOOK] Event type:", eventType);
      console.log("✅ [WEBHOOK] Resource:", JSON.stringify(resource, null, 2));

      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        console.log("✅ [WEBHOOK] Processing PAYMENT.CAPTURE.COMPLETED event");

        console.log(
          "✅ [WEBHOOK] Supplementary data:",
          JSON.stringify(resource.supplementary_data, null, 2)
        );

        const paypalOrderId =
          resource.supplementary_data?.related_ids?.order_id;

        if (!paypalOrderId) {
          console.error(
            "❌ [WEBHOOK] PayPal order ID not found in webhook data"
          );
          console.error(
            "❌ [WEBHOOK] Full resource:",
            JSON.stringify(resource, null, 2)
          );
          return res.status(400).send("Missing PayPal order ID in webhook");
        }

        console.log("✅ [WEBHOOK] Found PayPal order ID:", paypalOrderId);

        // Update your order in MongoDB
        console.log(
          `📝 [WEBHOOK] Updating order ${paypalOrderId} in database...`
        );

        const updateResult = await Order.findOneAndUpdate(
          { _id: paypalOrderId },
          {
            status: "pending_admin_approval",
            paypalCaptureId: resource.id,
            paypalData: resource,
          },
          { new: true }
        );

        if (updateResult) {
          console.log(
            `✅ [WEBHOOK] Order ${paypalOrderId} successfully updated`
          );
          console.log(
            `✅ [WEBHOOK] Updated order:`,
            JSON.stringify(updateResult, null, 2)
          );
        } else {
          console.error(
            `❌ [WEBHOOK] Order ${paypalOrderId} not found in database`
          );
        }
      } else {
        console.log(
          `📝 [WEBHOOK] Event type '${eventType}' not handled (only PAYMENT.CAPTURE.COMPLETED is processed)`
        );
      }

      console.log("✅ [WEBHOOK] Sending 200 OK response");
      res.sendStatus(200);
    } catch (error) {
      console.error("❌ [WEBHOOK] Processing error:", error);
      console.error("❌ [WEBHOOK] Error stack:", error.stack);
      console.error("❌ [WEBHOOK] Error details:", {
        message: error.message,
        name: error.name,
        code: error.code,
      });
      res.status(500).send("Internal Server Error");
    }
  }
);

module.exports = router;

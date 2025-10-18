const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const Order = require("../models/Order.js");

const router = express.Router();

// ✅ PayPal SDK client
const Environment = paypal.core.SandboxEnvironment; // or LiveEnvironment
const client = new paypal.core.PayPalHttpClient(
    new Environment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
);

// ===================================================== 
// 1️⃣ Create order (frontend calls this to get PayPal order ID)
// =====================================================
router.post("/create-order", async (req, res) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

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

    try {
        const paypalOrder = await client.execute(request);
        res.json({ id: paypalOrder.result.id });
    } catch (err) {
        console.error("Error creating PayPal order:", err);
        res.status(500).send("Failed to create PayPal order");
    }
});

// =====================================================
// 2️⃣ Webhook (PayPal calls this automatically)
// =====================================================
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const body = req.body;
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    const transmissionId = req.header("Paypal-Transmission-Id");
    const transmissionSig = req.header("Paypal-Transmission-Sig");
    const transmissionTime = req.header("Paypal-Transmission-Time");
    const certUrl = req.header("Paypal-Cert-Url");
    const authAlgo = req.header("Paypal-Auth-Algo");

    try {
        // Verify webhook authenticity
        const verifyRequest = new paypal.notifications.VerifyWebhookSignatureRequest();
        verifyRequest.requestBody({
            auth_algo: authAlgo,
            cert_url: certUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSig,
            transmission_time: transmissionTime,
            webhook_id: webhookId,
            webhook_event: body,
        });

        const verifyResponse = await client.execute(verifyRequest);
        if (verifyResponse.result.verification_status !== "SUCCESS") {
            console.warn("⚠️ Invalid webhook signature");
            return res.status(400).send("Invalid signature");
        }

        // Process the event
        const eventType = body.event_type;
        const resource = body.resource;

        console.log("✅ Webhook received:", eventType);

        if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
            const paypalOrderId = resource.supplementary_data.related_ids.order_id;

            // Update your order in MongoDB
            await Order.findOneAndUpdate(
                { _id: paypalOrderId },
                {
                    status: "pending_admin_approval",
                    paypalCaptureId: resource.id,
                    paypalData: resource,
                }
            );

            console.log(`✅ Order ${paypalOrderId} marked as pending_admin_approval`);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Webhook processing error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;


const fetch = require("node-fetch");
const puppeteer = require("puppeteer");
const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: process.env.PAYPAL_MODE || "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Generate canonical proof images for an order. For uploaded PDFs, render first page to PNG.
async function generateProofForOrder(order) {
  try {
    if (order.design && order.design.pdfUrl) {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      // open the PDF directly in chromium - Puppeteer will not natively render PDFs to PNG without extra handling,
      // so we will load a lightweight HTML wrapper that embeds the PDF in an <embed> or use pdf2png in production.

      // Simple approach: navigate to the PDF URL and screenshot the page.
      await page.goto(order.design.pdfUrl, { waitUntil: "networkidle2" });
      const screenshot = await page.screenshot({ fullPage: true });
      await browser.close();

      // upload screenshot to S3 or store as data URL
      // For Phase 1: return data: URL
      const base64 = screenshot.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;
      return { frontProofUrl: dataUrl, backProofUrl: null };
    }
    return null;
  } catch (err) {
    console.error("proof generation failed", err);
    return null;
  }
}

async function createPaypalOrder(order) {
  // create a PayPal order object
  const create_payment_json = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: ((order.product.priceCents || 0) / 100).toFixed(2),
        },
        description: `${order.product.quantity} x ${order.product.type} ${order.product.size}`,
      },
    ],
    application_context: {
      return_url: `${process.env.FRONTEND_URL}/checkout/success?orderId=${order._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order._id}`,
    },
  };
  return new Promise((resolve, reject) => {
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) return reject(error);
      resolve(payment);
    });
  });
}

async function capturePaypalOrder(paypalOrderId) {
  // This code uses PayPal REST SDK's execute capture flow for payments created with payment.create
  return new Promise((resolve, reject) => {
    paypal.payment.execute(paypalOrderId, {}, function (error, payment) {
      if (error) return reject(error);
      resolve(payment);
    });
  });
}

module.exports = {
  generateProofForOrder,
  createPaypalOrder,
  capturePaypalOrder,
};

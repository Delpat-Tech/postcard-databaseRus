const fetch = require("node-fetch");
const puppeteer = require("puppeteer");
const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: process.env.PAYPAL_MODE || "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});


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

module.exports = {
  generateProofForOrder,
  createPaypalOrder,
  capturePaypalOrder,
};

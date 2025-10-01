const fetch = require("node-fetch");

async function sendToPrinter(order, adminUser) {
  // Placeholder implementation for PostcardMania. You MUST replace with their API spec & fields.
  const apiKey = process.env.POSTCARDMANIA_API_KEY;
  const url =
    process.env.POSTCARDMANIA_API_URL || "https://api.postcardmania.com/v1";

  // Build payload - this is an illustrative example only.
  const payload = {
    apiKey,
    productType: order.product.type,
    size: order.product.size,
    quantity: order.product.quantity,
    design: {
      pdfUrl: order.design.pdfUrl,
      frontUrl: order.design.frontUrl,
      backUrl: order.design.backUrl,
    },
    mailingListUrl: order.mailing.csvUrl,
    referenceId: order._id.toString(),
  };

  // In production: call the real endpoint and handle authentication headers
  // return { jobId: 'demo-job-123', raw: payload };

  const resp = await fetch(`${url}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .catch((e) => ({ error: String(e) }));

  // Standardize return
  return { jobId: resp.jobId || resp.id || null, raw: resp };
}

module.exports = { sendToPrinter };

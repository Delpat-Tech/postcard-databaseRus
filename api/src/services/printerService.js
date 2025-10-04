const pcm = require("./postcardManiaService");

async function sendToPrinter(order, adminUser) {
  // format order for PostcardMania API
  const payload = pcm.formatOrderForPCM(order);

  try {
    const resp = await pcm.createOrder(payload);
    return { jobId: resp.jobId || resp.id || null, raw: resp };
  } catch (err) {
    return { jobId: null, error: err.message || String(err), raw: err };
  }
}

module.exports = { sendToPrinter };

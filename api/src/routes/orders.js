const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// ✅ POST /api/orders - Create draft order with custom validation
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // 🧩 Step 1: Custom validation checks
    if (!data.mailDate) {
      return res.status(400).json({ error: "Mail date is required." });
    }

    if (!data.returnAddress) {
      return res.status(400).json({ error: "Return address is required." });
    } else {
      const ra = data.returnAddress;
      if (!ra.firstName || !ra.lastName)
        return res.status(400).json({ error: "Return address must include first and last name." });
      if (!ra.address1 || !ra.city || !ra.state || !ra.zipCode)
        return res.status(400).json({ error: "Return address must include full address details (address1, city, state, zipCode)." });
    }

    if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
      return res.status(400).json({ error: "At least one recipient is required." });
    }

    // Validate recipients one by one
    for (const [index, r] of data.recipients.entries()) {
      if (!r.firstName || !r.lastName)
        return res.status(400).json({ error: `Recipient ${index + 1}: First name and last name are required.` });
      if (!r.address1 || !r.city || !r.state || !r.zipCode)
        return res.status(400).json({ error: `Recipient ${index + 1}: Address1, City, State, and Zip Code are required.` });
    }

    // Design validation (either custom or from library)
    if (!data.isCustomDesign) {
      if (!data.designId && !data.designName) {
        return res.status(400).json({ error: "Design ID or name is required for non-custom designs." });
      }
    } else {
      if (!data.designSize) {
        return res.status(400).json({ error: "Design size is required for custom designs." });
      }
    }

    // 🧾 Step 2: Proceed to save
    const orderData = { ...data, status: "draft" };

    const order = new Order(orderData);
    await order.save();

    res.status(201).json(order);

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

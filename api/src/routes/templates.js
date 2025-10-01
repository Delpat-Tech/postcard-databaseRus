const express = require("express");
const router = express.Router();
const Template = require("../models/Template");
const { adminAuth } = require("../middleware/auth");

// public list
router.get("/", async (req, res) => {
  try {
    const list = await Template.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// admin create
router.post("/", adminAuth, async (req, res) => {
  try {
    const t = new Template(req.body);
    await t.save();
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

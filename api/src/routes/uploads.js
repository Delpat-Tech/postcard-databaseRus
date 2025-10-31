const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// store uploads in ../uploads
const uploadsPath = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || ".pdf";
        const name = crypto.randomBytes(8).toString("hex");
        cb(null, `${name}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /api/uploads/letter - accepts 'letterPdf' file field
router.post("/letter", upload.single("letterPdf"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        res.json({ url, filename: req.file.filename });
    } catch (err) {
        console.error("Upload error:", err?.message || err);
        res.status(500).json({ error: "Upload failed" });
    }
});

module.exports = router;

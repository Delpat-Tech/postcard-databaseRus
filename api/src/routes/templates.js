const express = require("express");
const router = express.Router();
const Template = require("../models/Template");
const { adminAuth } = require("../middleware/auth");
const postcardManiaService = require("../services/postcard");

// GET /api/templates/public - Get all public templates
router.get("/public", async (req, res) => {
  try {
    const templates = await Template.find({ isPublic: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/templates - Get all templates (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/templates/:id - Get template by ID
router.get("/:id", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/templates/new - Request new design from PostcardMania
router.post("/new", async (req, res) => {
  try {
    const { designData } = req.body;

    // Create new design in PostcardMania (service returns an object with at least designID and possibly url)
    const pcmResponse = await postcardManiaService.createNewDesign(designData);

    // Try to extract designID and editor URL
    const designID = pcmResponse.designID
    const editorUrl = pcmResponse?.url || (designID ? `https://portal.pcmintegrations.com/integrated/embed/editor/${designID}` : null);

    // Build a template record using available data. Keep rawData to preserve full response.
    const templateData = {
      pcmDesignId: String(designID),
      name: (designData?.name || pcmResponse?.friendlyName || pcmResponse?.name || "New Design") + ` (${new Date().toISOString().slice(0, 10)})`,
      size: designData?.size || pcmResponse?.size || "",
      previewUrl: pcmResponse?.previewUrl || pcmResponse?.preview_url || null,
      isPublic: true,
      rawData: pcmResponse,
    };

    const template = new Template(templateData);
    await template.save();

    // Return both saved template and editor url so the frontend can redirect
    res.status(201).json({ template, url: editorUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/templates/:id/edit - Open design editor via PostcardMania
router.post("/:id/edit", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const editorData = await postcardManiaService.openDesignEditor(
      template.pcmDesignId
    );
    res.json(editorData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/templates/:id/public - Toggle template visibility (admin only)
router.put("/:id/public", adminAuth, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { isPublic, updatedAt: new Date() },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/templates/:id - Delete template (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

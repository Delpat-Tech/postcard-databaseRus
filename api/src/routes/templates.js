const express = require("express");
const router = express.Router();
const Template = require("../models/Template");
const { adminAuth } = require("../middleware/auth");
const postcardManiaService = require("../services/postcard");
// GET /api/templates/public - Get all public templates
router.get("/public", async (req, res) => {
  try {
    const type = req.query.type;
    const filter = { isPublic: true, deleted: { $ne: true } };
    if (type) filter.type = String(type);
    const templates = await Template.find(filter);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public prices endpoint: GET /api/templates/prices?type=postcard
const Price = require("../models/Price");
router.get("/prices", async (req, res) => {
  try {
    const type = String(req.query.type || "postcard");
    const p = await Price.findOne();
    if (!p) return res.json({ pricing: [] });
    const mapType = type === "bookmark" ? "bookmark" : type; // stay consistent
    const pricing = (p.pricingByType && p.pricingByType[mapType]) || [];
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
function validateProofBody(req, res, next) {

  const { templateId, front, back, size, recipient } = req.body;

  // Check mandatory fields
  if (!size) {
    return res.status(400).json({ error: "Field 'size' is required" });
  }

  if (!recipient) {
    return res.status(400).json({ error: "Field 'recipient' is required" });
  }

  // Check either templateId OR front+back
  if (!templateId && !(front && back)) {
    return res.status(400).json({
      error: "You must provide either 'templateId' or both 'front' and 'back' for proof generation",
    });
  }

  next();
}
// POST /api/templates/proof - generate proof for template
router.post("/proof", validateProofBody, async (req, res) => {
  try {
    const { format, templateId, front, back, size, recipient } = req.body;

    const proof = await postcardManiaService.generateProof(format, templateId, front, back, size, recipient)
    res.json(proof); // { front, back }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/proofletter", async (req, res) => {
  try {
    const { letter, templateId, envelope, color, recipient } = req.body;

    // Basic validation: recipient required, and either templateId or letter must be provided
    if (!recipient) return res.status(400).json({ error: "Field 'recipient' is required" });
    if (!templateId && !letter) return res.status(400).json({ error: "You must provide either 'templateId' or 'letter' for proof generation" });

    // Normalize envelope: accept partial envelope object
    const env = envelope || {};

    // If letter is a file URL coming from uploads, allow both `fileUrl` or `url` or direct string
    let normalizedLetter = letter;
    if (letter && typeof letter === 'object') {
      // Accept { url } or { fileUrl } or { pdf_url }
      normalizedLetter = letter;
    } else if (typeof letter === 'string') {
      normalizedLetter = letter;
    }

    const proof = await postcardManiaService.generateProofletter(templateId, normalizedLetter, env, color, recipient);
    res.json(proof);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// GET /api/templates - Get all templates (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    // exclude soft-deleted templates from normal listings
    const templates = await Template.find({ deleted: { $ne: true } });
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

// POST /api/templates/:id/edit - personalise editor via PostcardMania
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

// POST /api/templates/:id/edit - Open design editor via PostcardMania
router.post("/:id/editme", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const editorData = await postcardManiaService.openDesignMeEditor(
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

// PUT /api/templates/:id/personalize - Toggle whether template can be personalized (admin only)
router.put("/:id/personalize", adminAuth, async (req, res) => {
  try {
    const { allowPersonalize } = req.body;
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { allowPersonalize: !!allowPersonalize, updatedAt: new Date() },
      { new: true }
    );

    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/templates/:id/type - Set template type (admin only)
router.put("/:id/type", adminAuth, async (req, res) => {
  try {
    const { type } = req.body;
    const allowed = ["postcard", "letter", "brochure", "bookmark"];
    if (!type || !allowed.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing type" });
    }

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { type, updatedAt: new Date() },
      { new: true }
    );

    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

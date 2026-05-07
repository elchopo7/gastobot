const express = require("express");
const { analyzeReceiptImage } = require("../ai/openai");

const router = express.Router();

const MAX_IMAGE_LENGTH = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function getDataUrlMime(imageDataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(imageDataUrl || "");
  return match ? match[1].toLowerCase() : null;
}

router.post("/analyze", async (req, res) => {
  const { imageDataUrl, hintMonth } = req.body || {};

  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    return res.status(400).json({ message: "Invalid image payload" });
  }

  if (imageDataUrl.length > MAX_IMAGE_LENGTH * 2) {
    return res.status(413).json({ message: "Image is too large" });
  }

  const mimeType = getDataUrlMime(imageDataUrl);

  if (!mimeType || !allowedMimeTypes.has(mimeType)) {
    return res.status(400).json({ message: "Unsupported image format" });
  }

  try {
    const analysis = await analyzeReceiptImage({
      imageDataUrl,
      hintMonth: typeof hintMonth === "string" ? hintMonth : "",
    });

    return res.json({
      ...analysis,
      source: "vision",
    });
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    return res.status(500).json({
      message: "Failed to analyze receipt",
      error: error?.message || "Unknown receipt analysis error",
    });
  }
});

module.exports = router;

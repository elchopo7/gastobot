require("dotenv").config();
const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askOpenAI({ summary, question }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "Eres un asistente financiero para una app de gastos. Responde solo usando el resumen proporcionado. Si faltan datos, dilo claramente y no inventes cifras.",
      input: `Resumen de gastos:\n${JSON.stringify(summary, null, 2)}\n\nPregunta del usuario: ${question}`,
    });

    return response.output_text || "";
  } catch (error) {
    const detail = error?.error?.message || error?.message || "Unknown OpenAI error";
    throw new Error(detail);
  }
}

async function analyzeReceiptImage({ imageDataUrl, hintMonth }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    throw new Error("Invalid receipt image");
  }

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    max_output_tokens: 250,
    instructions:
      "Eres un asistente de contabilidad de gastos. Extrae datos de tickets con alta precisión. Devuelve SOLO JSON válido con las claves amount, currency, merchant, date, confidence y notes. amount debe ser numérico positivo, date en formato YYYY-MM-DD si la detectas, confidence entre 0 y 1. Si no puedes detectar un campo, usa null. No inventes datos.",
    text: {
      format: {
        type: "json_schema",
        name: "receipt_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            amount: { anyOf: [{ type: "number" }, { type: "null" }] },
            currency: { anyOf: [{ type: "string" }, { type: "null" }] },
            merchant: { anyOf: [{ type: "string" }, { type: "null" }] },
            date: {
              anyOf: [
                {
                  type: "string",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                },
                { type: "null" },
              ],
            },
            confidence: { anyOf: [{ type: "number" }, { type: "null" }] },
            notes: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
          required: ["amount", "currency", "merchant", "date", "confidence", "notes"],
        },
      },
    },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Analiza este ticket y extrae el total final, el comercio y la fecha. ` +
              `Si hay varios importes, prioriza el total final / amount due / total a pagar. ` +
              `Usa como pista temporal el mes seleccionado: ${hintMonth || "unknown"}.`,
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "high",
          },
        ],
      },
    ],
  });

  const outputText = response.output_text || "";

  let parsed;
  try {
    parsed = JSON.parse(stripJsonEnvelope(outputText));
  } catch {
    throw new Error(`Receipt analysis did not return valid JSON: ${outputText.slice(0, 120)}`);
  }

  return {
    amount: Number.isFinite(Number(parsed.amount)) ? Number(parsed.amount) : null,
    currency: typeof parsed.currency === "string" ? parsed.currency : null,
    merchant: typeof parsed.merchant === "string" ? parsed.merchant : null,
    date: typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
    confidence: Number.isFinite(Number(parsed.confidence)) ? Number(parsed.confidence) : null,
    notes: typeof parsed.notes === "string" ? parsed.notes : null,
  };
}

module.exports = {
  askOpenAI,
  analyzeReceiptImage,
};

function stripJsonEnvelope(text) {
  const cleaned = String(text || "").trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

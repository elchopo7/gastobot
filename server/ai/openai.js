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

module.exports = {
  askOpenAI,
};

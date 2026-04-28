const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askOpenAI({ summary, question }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Eres un asistente financiero para una app de gastos. Responde solo usando el resumen proporcionado. Si faltan datos, dilo claramente y no inventes cifras.",
      },
      {
        role: "user",
        content: `Resumen de gastos:\n${JSON.stringify(summary, null, 2)}\n\nPregunta del usuario: ${question}`,
      },
    ],
  });

  return response.output_text || "";
}

module.exports = {
  askOpenAI,
};

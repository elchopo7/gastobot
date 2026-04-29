const { addExpense, findAllExpenses, getSummaryByMonth } = require("../server/db/expenses");
const { createTelegramBot } = require("../server/telegram/bot");

const token = process.env.TELEGRAM_BOT_TOKEN;
const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = createTelegramBot({
  token,
  addExpense,
  findAllExpenses,
  getSummaryByMonth,
});

module.exports = async (req, res) => {
  if (secretToken) {
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== secretToken) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  }

  return bot.webhookCallback("/api/telegram-webhook")(req, res);
};

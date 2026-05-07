require("dotenv").config();
const express = require("express");
const path = require("path");
const expensesRouter = require("./routes/expenses");
const aiRouter = require("./routes/ai");
const receiptsRouter = require("./routes/receipts");
const { seedDatabase } = require("./db/seed");
const { createTelegramBot } = require("./telegram/bot");
const { addExpense, findAllExpenses, getSummaryByMonth } = require("./db/expenses");

const app = express();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const telegramBot = TELEGRAM_BOT_TOKEN
  ? createTelegramBot({
      token: TELEGRAM_BOT_TOKEN,
      addExpense,
      findAllExpenses,
      getSummaryByMonth,
    })
  : null;

seedDatabase().catch((error) => {
  console.error("Failed to seed expenses:", error.message || error);
});

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  "/vendor",
  express.static(path.join(__dirname, "../node_modules/chart.js/dist"))
);
app.use("/api/expenses", expensesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/receipts", receiptsRouter);

app.post("/api/telegram-webhook", (req, res) => {
  if (!telegramBot) {
    return res.status(503).json({ ok: false, message: "Telegram bot not configured" });
  }

  if (TELEGRAM_WEBHOOK_SECRET) {
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  }

  return telegramBot.handleUpdate(req.body, res);
});

module.exports = app;

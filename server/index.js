require("dotenv").config();
const app = require("./app");
const { addExpense, findAllExpenses, getSummaryByMonth } = require("./db/expenses");
const { createTelegramBot } = require("./telegram/bot");

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ENABLE_TELEGRAM_BOT = process.env.ENABLE_TELEGRAM_BOT === "true";

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

if (TELEGRAM_BOT_TOKEN && ENABLE_TELEGRAM_BOT) {
  const bot = createTelegramBot({
    token: TELEGRAM_BOT_TOKEN,
    addExpense,
    findAllExpenses,
    getSummaryByMonth,
  });

  bot
    .launch()
    .then(() => {
      console.log("Telegram bot running");
    })
    .catch((error) => {
      console.error("Telegram bot failed to start:", error.message || error);
    });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else {
  console.log("Telegram bot disabled");
}

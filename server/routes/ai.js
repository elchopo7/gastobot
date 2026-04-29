const express = require("express");
const { findAllExpenses, getSummaryByMonth } = require("../db/expenses");
const { askOpenAI } = require("../ai/openai");

const router = express.Router();

async function buildSummary(month) {
  const expenses = await findAllExpenses();
  const monthExpenses = expenses.filter((expense) => expense.date?.startsWith(month));

  const byCategory = monthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  const categoryRows = (await getSummaryByMonth(month)).map((item) => ({
    category: item.category,
    total: Number(item.total || 0),
  }));

  return {
    month,
    total: monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    expenseCount: monthExpenses.length,
    byCategory,
    categoryRows,
  };
}

router.post("/expenses-question", async (req, res) => {
  const { month, question } = req.body || {};

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "Invalid month format" });
  }

  if (typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ message: "Question is required" });
  }

  try {
    const summary = await buildSummary(month);
    const answer = await askOpenAI({
      summary,
      question: question.trim(),
    });

    return res.json({
      month,
      summary,
      answer,
    });
  } catch (error) {
    console.error("OpenAI request failed:", error);
    return res.status(500).json({
      message: "Failed to query OpenAI",
      error: error?.message || "Unknown OpenAI error",
    });
  }
});

module.exports = router;

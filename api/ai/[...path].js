const express = require("express");
const { findAllExpenses, getSummaryByMonth } = require("../../server/db/expenses");
const { askOpenAI } = require("../../server/ai/openai");

function buildSummary(month) {
  return findAllExpenses().then((expenses) => {
    const monthExpenses = expenses.filter((expense) => expense.date?.startsWith(month));

    const byCategory = monthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    return getSummaryByMonth(month).then((categoryRows) => ({
      month,
      total: monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
      expenseCount: monthExpenses.length,
      byCategory,
      categoryRows: categoryRows.map((item) => ({
        category: item.category,
        total: Number(item.total || 0),
      })),
    }));
  });
}

module.exports = async function handler(req, res) {
  const pathSegments = Array.isArray(req.query.path) ? req.query.path : [];
  const [firstSegment] = pathSegments;

  if (req.method !== "POST" || firstSegment !== "expenses-question") {
    return res.status(404).json({ message: "Not found" });
  }

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

    return res.status(200).json({
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
};

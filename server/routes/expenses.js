const express = require("express");
const {
  findAllExpenses,
  findExpensesByMonth,
  getSummaryByMonth,
  getEvolutionByYear,
  getAllMonthlyTotals,
  getComparisonTotals,
  findExpenseById,
  addExpense,
  editExpense,
  removeExpense,
} = require("../db/expenses");

const router = express.Router();

const allowedCategories = new Set([
  "food",
  "transport",
  "entertainment",
  "housing",
  "health",
  "education",
  "shopping",
  "other",
]);

function validateExpensePayload(payload) {
  const numericAmount = Number(payload.amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    !allowedCategories.has(payload.category) ||
    typeof payload.description !== "string" ||
    payload.description.trim() === "" ||
    typeof payload.date !== "string" ||
    Number.isNaN(Date.parse(payload.date))
  ) {
    return null;
  }

  return {
    amount: numericAmount,
    category: payload.category,
    description: payload.description.trim(),
    date: payload.date,
  };
}

router.get("/", (req, res) => {
  const { month, category, search, dateFrom, dateTo, sort, compare } = req.query;

  let expenses = findAllExpenses();

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Invalid month format" });
    }

    expenses = findExpensesByMonth(month);
  }

  if (category) {
    expenses = expenses.filter((expense) => expense.category === category);
  }

  if (search) {
    const normalizedSearch = String(search).trim().toLowerCase();
    expenses = expenses.filter((expense) => {
      const haystack = `${expense.description} ${expense.category} ${expense.date}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }

  if (dateFrom) {
    expenses = expenses.filter((expense) => expense.date >= dateFrom);
  }

  if (dateTo) {
    expenses = expenses.filter((expense) => expense.date <= dateTo);
  }

  if (sort === "amount-desc") {
    expenses.sort((a, b) => b.amount - a.amount);
  }

  if (sort === "amount-asc") {
    expenses.sort((a, b) => a.amount - b.amount);
  }

  const response = { expenses };

  if (compare === "month-vs-previous" && month) {
    response.comparison = getComparisonTotals(month);
  }

  res.json(response);
});

router.get("/summary", (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ message: "Month is required" });
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "Invalid month format" });
  }

  const summary = getSummaryByMonth(month);
  const totals = summary.reduce((acc, item) => {
    acc[item.category] = Number(item.total);
    return acc;
  }, {});

  res.json({
    month,
    totals,
  });
});

router.get("/evolution", (req, res) => {
  const year = String(req.query.year || new Date().getFullYear());

  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ message: "Invalid year format" });
  }

  const evolution = getEvolutionByYear(year);
  const totalsByMonth = evolution.reduce((acc, item) => {
    acc[item.month] = Number(item.total);
    return acc;
  }, {});

  const labels = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = String(index + 1).padStart(2, "0");
    return `${year}-${monthNumber}`;
  });

  const totals = labels.map((month) => Number(totalsByMonth[month] || 0));

  res.json({
    year,
    labels,
    totals,
  });
});

router.get("/monthly", (req, res) => {
  const monthlyTotals = getAllMonthlyTotals();
  const totalsByMonth = monthlyTotals.reduce((acc, item) => {
    acc[item.month] = Number(item.total);
    return acc;
  }, {});

  const today = new Date();
  const labels = [];
  const totals = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1));
    const month = date.toISOString().slice(0, 7);

    labels.push(month);
    totals.push(Number(totalsByMonth[month] || 0));
  }

  res.json({
    labels,
    totals,
  });
});

router.get("/:id", (req, res) => {
  const expense = findExpenseById(req.params.id);

  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  res.json(expense);
});

router.post("/", (req, res) => {
  const expense = validateExpensePayload(req.body);

  if (!expense) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  const createdExpense = addExpense(expense);
  res.status(201).json(createdExpense);
});

router.put("/:id", (req, res) => {
  const expense = validateExpensePayload(req.body);

  if (!expense) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  const updatedExpense = editExpense(req.params.id, expense);

  if (!updatedExpense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  res.json(updatedExpense);
});

router.delete("/:id", (req, res) => {
  const deletedExpense = removeExpense(req.params.id);

  if (!deletedExpense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  res.json(deletedExpense);
});

module.exports = router;

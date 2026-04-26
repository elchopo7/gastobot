const express = require("express");
const {
  findAllExpenses,
  findExpensesByMonth,
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
  const { month } = req.query;

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Invalid month format" });
    }

    return res.json(findExpensesByMonth(month));
  }

  res.json(findAllExpenses());
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

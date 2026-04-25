const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let expenses = [
  {
    id: "1",
    amount: 24.5,
    category: "food",
    description: "Supermarket",
    date: "2026-04-22",
  },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

app.get("/api/expenses/:id", (req, res) => {
  const expense = expenses.find((item) => item.id === req.params.id);

  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  res.json(expense);
});

app.post("/api/expenses", (req, res) => {
  const { amount, category, description, date } = req.body;

  if (
    amount === undefined ||
    !category ||
    !description ||
    !date ||
    Number.isNaN(Number(amount))
  ) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  const newExpense = {
    id: crypto.randomUUID(),
    amount: Number(amount),
    category,
    description,
    date,
  };

  expenses.push(newExpense);

  res.status(201).json(newExpense);
});

app.put("/api/expenses/:id", (req, res) => {
  const index = expenses.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const { amount, category, description, date } = req.body;

  if (
    amount === undefined ||
    !category ||
    !description ||
    !date ||
    Number.isNaN(Number(amount))
  ) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  const updatedExpense = {
    id: req.params.id,
    amount: Number(amount),
    category,
    description,
    date,
  };

  expenses[index] = updatedExpense;

  res.json(updatedExpense);
});

app.delete("/api/expenses/:id", (req, res) => {
  const index = expenses.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const deletedExpense = expenses.splice(index, 1)[0];

  res.json(deletedExpense);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

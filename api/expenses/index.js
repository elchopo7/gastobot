const {
  findAllExpenses,
  findExpensesByMonth,
  getComparisonTotals,
  addExpense,
} = require("../../server/db/expenses");

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

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { month, category, search, dateFrom, dateTo, sort, compare } = req.query;

      if (month && !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format" });
      }

      let expenses = month ? await findExpensesByMonth(month) : await findAllExpenses();

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
        response.comparison = await getComparisonTotals(month);
      }

      return res.status(200).json(response);
    }

    if (req.method === "POST") {
      const expense = validateExpensePayload(req.body || {});

      if (!expense) {
        return res.status(400).json({ message: "Invalid expense data" });
      }

      const createdExpense = await addExpense(expense);
      return res.status(201).json(createdExpense);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Expenses root API error:", error);
    return res.status(500).json({
      message: "Failed to process expenses request",
      error: error?.message || error?.details || error?.hint || "Unknown error",
    });
  }
};

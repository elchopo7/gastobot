const {
  findAllExpenses,
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
  const hasValidUserId = typeof payload.user_id === "string" && payload.user_id.trim() !== "";

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

  const validated = {
    amount: numericAmount,
    category: payload.category,
    description: payload.description.trim(),
    date: payload.date,
  };

  if (hasValidUserId) {
    validated.user_id = payload.user_id.trim();
  }

  return validated;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const expenses = await findAllExpenses();
      return res.status(200).json({ expenses });
    }

    if (req.method === "POST") {
      const expense = validateExpensePayload(req.body || {});

      if (!expense || !expense.user_id) {
        return res.status(400).json({
          message: "Invalid expense data",
          error: "Missing authenticated user_id",
        });
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

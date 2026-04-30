const {
  findExpenseById,
  editExpense,
  removeExpense,
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
  const id = req.query.id || req.query[0] || req.query.path || req.query.slug;

  if (!id) {
    return res.status(400).json({ message: "Expense id is required" });
  }

  try {
    if (req.method === "GET") {
      const expense = await findExpenseById(id);

      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      return res.status(200).json(expense);
    }

    if (req.method === "PUT") {
      const expense = validateExpensePayload(req.body || {});

      if (!expense) {
        return res.status(400).json({ message: "Invalid expense data" });
      }

      const updatedExpense = await editExpense(id, expense);

      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      return res.status(200).json(updatedExpense);
    }

    if (req.method === "DELETE") {
      const deletedExpense = await removeExpense(id);

      if (!deletedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      return res.status(200).json(deletedExpense);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Expense item API error:", error);
    return res.status(500).json({
      message: "Failed to process expense item",
      error: error?.message || error?.details || error?.hint || "Unknown error",
    });
  }
};

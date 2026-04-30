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
  const method = req.method || "GET";
  const pathSegments = Array.isArray(req.query.path) ? req.query.path : [];
  const [firstSegment] = pathSegments;

  try {
    if (!firstSegment) {
      if (method === "GET") {
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

      if (method === "POST") {
        const expense = validateExpensePayload(req.body || {});

        if (!expense) {
          return res.status(400).json({ message: "Invalid expense data" });
        }

        const createdExpense = await addExpense(expense);
        return res.status(201).json(createdExpense);
      }

      return res.status(405).json({ message: "Method not allowed" });
    }

    if (firstSegment === "summary") {
      if (method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
      }

      const { month } = req.query;

      if (!month) {
        return res.status(400).json({ message: "Month is required" });
      }

      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format" });
      }

      const summary = await getSummaryByMonth(month);
      const totals = summary.reduce((acc, item) => {
        acc[item.category] = Number(item.total);
        return acc;
      }, {});

      return res.status(200).json({ month, totals });
    }

    if (firstSegment === "evolution") {
      if (method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
      }

      const year = String(req.query.year || new Date().getFullYear());

      if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ message: "Invalid year format" });
      }

      const evolution = await getEvolutionByYear(year);
      const totalsByMonth = evolution.reduce((acc, item) => {
        acc[item.month] = Number(item.total);
        return acc;
      }, {});

      const labels = Array.from({ length: 12 }, (_, index) => {
        const monthNumber = String(index + 1).padStart(2, "0");
        return `${year}-${monthNumber}`;
      });

      const totals = labels.map((month) => Number(totalsByMonth[month] || 0));

      return res.status(200).json({ year, labels, totals });
    }

    if (firstSegment === "monthly") {
      if (method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
      }

      const monthlyTotals = await getAllMonthlyTotals();
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

      return res.status(200).json({ labels, totals });
    }

    if (/^\d+$/.test(firstSegment)) {
      if (method === "GET") {
        const expense = await findExpenseById(firstSegment);

        if (!expense) {
          return res.status(404).json({ message: "Expense not found" });
        }

        return res.status(200).json(expense);
      }

      if (method === "PUT") {
        const expense = validateExpensePayload(req.body || {});

        if (!expense) {
          return res.status(400).json({ message: "Invalid expense data" });
        }

        const updatedExpense = await editExpense(firstSegment, expense);

        if (!updatedExpense) {
          return res.status(404).json({ message: "Expense not found" });
        }

        return res.status(200).json(updatedExpense);
      }

      if (method === "DELETE") {
        const deletedExpense = await removeExpense(firstSegment);

        if (!deletedExpense) {
          return res.status(404).json({ message: "Expense not found" });
        }

        return res.status(200).json(deletedExpense);
      }
    }

    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error("Expenses API error:", error);
    return res.status(500).json({
      message: "Failed to process expenses request",
      error: error?.message || error?.details || error?.hint || "Unknown error",
    });
  }
};

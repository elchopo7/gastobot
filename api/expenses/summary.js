const { getSummaryByMonth } = require("../../server/db/expenses");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ message: "Month is required" });
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: "Invalid month format" });
  }

  try {
    const summary = await getSummaryByMonth(month);
    const totals = summary.reduce((acc, item) => {
      acc[item.category] = Number(item.total);
      return acc;
    }, {});

    return res.status(200).json({ month, totals });
  } catch (error) {
    console.error("Expenses summary API error:", error);
    return res.status(500).json({
      message: "Failed to load expense summary",
      error: error?.message || error?.details || error?.hint || "Unknown error",
    });
  }
};

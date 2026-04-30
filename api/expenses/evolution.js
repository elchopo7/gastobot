const { getEvolutionByYear } = require("../../server/db/expenses");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const year = String(req.query.year || new Date().getFullYear());

  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ message: "Invalid year format" });
  }

  try {
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
  } catch (error) {
    console.error("Expenses evolution API error:", error);
    return res.status(500).json({
      message: "Failed to load expense evolution",
      error: error?.message || error?.details || error?.hint || "Unknown error",
    });
  }
};

const { getAllMonthlyTotals } = require("../../server/db/expenses");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
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
  } catch (error) {
    console.error("Expenses monthly API error:", error);
    return res.status(500).json({
      message: "Failed to load monthly totals",
      error: error?.message || error?.details || error?.hint || "Unknown error",
    });
  }
};

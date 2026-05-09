const express = require("express");
const PdfPrinter = require("pdfmake");
const path = require("path");
const {
  findExpensesByMonthAndUser,
  getSummaryByMonthAndUser,
} = require("../db/expenses");

const router = express.Router();

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../node_modules/pdfmake/examples/fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../node_modules/pdfmake/examples/fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "../../node_modules/pdfmake/examples/fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../../node_modules/pdfmake/examples/fonts/Roboto-MediumItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

function parseMonth(month) {
  return /^\d{4}-\d{2}$/.test(month || "") ? month : null;
}

function buildPdfDefinition({ month, userLabel, summaryRows, expenses, total, budgetLimit }) {
  const categoryRows = summaryRows.map((row) => [
    row.category,
    `€${Number(row.total || 0).toFixed(2)}`,
    `${total > 0 ? ((Number(row.total || 0) / total) * 100).toFixed(0) : "0"}%`,
  ]);

  const topCategory = summaryRows[0] || null;
  const monthDate = new Date(`${month}-01T00:00:00Z`);
  const monthLabel = monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#111827",
    },
    styles: {
      title: {
        fontSize: 22,
        bold: true,
        color: "#2563eb",
      },
      subtitle: {
        fontSize: 12,
        color: "#6b7280",
        margin: [0, 4, 0, 0],
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        color: "#111827",
        margin: [0, 14, 0, 8],
      },
      metricValue: {
        fontSize: 18,
        bold: true,
        color: "#2563eb",
      },
      metricLabel: {
        fontSize: 9,
        color: "#6b7280",
      },
      small: {
        fontSize: 9,
        color: "#6b7280",
      },
    },
    content: [
      { text: "GastoBot", style: "title" },
      { text: `Monthly report for ${monthLabel}`, style: "subtitle" },
      { text: `Generated for ${userLabel || "signed-in user"}`, style: "small", margin: [0, 4, 0, 0] },
      { text: `Period: ${month}`, style: "small", margin: [0, 2, 0, 0] },

      {
        columns: [
          {
            width: "*",
            margin: [0, 14, 8, 0],
            stack: [
              { text: "Monthly total", style: "metricLabel" },
              { text: `€${total.toFixed(2)}`, style: "metricValue" },
            ],
            fillColor: "#eff6ff",
            marginBottom: 8,
          },
          {
            width: "*",
            margin: [8, 14, 8, 0],
            stack: [
              { text: "Budget", style: "metricLabel" },
              { text: budgetLimit ? `€${budgetLimit.toFixed(2)}` : "Not set", style: "metricValue" },
            ],
            fillColor: "#f8fafc",
            marginBottom: 8,
          },
          {
            width: "*",
            margin: [8, 14, 0, 0],
            stack: [
              { text: "Top category", style: "metricLabel" },
              { text: topCategory ? topCategory.category : "-", style: "metricValue" },
            ],
            fillColor: "#f8fafc",
            marginBottom: 8,
          },
        ],
      },

      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Summary", style: "sectionTitle" },
              {
                table: {
                  headerRows: 1,
                  widths: ["*", "auto", "auto"],
                  body: [
                    [
                      { text: "Category", bold: true },
                      { text: "Total", bold: true, alignment: "right" },
                      { text: "%", bold: true, alignment: "right" },
                    ],
                    ...categoryRows,
                  ],
                },
                layout: {
                  fillColor: (rowIndex) => (rowIndex === 0 ? "#dbeafe" : null),
                  hLineColor: "#e5e7eb",
                  vLineColor: "#e5e7eb",
                },
              },
            ],
          },
        ],
      },

      {
        text: "Recent expenses",
        style: "sectionTitle",
      },
      {
        ul: expenses.slice(0, 8).map((expense) =>
          `${expense.date} · ${expense.description} · €${Number(expense.amount).toFixed(2)} · ${expense.category}`
        ),
      },
    ],
  };
}

router.get("/monthly.pdf", async (req, res) => {
  const month = parseMonth(req.query.month);
  const userId = typeof req.query.user_id === "string" ? req.query.user_id.trim() : "";
  const userLabel = typeof req.query.user_label === "string" ? req.query.user_label.trim() : "";

  if (!month) {
    return res.status(400).json({ message: "Month is required and must be in YYYY-MM format" });
  }

  if (!userId) {
    return res.status(400).json({ message: "User id is required" });
  }

  try {
    const [summaryRows, expenses] = await Promise.all([
      getSummaryByMonthAndUser(month, userId),
      findExpensesByMonthAndUser(month, userId),
    ]);

    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const budgetLimit = null;

    const docDefinition = buildPdfDefinition({
      month,
      userLabel,
      summaryRows,
      expenses,
      total,
      budgetLimit,
    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="gastobot-report-${month}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Monthly PDF generation failed:", error);
    return res.status(500).json({
      message: "Failed to generate monthly PDF",
      error: error?.message || "Unknown PDF error",
    });
  }
});

module.exports = router;

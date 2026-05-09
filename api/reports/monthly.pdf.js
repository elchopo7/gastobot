const PdfPrinter = require("pdfmake");
const path = require("path");
const supabase = require("../../server/db/supabase");
const {
  findExpensesByMonthAndUser,
  getSummaryByMonthAndUser,
} = require("../../server/db/expenses");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../../node_modules/pdfmake/examples/fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../../node_modules/pdfmake/examples/fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "../../../node_modules/pdfmake/examples/fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../../../node_modules/pdfmake/examples/fonts/Roboto-MediumItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

function parseMonth(month) {
  return /^\d{4}-\d{2}$/.test(month || "") ? month : null;
}

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message || "Could not validate session");
  }

  return data?.user || null;
}

async function getBudgetLimitForMonth(month, userId) {
  const { data, error } = await supabase
    .from("budgets")
    .select("limit_amount")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? Number(data.limit_amount) : null;
}

function buildTextBudgetBar(percentage) {
  if (!Number.isFinite(percentage)) {
    return "Budget: not available";
  }

  const clamped = Math.max(0, Math.min(100, percentage));
  const filled = Math.round(clamped / 10);
  const empty = 10 - filled;
  return `Budget: [${"█".repeat(filled)}${"░".repeat(empty)}] ${clamped.toFixed(0)}%`;
}

function buildSafePdfFilename(month, email) {
  const emailPart = String(email || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "user";

  return `gastobot-report-${month}-${emailPart}.pdf`;
}

function buildPdfDefinition({ month, userLabel, summaryRows, expenses, total, budgetLimit }) {
  const categoryRows = summaryRows.map((row) => [
    row.category,
    `€${Number(row.total || 0).toFixed(2)}`,
    `${total > 0 ? ((Number(row.total || 0) / total) * 100).toFixed(0) : "0"}%`,
  ]);

  const recentExpenseRows = expenses.slice(0, 5).map((expense) => [
    expense.date,
    expense.description,
    expense.category,
    `€${Number(expense.amount || 0).toFixed(2)}`,
  ]);

  const topCategory = summaryRows[0] || null;
  const monthDate = new Date(`${month}-01T00:00:00Z`);
  const monthLabel = monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const budgetUsage = budgetLimit && budgetLimit > 0 ? (total / budgetLimit) * 100 : null;
  const budgetRemaining = budgetLimit && budgetLimit > 0 ? budgetLimit - total : null;
  const budgetSummaryText = budgetLimit && budgetLimit > 0
    ? `Used ${budgetUsage.toFixed(0)}% · ${budgetRemaining >= 0 ? `€${budgetRemaining.toFixed(2)} remaining` : `€${Math.abs(budgetRemaining).toFixed(2)} over budget`}`
    : "No budget configured";
  const budgetAccent = !budgetLimit
    ? "#94a3b8"
    : budgetUsage >= 100
      ? "#ef4444"
      : budgetUsage >= 80
        ? "#f59e0b"
        : "#10b981";
  const generationDate = new Date();
  const generationLabel = generationDate.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  });
  const budgetBar = buildTextBudgetBar(budgetUsage);

  return {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#111827",
    },
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 24],
      columns: [
        {
          width: "*",
          text: `Generated on ${generationLabel}`,
          fontSize: 9,
          color: "#64748b",
        },
        {
          width: "auto",
          alignment: "right",
          text: `Page ${currentPage} of ${pageCount}`,
          fontSize: 9,
          color: "#64748b",
        },
      ],
    }),
    content: [
      {
        canvas: [
          { type: "rect", x: 0, y: 0, w: 515, h: 120, color: "#2563eb" },
        ],
      },
      {
        margin: [24, -96, 24, 12],
        stack: [
          { text: "GastoBot", fontSize: 24, bold: true, color: "#ffffff" },
          { text: `Monthly report · ${monthLabel}`, fontSize: 11, color: "#e2e8f0", margin: [0, 6, 0, 0] },
          { text: `Generated for ${userLabel || "signed-in user"}`, fontSize: 9, color: "#cbd5e1", margin: [0, 4, 0, 0] },
          { text: `Period: ${month}`, fontSize: 9, color: "#cbd5e1", margin: [0, 2, 0, 0] },
        ],
      },
      { text: " ", margin: [0, 6, 0, 0] },
      {
        columns: [
          {
            width: "*",
            margin: [0, 14, 8, 0],
            stack: [
              { text: "Monthly total", fontSize: 9, color: "#6b7280" },
              { text: `€${total.toFixed(2)}`, fontSize: 18, bold: true, color: "#2563eb" },
            ],
            fillColor: "#eff6ff",
            marginBottom: 8,
          },
          {
            width: "*",
            margin: [8, 14, 8, 0],
            stack: [
              { text: "Budget", fontSize: 9, color: "#6b7280" },
              { text: budgetLimit ? `€${budgetLimit.toFixed(2)}` : "Not set", fontSize: 18, bold: true, color: "#2563eb" },
              { text: budgetSummaryText, fontSize: 9, color: "#6b7280", margin: [0, 4, 0, 0] },
              { text: budgetBar, fontSize: 9, color: budgetAccent, margin: [0, 6, 0, 0] },
            ],
            fillColor: budgetAccent === "#ef4444"
              ? "#fef2f2"
              : budgetAccent === "#f59e0b"
                ? "#fffbeb"
                : budgetAccent === "#10b981"
                  ? "#ecfdf5"
                  : "#f8fafc",
            border: [1, 1, 1, 1],
            borderColor: budgetAccent,
            borderRadius: 8,
            marginBottom: 8,
          },
          {
            width: "*",
            margin: [8, 14, 0, 0],
            stack: [
              { text: "Top category", fontSize: 9, color: "#6b7280" },
              { text: topCategory ? topCategory.category : "-", fontSize: 18, bold: true, color: "#2563eb" },
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
              { text: "Summary", fontSize: 14, bold: true, color: "#111827", margin: [0, 14, 0, 8] },
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
      { text: "Recent expenses", fontSize: 14, bold: true, color: "#111827", margin: [0, 14, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto"],
          body: [
            [
              { text: "Date", bold: true },
              { text: "Description", bold: true },
              { text: "Category", bold: true },
              { text: "Amount", bold: true, alignment: "right" },
            ],
            ...(recentExpenseRows.length
              ? recentExpenseRows
              : [[{ text: "No expenses yet", colSpan: 4, italics: true, color: "#6b7280" }, {}, {}, {}]]),
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#dbeafe" : rowIndex % 2 === 0 ? "#f8fafc" : null),
          hLineColor: "#e5e7eb",
          vLineColor: "#e5e7eb",
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
    ],
  };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const month = parseMonth(req.query.month);

  if (!month) {
    return res.status(400).json({ message: "Month is required and must be in YYYY-MM format" });
  }

  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = user.id;
    const [summaryRows, expenses] = await Promise.all([
      getSummaryByMonthAndUser(month, userId),
      findExpensesByMonthAndUser(month, userId),
    ]);

    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const budgetLimit = await getBudgetLimitForMonth(month, userId);
    const userLabel = user.email || "Signed-in user";
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
    res.setHeader("Content-Disposition", `attachment; filename="${buildSafePdfFilename(month, user.email)}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, max-age=0");

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Monthly PDF generation failed:", error);
    return res.status(500).json({
      message: "Failed to generate monthly PDF",
      error: error?.message || "Unknown PDF error",
    });
  }
};

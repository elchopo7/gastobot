const form = document.getElementById("expense-form");
const expensesList = document.querySelector(".expenses-list ul");
const monthlyAmount = document.querySelector(".summary-card__amount");
const kpiMonthTotal = document.getElementById("kpi-month-total");
const kpiMonthTotalNote = document.getElementById("kpi-month-total-note");
const kpiDailyAverage = document.getElementById("kpi-daily-average");
const kpiDailyAverageNote = document.getElementById("kpi-daily-average-note");
const kpiTopCategory = document.getElementById("kpi-top-category");
const kpiTopCategoryNote = document.getElementById("kpi-top-category-note");
const monthPrevButton = document.getElementById("month-prev");
const monthNextButton = document.getElementById("month-next");
const monthLabel = document.getElementById("month-label");
const expensesChartCanvas = document.getElementById("expenses-chart");
const dailyExpensesChartCanvas = document.getElementById("daily-expenses-chart");
const monthlyEvolutionChartCanvas = document.getElementById("monthly-evolution-chart");
const dashboardTab = document.getElementById("tab-dashboard");
const expensesTab = document.getElementById("tab-expenses");
const reportTab = document.getElementById("tab-report");
const dashboardView = document.getElementById("dashboard-view");
const expensesView = document.getElementById("expenses-view");
const reportView = document.getElementById("report-view");
const reportTitle = document.getElementById("report-title");
const reportSubtitle = document.getElementById("report-subtitle");
const reportTotal = document.getElementById("report-total");
const reportTotalNote = document.getElementById("report-total-note");
const reportAverage = document.getElementById("report-average");
const reportAverageNote = document.getElementById("report-average-note");
const reportTopCategory = document.getElementById("report-top-category");
const reportTopCategoryNote = document.getElementById("report-top-category-note");
const reportCategoryList = document.getElementById("report-category-list");
const reportShareButton = document.getElementById("report-share");
const reportExportButton = document.getElementById("report-export");
const reportTrendChartCanvas = document.getElementById("report-trend-chart");
const filterSearch = document.getElementById("filter-search");
const filterCategory = document.getElementById("filter-category");
const filterFrom = document.getElementById("filter-from");
const filterTo = document.getElementById("filter-to");
const filterSort = document.getElementById("filter-sort");
const comparisonMonthA = document.getElementById("comparison-month-a");
const comparisonMonthB = document.getElementById("comparison-month-b");
const comparisonApply = document.getElementById("comparison-apply");
const comparisonCanvas = document.getElementById("comparison-chart");
const filtersReset = document.getElementById("filters-reset");
const filtersApply = document.getElementById("filters-apply");
const filtersExport = document.getElementById("filters-export");
const aiQuestion = document.getElementById("ai-question");
const aiAskButton = document.getElementById("ai-ask");
const aiResult = document.getElementById("ai-result");
const expensesListTitle = document.getElementById("expenses-list-title");
const expensesListMeta = document.getElementById("expenses-list-meta");

const categoryIcons = {
  food: "🍔",
  transport: "🚌",
  entertainment: "🎬",
  housing: "🏠",
  health: "🩺",
  education: "📚",
  shopping: "🛍️",
  other: "💳",
};

const categoryColors = {
  food: "#f97316",
  transport: "#3b82f6",
  entertainment: "#a855f7",
  housing: "#10b981",
  health: "#ef4444",
  education: "#f59e0b",
  shopping: "#ec4899",
  other: "#6b7280",
};

const expenseCategories = Object.keys(categoryColors);

let expensesChart;
let dailyExpensesChart;
let monthlyEvolutionChart;
let reportTrendChart;
let comparisonChart;
let expenses = [];
let selectedMonth = getMonthParam();
let comparisonMonthAValue = getMonthParam();
let comparisonMonthBValue = shiftMonth(getMonthParam(), -1);
let currentView = "dashboard";
let filters = {
  search: "",
  category: "",
  dateFrom: "",
  dateTo: "",
  sort: "",
};

(async function init() {
  await loadExpensesList();
  selectedMonth = getMostRelevantMonth(expenses) || selectedMonth;
  comparisonMonthAValue = selectedMonth;
  comparisonMonthBValue = shiftMonth(selectedMonth, -1);
  if (comparisonMonthA) comparisonMonthA.value = comparisonMonthAValue;
  if (comparisonMonthB) comparisonMonthB.value = comparisonMonthBValue;
  updateMonthLabel();
  renderExpenses(expenses);
  await refreshDashboard();
  await renderComparisonChart();
  renderView();
})();

filtersReset.addEventListener("click", () => {
  filters = {
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    sort: "",
  };

  filterSearch.value = "";
  filterCategory.value = "";
  filterFrom.value = "";
  filterTo.value = "";
  filterSort.value = "";

  applyFilters();
});

filtersApply.addEventListener("click", applyFilters);

if (filtersExport) {
  filtersExport.addEventListener("click", exportFilteredExpensesToCsv);
}

if (aiAskButton) {
  aiAskButton.addEventListener("click", askOpenAiAboutExpenses);
}

if (comparisonApply) {
  comparisonApply.addEventListener("click", async () => {
    comparisonMonthAValue = comparisonMonthA?.value || comparisonMonthAValue;
    comparisonMonthBValue = comparisonMonthB?.value || comparisonMonthBValue;
    await renderComparisonChart();
  });
}

dashboardTab.addEventListener("click", () => {
  currentView = "dashboard";
  renderView();
});

expensesTab.addEventListener("click", () => {
  currentView = "expenses";
  renderView();
});

reportTab.addEventListener("click", () => {
  currentView = "report";
  renderView();
});

reportShareButton.addEventListener("click", async () => {
  const reportText = buildReportShareText();

  if (navigator.share) {
    try {
      await navigator.share({
        title: "GastoBot monthly report",
        text: reportText,
      });
      return;
    } catch (error) {
      // Fallback to clipboard below.
    }
  }

  await navigator.clipboard.writeText(reportText);
});

reportExportButton.addEventListener("click", () => {
  window.print();
});

monthPrevButton.addEventListener("click", async () => {
  selectedMonth = shiftMonth(selectedMonth, -1);
  updateMonthLabel();
  await refreshDashboard();
});

monthNextButton.addEventListener("click", async () => {
  selectedMonth = shiftMonth(selectedMonth, 1);
  updateMonthLabel();
  await refreshDashboard();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  const newExpense = {
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    description: formData.get("description") || "No description",
    date: formData.get("date"),
  };

  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newExpense),
  });

  if (!response.ok) return;

  await loadExpensesList();
  renderExpenses(expenses);
  await refreshDashboard();

  form.reset();
});

async function loadExpensesList() {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.sort) params.set("sort", filters.sort);

  const endpoint = params.toString()
    ? `/api/expenses?${params.toString()}`
    : "/api/expenses";

  const response = await fetch(endpoint);
  const data = await response.json();
  expenses = Array.isArray(data) ? data : (data.expenses || []);
  updateExpensesListHeader();
}

async function fetchExpensesForMonth(month) {
  const response = await fetch(`/api/expenses?month=${month}`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.expenses || []);
}

async function deleteExpense(id) {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) return;

  await loadExpensesList();
  renderExpenses(expenses);
  await refreshDashboard();
}

function renderExpenses(expenses) {
  expensesList.innerHTML = "";

  if (!expenses.length) {
    const empty = document.createElement("li");
    empty.innerHTML = `
      <div class="card card--empty">
        <p>No expenses found</p>
      </div>
    `;
    expensesList.appendChild(empty);
    return;
  }

  expenses.forEach((expense) => {
    const li = document.createElement("li");
    const icon = categoryIcons[expense.category] || "💸";
    const formattedDate = formatFullDate(expense.date);

    li.innerHTML = `
      <div class="card">
        <span class="expense-icon" aria-hidden="true">${icon}</span>
        <p>${expense.description}</p>
        <div class="expense-meta">
          <h4>€${expense.amount.toFixed(2)}</h4>
          <span>${formattedDate}</span>
        </div>
        <button class="delete-btn" type="button">Delete</button>
      </div>
    `;

    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
      const confirmed = confirm("Are you sure you want to delete this expense?");
      if (confirmed) {
        deleteExpense(expense.id);
      }
    });

    expensesList.appendChild(li);
  });
}

function renderMonthlyHighlight(expenses) {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  monthlyAmount.textContent = `€${total.toFixed(2)}`;
}

function applyFilters() {
  filters = {
    search: filterSearch.value.trim(),
    category: filterCategory.value,
    dateFrom: filterFrom.value,
    dateTo: filterTo.value,
    sort: filterSort.value,
  };

  loadExpensesList().then(() => {
    renderExpenses(expenses);
    renderMonthlyHighlight(expenses);
    refreshDashboard();
  });
}

function exportFilteredExpensesToCsv() {
  const rows = [
    ["id", "description", "amount", "category", "date"],
    ...expenses.map((expense) => [
      expense.id,
      expense.description,
      Number(expense.amount).toFixed(2),
      expense.category,
      expense.date,
    ]),
  ];

  const csv = rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gastobot-filters-${selectedMonth}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function askOpenAiAboutExpenses() {
  const question = aiQuestion?.value.trim();

  if (!question) {
    aiResult.textContent = "Write a question first.";
    return;
  }

  if (aiAskButton) {
    aiAskButton.disabled = true;
    aiAskButton.textContent = "Asking...";
  }

  if (aiResult) {
    aiResult.textContent = "Thinking...";
  }

  try {
    const response = await fetch("/api/ai/expenses-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: selectedMonth,
        question,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "AI request failed");
    }

    if (aiResult) {
      aiResult.textContent = data.answer || "No answer returned.";
    }
  } catch (error) {
    if (aiResult) {
      aiResult.textContent = `Error: ${error.message}`;
    }
  } finally {
    if (aiAskButton) {
      aiAskButton.disabled = false;
      aiAskButton.textContent = "Ask AI";
    }
  }
}

async function renderKpis() {
  const month = selectedMonth;
  const summaryResponse = await fetch(`/api/expenses/summary?month=${month}`);

  if (!summaryResponse.ok) {
    return;
  }

  const summaryData = await summaryResponse.json();
  const monthTotal = Object.values(summaryData.totals || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const monthExpenses = expenses.filter((expense) => expense.date?.startsWith(month));
  const uniqueDays = new Set(monthExpenses.map((expense) => expense.date)).size || 1;

  const averagePerDay = monthTotal / uniqueDays;
  const topCategory = Object.entries(summaryData.totals || {}).sort((a, b) => b[1] - a[1])[0];
  const topCategoryValue = topCategory ? topCategory[0] : "-";
  const topCategoryAmount = topCategory ? Number(topCategory[1]) : 0;

  kpiMonthTotal.textContent = `€${monthTotal.toFixed(2)}`;
  kpiMonthTotalNote.textContent = `${formatMonthLabel(month)} total`;

  kpiDailyAverage.textContent = `€${averagePerDay.toFixed(2)}`;
  kpiDailyAverageNote.textContent = `${uniqueDays} active day${uniqueDays === 1 ? "" : "s"}`;

  kpiTopCategory.textContent = topCategoryValue;
  kpiTopCategoryNote.textContent = `€${topCategoryAmount.toFixed(2)} spent`;
}

function getMonthParam(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

function updateMonthLabel() {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  const formattedMonth = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  monthLabel.textContent = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);
}

async function refreshDashboard() {
  renderMonthlyHighlight(expenses);
  await renderKpis();
  await renderCharts();
  await renderReport();
}

function renderView() {
  const isDashboard = currentView === "dashboard";
  const isExpenses = currentView === "expenses";
  const isReport = currentView === "report";

  dashboardView.classList.toggle("is-hidden", !isDashboard);
  expensesView.classList.toggle("is-hidden", !isExpenses);
  reportView.classList.toggle("is-hidden", !isReport);
  dashboardTab.classList.toggle("is-active", isDashboard);
  expensesTab.classList.toggle("is-active", isExpenses);
  reportTab.classList.toggle("is-active", isReport);
}

async function renderCharts() {
  const month = selectedMonth;
  const response = await fetch(`/api/expenses/summary?month=${month}`);

  if (!response.ok) {
    return;
  }

  const data = await response.json();
  const labels = [];
  const values = [];
  const colors = [];

  for (const category of expenseCategories) {
    const total = Number(data.totals?.[category] || 0);

    if (total > 0) {
      labels.push(category);
      values.push(total);
      colors.push(categoryColors[category]);
    }
  }

  if (expensesChart) {
    expensesChart.destroy();
  }

  expensesChart = new Chart(expensesChartCanvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });

  const dailyTotals = getDailyTotalsForMonth(month);
  const dayLabels = Object.keys(dailyTotals);
  const dayValues = Object.values(dailyTotals);

  if (dailyExpensesChart) {
    dailyExpensesChart.destroy();
  }

  dailyExpensesChart = new Chart(dailyExpensesChartCanvas, {
    type: "bar",
    data: {
      labels: dayLabels,
      datasets: [
        {
          label: "Daily spending",
          data: dayValues,
          backgroundColor: "#2563eb",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  const year = month.slice(0, 4);
  const evolutionResponse = await fetch(`/api/expenses/evolution?year=${year}`);

  if (!evolutionResponse.ok) {
    return;
  }

  const evolutionData = await evolutionResponse.json();

  if (monthlyEvolutionChart) {
    monthlyEvolutionChart.destroy();
  }

  monthlyEvolutionChart = new Chart(monthlyEvolutionChartCanvas, {
    type: "line",
    data: {
      labels: evolutionData.labels.map(formatMonthLabel),
      datasets: [
        {
          label: `Evolución ${year}`,
          data: evolutionData.totals,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

async function renderReport() {
  const month = selectedMonth;
  const summaryResponse = await fetch(`/api/expenses/summary?month=${month}`);

  if (!summaryResponse.ok) {
    return;
  }

  const summaryData = await summaryResponse.json();
  const monthExpenses = expenses.filter((expense) => expense.date?.startsWith(month));
  const monthTotal = Object.values(summaryData.totals || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const uniqueDays = new Set(monthExpenses.map((expense) => expense.date)).size || 1;
  const averagePerDay = monthTotal / uniqueDays;
  const topCategory = Object.entries(summaryData.totals || {}).sort((a, b) => b[1] - a[1])[0];

  reportTitle.textContent = formatMonthLabel(month);
  reportSubtitle.textContent = `${monthExpenses.length} expense${monthExpenses.length === 1 ? "" : "s"} in this period`;
  reportTotal.textContent = `€${monthTotal.toFixed(2)}`;
  reportTotalNote.textContent = `${formatMonthLabel(month)} total`;
  reportAverage.textContent = `€${averagePerDay.toFixed(2)}`;
  reportAverageNote.textContent = `${uniqueDays} active day${uniqueDays === 1 ? "" : "s"}`;
  reportTopCategory.textContent = topCategory ? topCategory[0] : "-";
  reportTopCategoryNote.textContent = topCategory ? `€${Number(topCategory[1]).toFixed(2)} spent` : "No data";

  const categories = Object.entries(summaryData.totals || {}).sort((a, b) => b[1] - a[1]);
  reportCategoryList.innerHTML = categories.length
    ? categories
        .map(
          ([category, value]) => `
            <li class="report-list__item">
              <span class="report-list__category">${category}</span>
              <span class="report-list__value">€${Number(value).toFixed(2)}</span>
            </li>
          `
        )
        .join("")
    : '<li class="report-list__item"><span class="report-list__category">No expenses yet</span><span class="report-list__value">€0.00</span></li>';

  if (reportTrendChart) {
    reportTrendChart.destroy();
  }

  const evolutionResponse = await fetch(`/api/expenses/evolution?year=${month.slice(0, 4)}`);
  if (!evolutionResponse.ok) {
    return;
  }

  const evolutionData = await evolutionResponse.json();
  reportTrendChart = new Chart(reportTrendChartCanvas, {
    type: "line",
    data: {
      labels: evolutionData.labels.map(formatMonthLabel),
      datasets: [
        {
          label: "Tendencia mensual",
          data: evolutionData.totals,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });
}

function getDaysInMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function buildDailyTotals(expenses, month) {
  const daysInMonth = getDaysInMonth(month);
  const totals = Array.from({ length: daysInMonth }, () => 0);

  expenses.forEach((expense) => {
    const day = Number(expense.date?.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) {
      totals[day - 1] += Number(expense.amount || 0);
    }
  });

  return totals;
}

async function renderComparisonChart() {
  if (!comparisonCanvas || !window.Chart) {
    return;
  }

  const monthA = comparisonMonthA?.value || comparisonMonthAValue || getMonthParam();
  const monthB = comparisonMonthB?.value || comparisonMonthBValue || shiftMonth(monthA, -1);

  const [expensesA, expensesB] = await Promise.all([
    fetchExpensesForMonth(monthA),
    fetchExpensesForMonth(monthB),
  ]);

  const daysInChart = Math.max(getDaysInMonth(monthA), getDaysInMonth(monthB));
  const labels = Array.from({ length: daysInChart }, (_, index) => String(index + 1));
  const dataA = buildDailyTotals(expensesA, monthA);
  const dataB = buildDailyTotals(expensesB, monthB);

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  comparisonChart = new Chart(comparisonCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: formatMonthLabel(monthA),
          data: dataA,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: formatMonthLabel(monthB),
          data: dataB,
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Day of month",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Expense",
          },
        },
      },
    },
  });
}

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  const formattedMonth = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return `${formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)} ${year}`;
}

function formatFullDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const [year, monthNumber, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, day));
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function buildReportShareText() {
  const title = formatMonthLabel(selectedMonth);
  const monthTotal = kpiMonthTotal.textContent;
  const topCategory = kpiTopCategory.textContent;
  return `GastoBot report for ${title}\nTotal: ${monthTotal}\nTop category: ${topCategory}`;
}

function getDailyTotalsForMonth(month) {
  const totals = {};

  expenses
    .filter((expense) => expense.date?.startsWith(month))
    .forEach((expense) => {
      const day = expense.date.slice(8, 10);
      totals[day] = (totals[day] || 0) + Number(expense.amount);
    });

  return totals;
}

function getMostRelevantMonth(expenses) {
  if (!expenses.length) {
    return null;
  }

  return expenses[0]?.date?.slice(0, 7) || null;
}

function updateExpensesListHeader() {
  const activeFilters = [
    filters.search && `search: ${filters.search}`,
    filters.category && `category: ${filters.category}`,
    filters.dateFrom && `from: ${filters.dateFrom}`,
    filters.dateTo && `to: ${filters.dateTo}`,
    filters.sort && `sort: ${filters.sort}`,
  ].filter(Boolean);

  expensesListTitle.textContent = activeFilters.length ? "Filtered expenses" : "Expenses List";
  expensesListMeta.textContent = activeFilters.length
    ? activeFilters.join(" · ")
    : "All expenses";
}

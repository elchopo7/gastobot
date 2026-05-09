import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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
const reportPdfButton = document.getElementById("report-pdf");
const reportTrendChartCanvas = document.getElementById("report-trend-chart");
const monthlyEvolutionTitle = document.getElementById("monthly-evolution-title");
const themeToggle = document.getElementById("theme-toggle");
const themeToggleIcon = themeToggle?.querySelector(".theme-toggle__icon");
const themeToggleLabel = themeToggle?.querySelector(".theme-toggle__label");
const authPanel = document.querySelector(".auth-panel");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSignupButton = document.getElementById("auth-signup");
const authSigninButton = document.getElementById("auth-signin");
const authSignoutButton = document.getElementById("auth-signout");
const authStatus = document.getElementById("auth-status");
const authSessionState = document.getElementById("auth-session-state");
const budgetForm = document.getElementById("budget-form");
const budgetLimitInput = document.getElementById("budget-limit");
const budgetMonthLabel = document.getElementById("budget-month-label");
const budgetSpentLabel = document.getElementById("budget-spent-label");
const budgetLimitLabel = document.getElementById("budget-limit-label");
const budgetProgressBar = document.getElementById("budget-progress-bar");
const budgetStatus = document.getElementById("budget-status");
const budgetPanel = document.querySelector(".budget-panel");
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
const expenseFormStatus = document.getElementById("expense-form-status");
const expensesListTitle = document.getElementById("expenses-list-title");
const expensesListMeta = document.getElementById("expenses-list-meta");
const ticketImageInput = document.getElementById("ticket-image");
const ticketPreviewWrap = document.getElementById("ticket-preview-wrap");
const ticketPreview = document.getElementById("ticket-preview");
const ticketScanButton = document.getElementById("ticket-scan");
const ticketLocalOcrButton = document.getElementById("ticket-local-ocr");
const ticketClearButton = document.getElementById("ticket-clear");
const ticketStatus = document.getElementById("ticket-status");
const ticketApplyButton = document.getElementById("ticket-apply");
const ticketAmountResult = document.getElementById("ticket-amount-result");
const ticketMerchantResult = document.getElementById("ticket-merchant-result");
const ticketDateResult = document.getElementById("ticket-date-result");
const ticketConfidenceResult = document.getElementById("ticket-confidence-result");

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
let currentUser = null;
let budgetState = {
  month: selectedMonth,
  limitAmount: null,
  error: null,
};
let ticketState = {
  file: null,
  previewUrl: "",
  text: "",
  amount: null,
  merchant: "",
  date: "",
  isProcessing: false,
  error: "",
};
let filters = {
  search: "",
  category: "",
  dateFrom: "",
  dateTo: "",
  sort: "",
};

const THEME_STORAGE_KEY = "gastobot-theme";
const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const SUPABASE_URL = window.GASTOBOT_SUPABASE_URL;
const SUPABASE_ANON_KEY = window.GASTOBOT_SUPABASE_ANON_KEY;
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("SUPABASE_URL_HERE")
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
const supabaseConfigured =
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) && !SUPABASE_URL.includes("SUPABASE_URL_HERE");

(async function init() {
  try {
    applyTheme(getStoredTheme() || defaultTheme);
    syncThemeToggle();
    await syncAuthState();
    await loadExpensesList();
    selectedMonth = getMostRelevantMonth(expenses) || selectedMonth;
    comparisonMonthAValue = selectedMonth;
    comparisonMonthBValue = shiftMonth(selectedMonth, -1);
    if (comparisonMonthA) comparisonMonthA.value = comparisonMonthAValue;
    if (comparisonMonthB) comparisonMonthB.value = comparisonMonthBValue;
    updateMonthLabel();
    renderExpenses(expenses);
    await refreshDashboard();
    await loadBudgetForSelectedMonth();
    await renderComparisonChart();
    renderView();
  } catch (error) {
    console.error("App init failed:", error);
    if (expensesListMeta) {
      expensesListMeta.textContent = error.message || "Failed to initialize app";
      expensesListMeta.classList.add("expenses-list__meta--error");
    }
  }
})();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    syncThemeToggle();
  });
}

if (authSignupButton) {
  authSignupButton.addEventListener("click", handleSignUp);
}

if (authSigninButton) {
  authSigninButton.addEventListener("click", handleSignIn);
}

if (authSignoutButton) {
  authSignoutButton.addEventListener("click", handleSignOut);
}

if (authSessionState) {
  authSessionState.addEventListener("click", () => {
    if (authSessionState.textContent !== "Not signed in") {
      toggleAuthPanel();
    }
  });
}

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

if (budgetForm) {
  budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabase || !currentUser) {
      if (budgetStatus) {
        budgetStatus.textContent = "Sign in to save your budget.";
        budgetStatus.classList.add("budget-meter__status--error");
      }
      return;
    }

    const limitAmount = Number(budgetLimitInput?.value);

    if (!Number.isFinite(limitAmount) || limitAmount < 0) {
      if (budgetStatus) {
        budgetStatus.textContent = "Enter a valid budget amount.";
        budgetStatus.classList.add("budget-meter__status--error");
      }
      return;
    }

    try {
      await saveBudgetForMonth(selectedMonth, limitAmount);
      await loadBudgetForSelectedMonth();
    } catch (error) {
      if (budgetStatus) {
        budgetStatus.textContent = error.message || "Could not save budget.";
        budgetStatus.classList.add("budget-meter__status--error");
      }
    }
  });
}

if (ticketImageInput) {
  ticketImageInput.addEventListener("change", handleTicketFileSelection);
}

if (ticketScanButton) {
  ticketScanButton.addEventListener("click", analyzeSelectedTicket);
}

if (ticketLocalOcrButton) {
  ticketLocalOcrButton.addEventListener("click", scanSelectedTicketWithLocalOcr);
}

if (ticketClearButton) {
  ticketClearButton.addEventListener("click", clearTicketScanner);
}

if (ticketApplyButton) {
  ticketApplyButton.addEventListener("click", applyTicketExtractionToForm);
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

if (reportPdfButton) {
  reportPdfButton.addEventListener("click", exportMonthlyReportPdf);
}

monthPrevButton.addEventListener("click", async () => {
  selectedMonth = shiftMonth(selectedMonth, -1);
  updateMonthLabel();
  try {
    await loadBudgetForSelectedMonth();
    await refreshDashboard();
  } catch (error) {
    console.error(error);
  }
});

monthNextButton.addEventListener("click", async () => {
  selectedMonth = shiftMonth(selectedMonth, 1);
  updateMonthLabel();
  try {
    await loadBudgetForSelectedMonth();
    await refreshDashboard();
  } catch (error) {
    console.error(error);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activeUser = await getActiveUser();

  if (!activeUser) {
    if (expenseFormStatus) {
      expenseFormStatus.textContent = "Sign in to save an expense.";
      expenseFormStatus.classList.add("form-status--error");
    }
    return;
  }

  const formData = new FormData(form);

  const newExpense = {
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    description: formData.get("description") || "No description",
    date: formData.get("date"),
    user_id: activeUser.id,
  };

  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newExpense),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || "Could not save expense.";
    if (expenseFormStatus) {
      expenseFormStatus.textContent = errorMessage;
      expenseFormStatus.classList.add("form-status--error");
    }
    return;
  }

  if (expenseFormStatus) {
    expenseFormStatus.textContent = "Expense saved.";
    expenseFormStatus.classList.remove("form-status--error");
  }

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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || `Failed to load expenses (${response.status})`;
    if (expensesListMeta) {
      expensesListMeta.textContent = message;
      expensesListMeta.classList.add("expenses-list__meta--error");
    }
    expenses = [];
    updateExpensesListHeader();
    return;
  }

  const data = await response.json();
  expenses = Array.isArray(data) ? data : (data.expenses || []);
  if (expensesListMeta) {
    expensesListMeta.classList.remove("expenses-list__meta--error");
  }
  updateExpensesListHeader();
}

async function fetchExpensesForMonth(month) {
  const response = await fetch(`/api/expenses?month=${month}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load month ${month}`);
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

async function loadBudgetForSelectedMonth() {
  if (!budgetPanel) {
    return;
  }

  budgetState.month = selectedMonth;

  const activeUser = await getActiveUser();

  if (!supabase || !activeUser) {
    budgetState.limitAmount = null;
    budgetState.error = null;
    await renderBudget();
    return;
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("limit_amount")
    .eq("user_id", activeUser.id)
    .eq("month", selectedMonth)
    .maybeSingle();

  if (error) {
    budgetState.limitAmount = null;
    budgetState.error = error.message || "Could not load budget.";
    if (budgetStatus) {
      budgetStatus.classList.add("budget-meter__status--error");
    }
    await renderBudget();
    return;
  }

  budgetState.limitAmount = data ? Number(data.limit_amount) : null;
  budgetState.error = null;
  await renderBudget();
}

async function saveBudgetForMonth(month, limitAmount) {
  const activeUser = await getActiveUser();

  if (!supabase || !activeUser) {
    throw new Error("Sign in to save your budget.");
  }

  const payload = {
    user_id: activeUser.id,
    month,
    limit_amount: limitAmount,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("budgets").upsert(payload, {
    onConflict: "user_id,month",
  });

  if (error) {
    throw new Error(error.message || "Could not save budget.");
  }

  budgetState.error = null;
}

async function renderBudget() {
  if (!budgetPanel) {
    return;
  }

  const currentMonth = selectedMonth;
  const monthSummary = await fetchMonthlySummary(currentMonth);
  const spent = Object.values(monthSummary.totals || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const hasBudget = Number.isFinite(budgetState.limitAmount) && budgetState.limitAmount > 0;
  const usage = hasBudget ? (spent / budgetState.limitAmount) * 100 : 0;

  budgetPanel.classList.remove("budget-panel--warning", "budget-panel--danger");
  budgetPanel.dataset.state = hasBudget ? "active" : "empty";

  if (budgetMonthLabel) {
    budgetMonthLabel.textContent = `For ${formatMonthLabel(currentMonth)}`;
  }

  if (budgetLimitInput && document.activeElement !== budgetLimitInput) {
    budgetLimitInput.value = hasBudget ? String(budgetState.limitAmount) : "";
  }

  if (budgetSpentLabel) {
    budgetSpentLabel.textContent = `Spent €${spent.toFixed(2)}`;
  }

  if (budgetLimitLabel) {
    budgetLimitLabel.textContent = hasBudget
      ? `Limit €${budgetState.limitAmount.toFixed(2)}`
      : "Limit not set";
  }

  if (budgetProgressBar) {
    budgetProgressBar.style.width = hasBudget ? `${Math.min(usage, 100)}%` : "0%";
  }

  if (!budgetStatus) {
    return;
  }

  budgetStatus.classList.remove("budget-meter__status--error");

  if (budgetState.error) {
    budgetStatus.textContent = budgetState.error;
    budgetStatus.classList.add("budget-meter__status--error");
    return;
  }

  if (!currentUser) {
    budgetStatus.textContent = "Sign in to save a monthly budget for your account.";
    return;
  }

  if (!hasBudget) {
    budgetStatus.textContent = "Set a monthly limit to start tracking your budget.";
    return;
  }

  if (usage >= 100) {
    budgetPanel.classList.add("budget-panel--danger");
    budgetStatus.textContent = `You are over budget by €${(spent - budgetState.limitAmount).toFixed(2)}.`;
    return;
  }

  if (usage >= 80) {
    budgetPanel.classList.add("budget-panel--warning");
    budgetStatus.textContent = `You have used ${usage.toFixed(0)}% of your budget.`;
    return;
  }

  budgetStatus.textContent = `You have used ${usage.toFixed(0)}% of your budget.`;
}

function handleTicketFileSelection(event) {
  const [file] = event.target.files || [];

  resetTicketResult(false);

  if (!file) {
    setTicketStatus("No image selected yet.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    setTicketError("Please upload a JPG, PNG or HEIC-compatible image.");
    return;
  }

  ticketState.file = file;

  if (ticketState.previewUrl) {
    URL.revokeObjectURL(ticketState.previewUrl);
  }

  ticketState.previewUrl = URL.createObjectURL(file);

  if (ticketPreviewWrap) {
    ticketPreviewWrap.classList.remove("is-hidden");
  }

  if (ticketPreview) {
    ticketPreview.src = ticketState.previewUrl;
  }

  setTicketStatus("Image selected. Tap Extract amount to run OCR locally.");
}

async function analyzeSelectedTicket() {
  if (!ticketState.file) {
    setTicketError("Choose an image first.");
    return;
  }

  if (ticketState.isProcessing) {
    return;
  }

  ticketState.isProcessing = true;
  ticketState.error = "";
  ticketState.text = "";
  ticketState.amount = null;
  ticketState.merchant = "";
  ticketState.date = "";
  ticketState.confidence = null;
  updateTicketResult();
  setTicketStatus("Sending receipt to the vision model...");
  setTicketActionLoading(true);

  try {
    const imageDataUrl = await compressReceiptImage(ticketState.file);
    const response = await fetch("/api/receipts/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageDataUrl,
        hintMonth: selectedMonth,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || "Receipt analysis failed.");
    }

    ticketState.amount = Number.isFinite(Number(data.amount)) ? Number(data.amount) : null;
    ticketState.merchant = typeof data.merchant === "string" ? data.merchant : "";
    ticketState.date = normalizeDateString(data.date);
    ticketState.confidence = Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : null;
    ticketState.text = "";

    if (!ticketState.amount) {
      throw new Error("The model could not detect a clear total.");
    }

    updateTicketResult();
    setTicketStatus(
      data.source === "vision"
        ? "Receipt analyzed successfully. Review the detected data before saving."
        : "Receipt analyzed. Please review the detected data before saving."
    );
    if (ticketApplyButton) {
      ticketApplyButton.classList.remove("is-hidden");
    }
  } catch (error) {
    setTicketError(`${error.message || "Receipt analysis failed."} You can try local OCR as a fallback.`);
  } finally {
    ticketState.isProcessing = false;
    setTicketActionLoading(false);
  }
}

async function scanSelectedTicketWithLocalOcr() {
  if (!ticketState.file) {
    setTicketError("Choose an image first.");
    return;
  }

  const ocr = window.Tesseract;

  if (!ocr || typeof ocr.recognize !== "function") {
    setTicketError("Local OCR engine is not available right now.");
    return;
  }

  if (ticketState.isProcessing) {
    return;
  }

  ticketState.isProcessing = true;
  ticketState.error = "";
  ticketState.text = "";
  ticketState.amount = null;
  ticketState.merchant = "";
  ticketState.date = "";
  ticketState.confidence = null;
  updateTicketResult();
  setTicketStatus("Reading ticket locally in your browser...");
  setTicketActionLoading(true);

  try {
    const result = await ocr.recognize(ticketState.file, "eng+spa", {
      logger: ({ status, progress }) => {
        if (status) {
          const percent = Number.isFinite(progress) ? Math.round(progress * 100) : null;
          setTicketStatus(
            percent !== null
              ? `${status} (${percent}%)`
              : status.charAt(0).toUpperCase() + status.slice(1)
          );
        }
      },
    });

    ticketState.text = result?.data?.text || "";

    if (!ticketState.text.trim()) {
      setTicketError("We could not read any text from this image. Try a clearer photo.");
      return;
    }

    const parsed = parseTicketText(ticketState.text);
    ticketState.amount = parsed.amount;
    ticketState.merchant = parsed.merchant;
    ticketState.date = parsed.date;
    ticketState.confidence = null;

    if (!ticketState.amount) {
      setTicketError("No clear amount was detected. Try another photo or enter it manually.");
      return;
    }

    updateTicketResult();
    setTicketStatus("Local OCR completed. Review the detected data before saving.");
    if (ticketApplyButton) {
      ticketApplyButton.classList.remove("is-hidden");
    }
  } catch (error) {
    setTicketError(error.message || "OCR failed.");
  } finally {
    ticketState.isProcessing = false;
    setTicketActionLoading(false);
  }
}

async function compressReceiptImage(file) {
  const imageDataUrl = await readFileAsDataUrl(file);

  if (!window.document?.createElement) {
    return imageDataUrl;
  }

  const image = await loadImage(imageDataUrl);
  const maxSize = 1600;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));

  if (scale >= 1) {
    return imageDataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return imageDataUrl;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.84);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = src;
  });
}

function parseTicketText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const amountCandidates = extractAmountCandidates(normalized);
  const amount = selectBestAmount(amountCandidates, normalized);
  const merchant = inferMerchant(lines);
  const date = inferDate(normalized) || "";

  return {
    amount,
    merchant,
    date,
  };
}

function extractAmountCandidates(text) {
  const matches = [...text.matchAll(/(?:€|EUR|usd|\$)?\s*(\d{1,4}(?:[.,]\d{2})?)/gi)];
  return matches
    .map((match) => Number(String(match[1]).replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function selectBestAmount(candidates, text) {
  if (!candidates.length) {
    return null;
  }

  const keywords = ["total", "importe", "amount", "grand total", "total a pagar", "total due", "balance due"];
  const lowerText = text.toLowerCase();
  const keywordBonus = keywords.some((keyword) => lowerText.includes(keyword)) ? 1 : 0;

  const unique = [...new Set(candidates.map((value) => Number(value.toFixed(2))))];
  const sorted = unique.sort((a, b) => a - b);

  if (sorted.length === 1) {
    return sorted[0];
  }

  if (keywordBonus) {
    return sorted[sorted.length - 1];
  }

  const lastLineCandidates = extractAmountCandidates(text.split("\n").slice(-4).join(" "));
  if (lastLineCandidates.length) {
    return Math.max(...lastLineCandidates);
  }

  return sorted[sorted.length - 1];
}

function inferMerchant(lines) {
  if (!lines.length) {
    return "";
  }

  const stopWords = new Set([
    "total",
    "importe",
    "change",
    "iva",
    "tax",
    "cash",
    "card",
    "credit",
    "debit",
    "ticket",
    "receipt",
  ]);

  const candidate = lines.find((line) => {
    const lower = line.toLowerCase();
    return lower.length > 2 && !stopWords.has(lower);
  });

  return candidate || lines[0] || "";
}

function inferDate(text) {
  const datePatterns = [
    /\b(\d{4})[-/](\d{2})[-/](\d{2})\b/,
    /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/,
    /\b(\d{2})[-/](\d{2})[-/](\d{2})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (!match) continue;

    if (pattern === datePatterns[0]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    if (pattern === datePatterns[1]) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }

    if (pattern === datePatterns[2]) {
      const year = Number(match[3]) + 2000;
      return `${year}-${match[2]}-${match[1]}`;
    }
  }

  return "";
}

function applyTicketExtractionToForm() {
  if (!ticketState.amount) {
    setTicketError("Scan a ticket first and detect a valid amount.");
    return;
  }

  if (document.getElementById("amount")) {
    document.getElementById("amount").value = ticketState.amount.toFixed(2);
  }

  if (document.getElementById("description")) {
    document.getElementById("description").value = ticketState.merchant || "Receipt expense";
  }

  if (document.getElementById("date") && ticketState.date) {
    document.getElementById("date").value = ticketState.date;
  }

  if (expenseFormStatus) {
    expenseFormStatus.textContent = "Ticket data applied. Review before saving.";
    expenseFormStatus.classList.remove("form-status--error");
  }

  setTicketStatus("Ticket data copied into the expense form.");
}

function clearTicketScanner() {
  if (ticketState.previewUrl) {
    URL.revokeObjectURL(ticketState.previewUrl);
  }

  ticketState = {
    file: null,
    previewUrl: "",
    text: "",
    amount: null,
    merchant: "",
    date: "",
    isProcessing: false,
    error: "",
    confidence: null,
  };

  if (ticketImageInput) {
    ticketImageInput.value = "";
  }

  if (ticketPreview) {
    ticketPreview.removeAttribute("src");
  }

  if (ticketPreviewWrap) {
    ticketPreviewWrap.classList.add("is-hidden");
  }

  resetTicketResult(true);
  setTicketStatus("No image selected yet.");
}

function resetTicketResult(clearPreview = false) {
  ticketState.text = "";
  ticketState.amount = null;
  ticketState.merchant = "";
  ticketState.date = "";
  ticketState.error = "";
  ticketState.confidence = null;

  if (clearPreview) {
    ticketState.previewUrl = "";
  }

  updateTicketResult();

  if (ticketApplyButton) {
    ticketApplyButton.classList.add("is-hidden");
  }
}

function updateTicketResult() {
  if (ticketAmountResult) {
    ticketAmountResult.textContent = ticketState.amount ? `€${ticketState.amount.toFixed(2)}` : "-";
  }

  if (ticketMerchantResult) {
    ticketMerchantResult.textContent = ticketState.merchant || "-";
  }

  if (ticketDateResult) {
    ticketDateResult.textContent = ticketState.date || "-";
  }

  if (ticketConfidenceResult) {
    ticketConfidenceResult.textContent = Number.isFinite(ticketState.confidence)
      ? `${Math.round(ticketState.confidence * 100)}%`
      : "-";
  }
}

function setTicketStatus(message) {
  if (ticketStatus) {
    ticketStatus.textContent = message;
    ticketStatus.classList.remove("ticket-scanner__status--error");
  }
}

function setTicketError(message) {
  ticketState.error = message;
  ticketState.amount = null;
  ticketState.merchant = "";
  ticketState.date = "";
  ticketState.confidence = null;
  updateTicketResult();
  if (ticketStatus) {
    ticketStatus.textContent = message;
    ticketStatus.classList.add("ticket-scanner__status--error");
  }
  if (ticketApplyButton) {
    ticketApplyButton.classList.add("is-hidden");
  }
}

function setTicketActionLoading(isLoading) {
  if (ticketScanButton) {
    ticketScanButton.disabled = isLoading;
    ticketScanButton.textContent = isLoading ? "Scanning..." : "Extract amount";
  }
}

function normalizeDateString(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

async function fetchMonthlySummary(month) {
  const response = await fetch(`/api/expenses/summary?month=${month}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load summary for ${month}`);
  }

  const data = await response.json();

  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (data.totals && typeof data.totals === "object") {
      return { month: data.month || month, totals: data.totals };
    }

    if (Array.isArray(data.expenses)) {
      const totals = data.expenses.reduce((acc, expense) => {
        const category = expense.category || "other";
        acc[category] = Number(acc[category] || 0) + Number(expense.amount || 0);
        return acc;
      }, {});

      return { month: data.month || month, totals };
    }
  }

  return { month, totals: {} };
}

async function applyFilters() {
  filters = {
    search: filterSearch.value.trim(),
    category: filterCategory.value,
    dateFrom: filterFrom.value,
    dateTo: filterTo.value,
    sort: filterSort.value,
  };

  try {
    await loadExpensesList();
    renderExpenses(expenses);
    renderMonthlyHighlight(expenses);
    await refreshDashboard();
  } catch (error) {
    console.error("Failed to apply filters:", error);
  }
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

async function exportMonthlyReportPdf() {
  const activeUser = await getActiveUser();
  const activeSession = await getActiveSession();

  if (!activeUser || !activeSession?.access_token) {
    if (reportSubtitle) {
      reportSubtitle.textContent = "Sign in to export your monthly PDF.";
    }
    return;
  }

  if (reportPdfButton) {
    reportPdfButton.disabled = true;
    reportPdfButton.textContent = "Preparing PDF...";
  }

  if (reportSubtitle) {
    reportSubtitle.textContent = "Preparing PDF...";
  }

  try {
    const url = new URL("/api/reports/monthly.pdf", window.location.origin);
    url.searchParams.set("month", selectedMonth);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${activeSession.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || "Could not generate PDF.");
    }

    const pdfBlob = await response.blob();
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const filename = `gastobot-report-${selectedMonth}.pdf`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    if (reportSubtitle) {
      reportSubtitle.textContent = error.message || "Could not generate PDF.";
    }
  } finally {
    if (reportPdfButton) {
      reportPdfButton.disabled = false;
      reportPdfButton.textContent = "Export PDF";
    }
  }
}

async function renderKpis() {
  const month = selectedMonth;
  const summaryResponse = await fetch(`/api/expenses/summary?month=${month}`);

  if (!summaryResponse.ok) {
    const errorData = await summaryResponse.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load summary for ${month}`);
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
  await renderBudget();
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load charts for ${month}`);
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
      maintainAspectRatio: false,
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
    const errorData = await evolutionResponse.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load evolution for ${year}`);
    return;
  }

  const evolutionData = await evolutionResponse.json();
  const evolutionLabels = Array.isArray(evolutionData.labels) ? evolutionData.labels : [];
  const evolutionTotals = Array.isArray(evolutionData.totals) ? evolutionData.totals : [];
  if (monthlyEvolutionTitle) {
    monthlyEvolutionTitle.textContent = `Evolución mensual · ${year}`;
  }

  if (monthlyEvolutionChart) {
    monthlyEvolutionChart.destroy();
  }

  monthlyEvolutionChart = new Chart(monthlyEvolutionChartCanvas, {
    type: "line",
    data: {
      labels: evolutionLabels.map(formatMonthName),
      datasets: [
        {
          label: `Evolución ${year}`,
          data: evolutionTotals,
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
    const errorData = await summaryResponse.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load report for ${month}`);
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
    const errorData = await evolutionResponse.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to load report trend for ${month.slice(0, 4)}`);
    return;
  }

  const evolutionData = await evolutionResponse.json();
  const evolutionLabels = Array.isArray(evolutionData.labels) ? evolutionData.labels : [];
  const evolutionTotals = Array.isArray(evolutionData.totals) ? evolutionData.totals : [];
  reportTrendChart = new Chart(reportTrendChartCanvas, {
    type: "line",
    data: {
      labels: evolutionLabels.map(formatMonthLabel),
      datasets: [
        {
          label: "Tendencia mensual",
          data: evolutionTotals,
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

function formatMonthName(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  const formattedMonth = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);
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

function getCurrentTheme() {
  return document.documentElement.dataset.theme || "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures.
  }
}

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
  } catch {
    return null;
  }
}

async function getActiveUser() {
  if (currentUser) {
    return currentUser;
  }

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  currentUser = data?.user || null;
  return currentUser;
}

async function getActiveSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data?.session || null;
}

function syncThemeToggle() {
  const theme = getCurrentTheme();
  const isDark = theme === "dark";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
  }

  if (themeToggleIcon) {
    themeToggleIcon.textContent = isDark ? "☀️" : "🌙";
  }

  if (themeToggleLabel) {
    themeToggleLabel.textContent = isDark ? "Light" : "Dark";
  }
}

async function syncAuthState() {
  if (!supabase) {
    setAuthStatus(
      supabaseConfigured
        ? "Supabase client not configured."
        : "Replace the Supabase placeholders in index.html with your project URL and anon key.",
      true
    );
    setAuthSessionLabel(null);
    openAuthPanel();
    return;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    setAuthStatus(error.message || "Failed to read session.", true);
    setAuthSessionLabel(null);
    openAuthPanel();
    return;
  }

  setAuthSessionLabel(data?.session?.user || null);
  currentUser = data?.session?.user || null;
  setAuthStatus(
    currentUser
      ? "Signed in and ready."
      : "Sign in or create an account to start using your personal workspace.",
    false
  );
  if (currentUser) {
    closeAuthPanel();
  } else {
    openAuthPanel();
  }

  await loadBudgetForSelectedMonth();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    setAuthSessionLabel(session?.user || null);
    if (session?.user) {
      closeAuthPanel();
    } else {
      openAuthPanel();
    }
    loadBudgetForSelectedMonth().catch((error) => console.error(error));
  });
}

async function handleSignUp() {
  if (!supabase) {
    setAuthStatus(
      supabaseConfigured
        ? "Supabase client not configured."
        : "Replace the Supabase placeholders in index.html with your project URL and anon key.",
      true
    );
    return;
  }

  const email = authEmail?.value.trim();
  const password = authPassword?.value;

  if (!email || !password) {
    setAuthStatus("Enter email and password.", true);
    return;
  }

  setAuthStatus("Creating account...", false);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setAuthStatus(error.message || "Could not create account.", true);
    return;
  }

  if (data?.session) {
    setAuthStatus("Account created and signed in.", false);
  } else {
    setAuthStatus("Account created. Check your email to confirm sign in.", false);
  }

  await syncAuthState();
}

async function handleSignIn() {
  if (!supabase) {
    setAuthStatus(
      supabaseConfigured
        ? "Supabase client not configured."
        : "Replace the Supabase placeholders in index.html with your project URL and anon key.",
      true
    );
    return;
  }

  const email = authEmail?.value.trim();
  const password = authPassword?.value;

  if (!email || !password) {
    setAuthStatus("Enter email and password.", true);
    return;
  }

  setAuthStatus("Signing in...", false);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setAuthStatus(error.message || "Could not sign in.", true);
    return;
  }

  setAuthStatus(data?.user ? "Signed in successfully." : "Signed in.", false);
  currentUser = data?.user || null;
  await syncAuthState();
}

async function handleSignOut() {
  if (!supabase) {
    setAuthStatus(
      supabaseConfigured
        ? "Supabase client not configured."
        : "Replace the Supabase placeholders in index.html with your project URL and anon key.",
      true
    );
    return;
  }

  setAuthStatus("Signing out...", false);

  const { error } = await supabase.auth.signOut();

  if (error) {
    setAuthStatus(error.message || "Could not sign out.", true);
    return;
  }

  setAuthStatus("Signed out.", false);
  setAuthSessionLabel(null);
  currentUser = null;
  budgetState = {
    month: selectedMonth,
    limitAmount: null,
    error: null,
  };
  await renderBudget();
  openAuthPanel();
}

function setAuthStatus(message, isError = false) {
  if (!authStatus) return;

  authStatus.textContent = message;
  authStatus.classList.toggle("form-status--error", isError);
}

function setAuthSessionLabel(user) {
  if (!authSessionState) return;

  if (!user) {
    authSessionState.textContent = "Not signed in";
    authSessionState.title = "Open account access";
    return;
  }

  authSessionState.textContent = user.email ? `Signed in as ${user.email}` : "Signed in";
  authSessionState.title = user.email || "Signed in";
}

function openAuthPanel() {
  authPanel?.classList.remove("is-collapsed");
}

function closeAuthPanel() {
  authPanel?.classList.add("is-collapsed");
}

function toggleAuthPanel() {
  authPanel?.classList.toggle("is-collapsed");
}

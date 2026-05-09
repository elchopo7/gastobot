const supabase = require("./supabase");

function mapExpenseRow(row) {
  return row
    ? {
        id: row.id,
        amount: Number(row.amount),
        category: row.category,
        description: row.description,
        date: row.date,
        created_at: row.created_at,
      }
    : null;
}

function normalizeRows(rows = []) {
  return rows.map(mapExpenseRow).filter(Boolean);
}

function getMonthBounds(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const endDate = new Date(Date.UTC(year, monthNumber, 0));
  const end = endDate.toISOString().slice(0, 10);

  return { start, end };
}

async function findAllExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, category, description, date, created_at")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeRows(data);
}

async function findExpensesByMonth(month) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, category, description, date, created_at")
    .gte("date", `${month}-01`)
    .lte("date", getMonthBounds(month).end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeRows(data);
}

async function findExpensesByMonthAndUser(month, userId) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, category, description, date, created_at")
    .eq("user_id", userId)
    .gte("date", `${month}-01`)
    .lte("date", getMonthBounds(month).end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeRows(data);
}

async function getSummaryByMonth(month) {
  const expenses = await findExpensesByMonth(month);
  const totalsByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return Object.entries(totalsByCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}

async function getSummaryByMonthAndUser(month, userId) {
  const expenses = await findExpensesByMonthAndUser(month, userId);
  const totalsByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return Object.entries(totalsByCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}

async function getEvolutionByYear(year) {
  const { data, error } = await supabase
    .from("expenses")
    .select("date, amount")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`);

  if (error) {
    throw error;
  }

  const totalsByMonth = (data || []).reduce((acc, expense) => {
    const month = String(expense.date).slice(0, 7);
    acc[month] = (acc[month] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return Object.entries(totalsByMonth)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

async function getAllMonthlyTotals() {
  const { data, error } = await supabase.from("expenses").select("date, amount");

  if (error) {
    throw error;
  }

  const totalsByMonth = (data || []).reduce((acc, expense) => {
    const month = String(expense.date).slice(0, 7);
    acc[month] = (acc[month] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return Object.entries(totalsByMonth)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

async function findExpenseById(id) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, category, description, date, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapExpenseRow(data);
}

async function addExpense(expense) {
  const { data, error } = await supabase
    .from("expenses")
    .insert([expense])
    .select("id, amount, category, description, date, created_at")
    .single();

  if (error) {
    throw new Error(error.message || error.details || "Supabase insert failed");
  }

  return mapExpenseRow(data);
}

async function editExpense(id, expense) {
  const { data, error } = await supabase
    .from("expenses")
    .update(expense)
    .eq("id", id)
    .select("id, amount, category, description, date, created_at")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || error.details || "Supabase update failed");
  }

  return mapExpenseRow(data);
}

async function removeExpense(id) {
  const expense = await findExpenseById(id);

  if (!expense) {
    return null;
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(error.message || error.details || "Supabase delete failed");
  }

  return expense;
}

async function getComparisonTotals(month) {
  const currentExpenses = await findExpensesByMonth(month);
  const [year, monthNumber] = month.split("-").map(Number);
  const previousDate = new Date(Date.UTC(year, monthNumber - 2, 1));
  const previousMonth = previousDate.toISOString().slice(0, 7);
  const previousExpenses = await findExpensesByMonth(previousMonth);

  const sum = (rows) => rows.reduce((total, expense) => total + Number(expense.amount || 0), 0);

  return {
    currentMonth: month,
    currentTotal: sum(currentExpenses),
    previousMonth,
    previousTotal: sum(previousExpenses),
  };
}

module.exports = {
  findAllExpenses,
  findExpensesByMonth,
  findExpensesByMonthAndUser,
  getSummaryByMonth,
  getSummaryByMonthAndUser,
  getEvolutionByYear,
  getAllMonthlyTotals,
  findExpenseById,
  addExpense,
  editExpense,
  removeExpense,
  getComparisonTotals,
};

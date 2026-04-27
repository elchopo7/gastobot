const db = require("./setup");

const getExpenses = db.prepare(`
  SELECT id, amount, category, description, date, created_at
  FROM expenses
  ORDER BY date DESC, created_at DESC, id DESC
`);

const getExpensesByMonth = db.prepare(`
  SELECT id, amount, category, description, date, created_at
  FROM expenses
  WHERE date LIKE ?
  ORDER BY date DESC, created_at DESC, id DESC
`);

const getExpenseSummaryByMonth = db.prepare(`
  SELECT category, SUM(amount) AS total
  FROM expenses
  WHERE date LIKE ?
  GROUP BY category
  ORDER BY total DESC, category ASC
`);

const getMonthlyEvolution = db.prepare(`
  SELECT substr(date, 1, 7) AS month, SUM(amount) AS total
  FROM expenses
  WHERE date LIKE ?
  GROUP BY month
  ORDER BY month ASC
`);

const getMonthlyTotals = db.prepare(`
  SELECT substr(date, 1, 7) AS month, SUM(amount) AS total
  FROM expenses
  GROUP BY month
  ORDER BY month ASC
`);

const getExpenseById = db.prepare(`
  SELECT id, amount, category, description, date, created_at
  FROM expenses
  WHERE id = ?
`);

const createExpense = db.prepare(`
  INSERT INTO expenses (amount, category, description, date)
  VALUES (?, ?, ?, ?)
`);

const updateExpense = db.prepare(`
  UPDATE expenses
  SET amount = ?, category = ?, description = ?, date = ?
  WHERE id = ?
`);

const deleteExpense = db.prepare(`
  DELETE FROM expenses
  WHERE id = ?
`);

function findAllExpenses() {
  return getExpenses.all();
}

function findExpensesByMonth(month) {
  return getExpensesByMonth.all(`${month}%`);
}

function getSummaryByMonth(month) {
  return getExpenseSummaryByMonth.all(`${month}%`);
}

function getEvolutionByYear(year) {
  return getMonthlyEvolution.all(`${year}-%`);
}

function getAllMonthlyTotals() {
  return getMonthlyTotals.all();
}

function findExpenseById(id) {
  return getExpenseById.get(id);
}

function addExpense(expense) {
  const result = createExpense.run(
    expense.amount,
    expense.category,
    expense.description,
    expense.date
  );

  return findExpenseById(result.lastInsertRowid);
}

function editExpense(id, expense) {
  const result = updateExpense.run(
    expense.amount,
    expense.category,
    expense.description,
    expense.date,
    id
  );

  if (result.changes === 0) {
    return null;
  }

  return findExpenseById(id);
}

function removeExpense(id) {
  const expense = findExpenseById(id);

  if (!expense) {
    return null;
  }

  deleteExpense.run(id);
  return expense;
}

module.exports = {
  findAllExpenses,
  findExpensesByMonth,
  getSummaryByMonth,
  getEvolutionByYear,
  getAllMonthlyTotals,
  findExpenseById,
  addExpense,
  editExpense,
  removeExpense,
};

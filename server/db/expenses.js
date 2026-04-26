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
  findExpenseById,
  addExpense,
  editExpense,
  removeExpense,
};

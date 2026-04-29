const { addExpense, findAllExpenses } = require("./expenses");

const seedExpenses = [
  {
    amount: 24.5,
    category: "food",
    description: "Supermarket",
    date: "2026-04-22",
  },
  {
    amount: 8.2,
    category: "transport",
    description: "Metro ticket",
    date: "2026-04-21",
  },
  {
    amount: 32.0,
    category: "entertainment",
    description: "Cinema",
    date: "2026-03-28",
  },
];

async function seedDatabase() {
  const existingExpenses = await findAllExpenses();

  if (existingExpenses.length > 0) {
    return;
  }

  for (const expense of seedExpenses) {
    await addExpense(expense);
  }
}

module.exports = {
  seedDatabase,
};

const STORAGE_KEY = "gastobot-expenses";

const form = document.getElementById("expense-form");
const expensesList = document.querySelector(".expenses-list ul");
const monthlyAmount = document.querySelector(".summary-card__amount");

let expenses = loadExpenses();

renderExpenses(expenses);
renderMonthlyHighlight(expenses);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  const newExpense = {
    id: Date.now(),
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    description: formData.get("description") || "No description",
    date: formData.get("date"),
  };

  expenses.push(newExpense);
  saveExpenses(expenses);

  renderExpenses(expenses);
  renderMonthlyHighlight(expenses);

  form.reset();
});

function loadExpenses() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses(expenses);
  renderExpenses(expenses);
  renderMonthlyHighlight(expenses);
}

function renderExpenses(expenses) {
  expensesList.innerHTML = "";

  expenses.forEach((expense) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="card">
        <span class="expense-icon" aria-hidden="true">🥳</span>
        <p>${expense.description}</p>
        <h4>€${expense.amount.toFixed(2)}</h4>
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
  const total = expenses.reduce((sum, expense) => {
    return sum + expense.amount;
  }, 0);

  monthlyAmount.textContent = `€${total.toFixed(2)}`;
}

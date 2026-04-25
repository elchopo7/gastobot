const form = document.getElementById("expense-form");
const expensesList = document.querySelector(".expenses-list ul");
const monthlyAmount = document.querySelector(".summary-card__amount");

let expenses = [];

(async function init() {
  await loadExpenses();
  renderExpenses(expenses);
  renderMonthlyHighlight(expenses);
})();

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

  await loadExpenses();
  renderExpenses(expenses);
  renderMonthlyHighlight(expenses);

  form.reset();
});

async function loadExpenses() {
  const response = await fetch("/api/expenses");
  expenses = await response.json();
}

async function deleteExpense(id) {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) return;

  await loadExpenses();
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
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  monthlyAmount.textContent = `€${total.toFixed(2)}`;
}

const express = require("express");
const path = require("path");
const expensesRouter = require("./routes/expenses");
const { seedDatabase } = require("./db/seed");

const app = express();
const PORT = process.env.PORT || 3000;

seedDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/expenses", expensesRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require("express");
const path = require("path");
const expensesRouter = require("./routes/expenses");
const aiRouter = require("./routes/ai");
const { seedDatabase } = require("./db/seed");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

seedDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  "/vendor",
  express.static(path.join(__dirname, "../node_modules/chart.js/dist"))
);
app.use("/api/expenses", expensesRouter);
app.use("/api/ai", aiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

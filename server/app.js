require("dotenv").config();
const express = require("express");
const path = require("path");
const expensesRouter = require("./routes/expenses");
const aiRouter = require("./routes/ai");
const { seedDatabase } = require("./db/seed");

const app = express();

seedDatabase().catch((error) => {
  console.error("Failed to seed expenses:", error.message || error);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  "/vendor",
  express.static(path.join(__dirname, "../node_modules/chart.js/dist"))
);
app.use("/api/expenses", expensesRouter);
app.use("/api/ai", aiRouter);

module.exports = app;

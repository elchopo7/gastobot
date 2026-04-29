const { Telegraf, Markup } = require("telegraf");

const categoryOptions = [
  { label: "Comida", value: "food" },
  { label: "Transporte", value: "transport" },
  { label: "Ocio", value: "entertainment" },
  { label: "Hogar", value: "housing" },
  { label: "Salud", value: "health" },
  { label: "Educación", value: "education" },
  { label: "Compras", value: "shopping" },
  { label: "Otro", value: "other" },
];

const categoryAliases = {
  comida: "food",
  food: "food",
  transporte: "transport",
  transport: "transport",
  ocio: "entertainment",
  entretenimiento: "entertainment",
  entertainment: "entertainment",
  hogar: "housing",
  housing: "housing",
  casa: "housing",
  salud: "health",
  health: "health",
  educacion: "education",
  educación: "education",
  education: "education",
  compras: "shopping",
  shopping: "shopping",
  otro: "other",
  other: "other",
};

function createTelegramBot({ token, addExpense, findAllExpenses, getSummaryByMonth }) {
  const bot = new Telegraf(token);
  const pendingExpenses = new Map();

  bot.start((ctx) => {
    ctx.reply(
      [
        "Bienvenido a GastoBot.",
        "",
        "Puedes enviar gastos así:",
        "pizza 12.50 comida",
        "metro 2.40 transporte",
        "",
        "Si no indicas categoría, te la preguntaré.",
        "",
        "Comandos:",
        "/help",
        "/reporte",
        "/ultimos",
      ].join("\n")
    );
  });

  bot.help((ctx) => {
    ctx.reply(
      [
        "Comandos disponibles:",
        "/start - bienvenida e instrucciones",
        "/help - ver esta ayuda",
        "/reporte - resumen del mes actual",
        "/ultimos - últimos 5 gastos",
        "",
        "También puedes enviar gastos con este formato:",
        "descripcion importe categoria",
        "Ejemplo: pizza 12.50 comida",
      ].join("\n")
    );
  });

  bot.command("reporte", async (ctx) => {
    const month = new Date().toISOString().slice(0, 7);
    const summary = await getSummaryByMonth(month);
    const total = summary.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const lines = [`Reporte de ${formatMonthLabel(month)}`, `Total: €${total.toFixed(2)}`];

    if (summary.length) {
      lines.push("");
      lines.push("Por categoría:");
      summary.forEach((item) => {
        lines.push(`- ${formatCategoryLabel(item.category)}: €${Number(item.total || 0).toFixed(2)}`);
      });
    }

    ctx.reply(lines.join("\n"));
  });

  bot.hears(/^\/(ultimos|últimos)$/i, async (ctx) => {
    const recent = (await findAllExpenses()).slice(0, 5);

    if (!recent.length) {
      ctx.reply("Todavía no hay gastos registrados.");
      return;
    }

    const lines = ["Últimos 5 gastos:"];
    recent.forEach((expense) => {
      lines.push(
        `- ${expense.description} · €${Number(expense.amount).toFixed(2)} · ${formatCategoryLabel(expense.category)} · ${formatFullDate(expense.date)}`
      );
    });

    ctx.reply(lines.join("\n"));
  });

  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();

    if (text.startsWith("/")) {
      return;
    }

    const parsed = parseExpenseText(text);

    if (!parsed) {
      ctx.reply("No he entendido el gasto. Usa: descripcion importe categoria");
      return;
    }

    if (!parsed.category) {
      pendingExpenses.set(ctx.chat.id, parsed);
      await ctx.reply(
        "¿Qué categoría tiene este gasto?",
        Markup.inlineKeyboard(
          categoryOptions.map((option) =>
            Markup.button.callback(option.label, `category:${option.value}`)
          ),
          { columns: 2 }
        )
      );
      return;
    }

    const createdExpense = await addExpense({
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      date: new Date().toISOString().slice(0, 10),
    });

    ctx.reply(
      [
        "Gasto guardado.",
        `- ${createdExpense.description}`,
        `- €${Number(createdExpense.amount).toFixed(2)}`,
        `- ${formatCategoryLabel(createdExpense.category)}`,
      ].join("\n")
    );
  });

  bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery.data || "";
    if (!data.startsWith("category:")) {
      return ctx.answerCbQuery();
    }

    const category = data.split(":")[1];
    const pending = pendingExpenses.get(ctx.chat.id);

    if (!pending) {
      await ctx.answerCbQuery("No pending expense found.");
      return;
    }

    pendingExpenses.delete(ctx.chat.id);

    const createdExpense = await addExpense({
      amount: pending.amount,
      category,
      description: pending.description,
      date: new Date().toISOString().slice(0, 10),
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      [
        "Categoría seleccionada y gasto guardado.",
        `- ${createdExpense.description}`,
        `- €${Number(createdExpense.amount).toFixed(2)}`,
        `- ${formatCategoryLabel(createdExpense.category)}`,
      ].join("\n")
    );
  });

  return bot;
}

function parseExpenseText(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const amountIndex = tokens.findIndex((token) => isAmountToken(token));

  if (amountIndex === -1) {
    return null;
  }

  const amount = Number(tokens[amountIndex].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const description = tokens.slice(0, amountIndex).join(" ").trim();
  const categoryToken = tokens.slice(amountIndex + 1).join(" ").trim().toLowerCase();
  const category = categoryAliases[categoryToken] || null;

  if (!description) {
    return null;
  }

  return { description, amount, category };
}

function isAmountToken(token) {
  return /^\d+(?:[.,]\d{1,2})?$/.test(token);
}

function formatCategoryLabel(category) {
  const option = categoryOptions.find((item) => item.value === category);
  return option ? option.label : category;
}

function formatFullDate(dateValue) {
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

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  const formattedMonth = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return `${formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)} ${year}`;
}

module.exports = { createTelegramBot };

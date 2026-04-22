# GastoBot — Plan de Desarrollo

## Descripción del proyecto

Aplicación para registrar y analizar gastos mensuales.

El producto evoluciona en dos etapas:

1. Web mobile-first para registro y visualización de gastos
2. Bot de Telegram para registro rápido y consultas (p. ej., "cuánto gasté en comida este mes")

---

## Stack tecnológico

* Backend: Node.js + Express
* Frontend: HTML + CSS + JavaScript (vanilla)
* Gráficos: Chart.js
* Base de datos: SQLite (better-sqlite3) o PostgreSQL (Supabase)
* Bot: telegraf.js
* Deploy: Vercel (frontend + API serverless)
* AI: Claude / ChatGPT como asistente de desarrollo

---

## Estado actual

* Milestone actual: M1 - UI Mobile
* Última actualización: 2026-04-22
* Siguiente review: 2026-04-25

---

## Milestone actual: M1 - UI Mobile

### Objetivo

Implementar una interfaz web mobile-first funcional para registrar y visualizar gastos.

### Tareas

* [ ] Estructura HTML básica
* [ ] Estilos CSS mobile-first
* [ ] Formulario para añadir gasto
* [ ] Lista de gastos
* [ ] Filtros por categoría
* [ ] Persistencia con localStorage

### Decisiones

* CSS vanilla sin frameworks
* Persistencia temporal en localStorage
* Enfoque mobile-first

### Dudas / Bloqueos

* Selector de categorías: dropdown vs chips
* Estructura de datos en localStorage que facilite migración a backend

### Aprendizajes

* Diferencias entre CSS Grid y Flexbox
* Enfoque mobile-first con media queries (min-width)

---

## Milestone M2 - Backend API

### Objetivo

Implementar una API REST con Express para la gestión de gastos.

### Tareas

* Configuración del servidor Express
* Estructura por capas (routes, controllers, services)
* Endpoints CRUD de gastos:

  * POST /expenses
  * GET /expenses
  * GET /expenses/:id
  * DELETE /expenses/:id
* Validación de datos
* Middleware de errores

### Decisiones pendientes

* SQLite vs Supabase

---

## Milestone M3 - Base de datos

### Objetivo

Persistir datos en base de datos (reemplazar localStorage).

### Tareas

* Definir modelo de gasto:

  * amount
  * category
  * date
  * note
* Integración con la base de datos
* Migración desde localStorage

---

## Milestone M4 - Visualización

### Objetivo

Incorporar analítica básica de gastos.

### Tareas

* Integración de Chart.js
* Visualización por categorías
* Resumen mensual
* Filtros por fecha

---

## Milestone M5 - Bot de Telegram

### Objetivo

Permitir registro y consulta de gastos desde Telegram.

### Tareas

* Configuración del bot con telegraf.js
* Comandos para añadir gasto
* Comandos de consulta:

  * gastos este mes
  * gastos por categoría
* Integración con la API

---

## Milestone M6 - Deploy

### Objetivo

Publicar la aplicación.

### Tareas

* Deploy en Vercel
* Configuración de variables de entorno
* Validación en entorno de producción

---

## Flujo de trabajo con Git

* main: rama estable
* feature/*: desarrollo de funcionalidades
* Convención de commits:

  * feat: nueva funcionalidad
  * fix: corrección de errores
  * chore: tareas técnicas

---

## Futuras mejoras

* Autenticación de usuarios
* Soporte multiusuario
* Categorías personalizadas
* Exportación a CSV
* Notificaciones
* Clasificación automática de gastos mediante IA

---

## Historial

### M0 - Setup (completado)

* Repositorio inicializado
* Estructura base creada
* Herramientas configuradas

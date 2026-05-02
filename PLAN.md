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

* [X] Estructura HTML básica
* [X] Estilos CSS mobile-first
* [X] Formulario para añadir gasto
* [X] Lista de gastos
* [X] Filtros por categoría
* [X] Total del mes visible
* [X] Persistencia con localStorage

### Decisiones

* CSS vanilla sin frameworks
* Persistencia temporal en localStorage
* Enfoque mobile-first

### Dudas / Bloqueos

* Estructura de datos en localStorage que facilite migración a backend

### Aprendizajes

* Diferencias entre CSS Grid y Flexbox
* Enfoque mobile-first con media queries (min-width)
* LocalStorage setup

---

## Milestone M2 - Backend API

### Objetivo

Implementar una API REST con Express para la gestión de gastos.

### Tareas

* [X] Configuración del servidor Express
* [X] Endpoints CRUD de gastos:
* [X] POST /expenses
* [X] GET /expenses
* [X] GET /expenses/:id
* [X] DELETE /expenses/:id
* [X] Validación de datos

### Decisiones pendientes

* SQLite vs Supabase

---

## Milestone M3 - Base de datos

### Objetivo

Persistir datos en base de datos (reemplazar localStorage).
* Se ha decidido SQLite por su fácil integración y más rápida configuración, principalmente porque al principio
no existirán distintos usuarios y así estará todo en un sólo archivo. Además más adelante si es necesario se puede
migrar a Supabase.

### Tareas

* [X] Definir tabla de expenses: 
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
* [X] Integración con la base de datos
* [X] Migración desde localStorage
---

## Milestone M4 - Visualización

### Objetivo

Incorporar analítica básica de gastos.

### Tareas

* [X] Integración de Chart.js
* [X] Visualización por categorías
* [X] Resumen mensual
* [X] Filtros por fecha
* [X] Navegación entre distintas tabs
* [X] Vista de report mensual
* [X] Funcionalidad de exportar y compartir monthly report

---

## Milestone M5 - Bot de Telegram

### Objetivo

Permitir registro y consulta de gastos desde Telegram.

### Tareas

* [X] Configuración del bot con telegraf.js
* [X] Comandos para añadir gasto
* [X] Comandos de consulta:
* [X]   gastos este mes
* [X]   gastos por categoría
* [X] Integración con la API

---

## Milestone M6 - Deploy

### Objetivo

Publicar la aplicación.

### Tareas

* [X] Deploy en Vercel
* [X] Configuración de variables de entorno
* [X] Validación en entorno de producción
* [X] Bot de Telegram adaptado al entorno
* [X] Supabase vinculación total
* [X] Testing de added expenses desde el bot y la web

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

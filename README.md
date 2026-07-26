# Nexus

Your Digital Life, Unified.

Nexus is an offline-first Windows desktop app (Electron + React + TypeScript + Vite + Tailwind CSS) that brings personal finance, shopping, gaming, passwords, receipts, AI workflows, and scheduling together in one place — all data lives locally on your machine.

## Tech stack

- **Shell:** Electron
- **UI:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **State:** Zustand, with `persist` middleware (localStorage-backed, offline-first)
- **Routing:** React Router
- **AI features:** OpenAI API (`gpt-4o-mini`, `gpt-4o-search-preview`) and, for Nexus AI, a choice of OpenAI or Groq (`llama-3.3-70b-versatile`, via Groq's OpenAI-compatible endpoint) — all calls happen only from the Electron main process, so no API key ever reaches the renderer
- **Security:** AES-256-GCM + PBKDF2 (250k iterations) via the native Web Crypto API for the Password Vault

## Modules

### 📊 Dashboard
A cross-module home base, not just a Money summary: quick-action shortcuts (Add transaction, Add event, Add wishlist item, Ask Nexus AI), income/expense/savings/recurring-income/bills/debt stats, next 5 upcoming calendar events, last 5 transactions, your furthest-along savings goal, the currently-/most-recently-played game, your wishlist, and bills due.

### 💰 Money Manager
- **Overview** — at-a-glance stats: total balance, income/expenses this month, net savings, debt, unpaid bills, subscription cost, and recurring income.
- **Accounts** — banks, e-wallets, and cash accounts with live balances; auto-detected institution badges (BDO, BPI, GCash, Maya, and more) as you type a name; a hide/reveal eye icon per card; confirmation before deleting an account.
- **Transactions** — manual entry or AI-assisted receipt scanning (photo → auto-filled amount/store/category), linked to an account (auto-adjusts its balance) and optionally to a Receipt Vault entry.
- **Bills, Subscriptions, Debt, Recurring Income** — all linked to Accounts and Receipt Vault the same way transactions are; paying a bill, logging income, etc. creates a real transaction and updates the account balance.
- **Recurring Income** — supports PHP and USD income (e.g. salary from a US employer via Payoneer), with a live mid-market USD/PHP rate (via Frankfurter.dev), an adjustable margin to approximate Payoneer's spread, and a manual rate override. Supports weekly, biweekly, semi-monthly (two fixed cutoff days), monthly, and yearly frequencies, with editing.
- **Savings Goals** — track progress toward a target amount.
- **Exchange Rate** — dedicated view for the live/manual USD↔PHP conversion settings.

### 🧾 Receipt Vault
Store receipts (photo + extracted details), scanned automatically via AI vision OCR, or convert any receipt into a transaction by choosing an account.

### 🔐 Password Vault
AES-256-GCM encrypted credential storage, with AI-assisted bulk import (paste text, AI extracts structured credentials for you to review before saving).

### 🛍️ Shopping Hub
AI-powered price search across the web for a product, plus a wishlist.

### 🎮 Gaming Dashboard
Auto-detects installed games and shortcuts on your desktop (including Steam `.url` shortcuts), extracts their icons, launches them, and automatically tracks playtime by watching the game process until it exits.

### ✨ Nexus AI
A chat assistant that actually knows your data — not a lookup tool bolted onto the app, but built directly on top of it:
- Answers questions about your Money Manager, Calendar, Gaming, Receipt Vault, and Shopping wishlist data (never your Password Vault, by design). Per-message toggles let you control which of those domains get included in a given question.
- Switch between OpenAI and Groq from a header dropdown; replies stream in token-by-token.
- Can take action — create an account, log a transaction, add a calendar event, mark a bill paid, or add a wishlist item — but only ever after you approve a plain-language confirmation card. Nothing executes silently.
- Voice input via the browser's speech recognition, and a once-a-day, no-AI-call digest of bills/subscriptions due soon and today's events, posted automatically when you open the page.

### 📅 Calendar
- Add events with a title, time, category, recurrence (none/daily/weekly/monthly/yearly), and an optional reminder.
- Category-based color coding throughout (dots, badges, borders) and friendly relative dates (Today, Tomorrow, weekday names).
- Month, Week, and Day views.
- Bills, subscription renewals, debt due dates, and recurring-income paydays from Money Manager automatically appear as read-only entries.
- Desktop notifications fire ahead of an event's time based on its reminder setting.
- Edit or delete any event you created.

### 🧰 Dev Toolbox
Developer utility tools.

## Getting started

```bash
npm install
npm run electron:dev   # runs Vite + Electron together in dev mode with hot reload
```

To use the AI-powered features (receipt scanning, price search, credential import, Nexus AI), add API key(s) to a local `.env.local` file (gitignored):

```
OPENAI_API_KEY=sk-...
GROK_API_KEY=gsk_...   # optional — a Groq key, for the Groq option in Nexus AI
```

### Building a release

```bash
npm run electron:build
```

Produces a Windows installer (NSIS) and portable executable in `release/`.

## Project structure

```
electron/         Electron main process + preload script (IPC bridges)
src/
  components/      Shared UI components (Modal, Drawer, Select, Card, etc.)
  hooks/           Shared hooks (linked transactions, calendar event reminders)
  pages/           One folder per module (Money, Calendar, Vault, Shopping, Gaming, ...)
  store/           Zustand stores, persisted to localStorage
  types/           Shared TypeScript types
  utils/           Formatting, date/recurrence math, cross-module helpers
```

## Design principles

- **Offline-first** — all data is stored locally; the only network calls are optional (AI features and the live FX rate).
- **Cross-linked data** — money movements (transactions, bills, debts, subscriptions, income) stay in sync with account balances and the receipt vault instead of living in isolated silos.
- **Privacy by default** — the OpenAI API key and all AI calls happen in the Electron main process only; the Password Vault is encrypted at rest.

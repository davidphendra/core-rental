# LinkedIn Post — Core Rental

> Draft for the Core Rental demo product. Professional tone, markdown with
> icon bullets. Live demo + GitHub repo.

---

**Building "Core Rental" — a Bali workspace-rental demo with an AI designer that actually ships**

I've been building [Core Rental](https://github.com/davidphendra/core-rental) — a demo product for digital nomads and startups in Bali: design your perfect workspace on a visual canvas — desk, chair, monitors, plants, coffee machine — and "rent" it month-to-month. It's a frontend MVP with a mock checkout, but the engineering behind it is real. Code is open on GitHub: https://github.com/davidphendra/core-rental

**What's inside**

- 🖥️ **Next.js 16 + React 19 + TypeScript (strict)** — App Router, Turbopack, Tailwind v4, TanStack Query, deployed on Vercel
- 🛠️ **TDD throughout** — 277 unit tests, 34 Playwright E2E scenarios (including a real-LLM test), an 80% coverage gate on business logic, and a full preflight pipeline (lint → typecheck → unit → build → E2E → CI)
- 🔍 **Server-side filtering as the single authority** — `/api/products` owns all filtering (`?category`, `?q`, `?subCategory`), used by both the UI and the AI agent; client bundles are completely catalog-free

**The AI Workspace Designer — the journey**

- 🧠 **Tool-calling behavior**: users type _"fancy gaming workspace, max Rp 30 juta"_ and the agent discovers products by calling tools — exactly 7 parallel `searchCatalog` calls (one per product type) in its first message, then a single `finalizeDesign`. It never invents SKUs and never re-searches — the catalog API is its only data source
- ⚡ **Observing the LLM, not assuming**: tracing real model behavior exposed surprising costs — models narrate before calling tools (hundreds of tokens of wasted output), and a vague "don't search again" instruction led to redundant full re-sweeps. Fixing prompt behavior drove the flow from **57s to ~11s**
- 🧪 **Models differ wildly**: the same workflow ran 2–4 minutes on one local model and ~11s on another; each candidate model was verified against the real tool loop before adoption
- 🛡️ **Guardrails, layered**: input (deterministic budget extraction from "Rp 30 juta", rate limiting, provider gating), output (every SKU re-validated against the committed catalog — slot correctness, monitor caps, totals recomputed from real prices, budget ceiling), and a hard rule: _a hallucinated or over-budget design can never reach the builder_
- 🔒 **PII by design**: the first question wasn't "can we track prompts" but "what must never be logged." Prompt text is never stored, logged, or sent to the catalog — observability events carry facts only (`ai.request`: model, duration, tool-call count; `ai.design_applied`: SKUs, monitor count, total)
- 🔌 **Provider abstraction** — OpenAI, Anthropic, or OpenRouter via config, with a 503 gate until a provider is explicitly enabled

**What I learned**

- 💡 Moving filtering server-side eliminated an entire class of duplicated logic
- 🧪 A gated real-LLM E2E scenario is what makes AI features shippable — it runs when a local model is available, skips cleanly in CI
- 📦 Small, behavior-neutral refactors kept every commit green — boring and reliable beats clever
- 🔐 Treat the prompt as untrusted input and the model's output as untrusted too — validation is the product

**Live demo:** https://core-workspace-rental.vercel.app · **Code:** https://github.com/davidphendra/core-rental

_(It's a demo — no payments, mock confirmation flow. Product decisions live in the repo's decision records.)_

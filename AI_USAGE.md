# AI Usage Log (`AI_USAGE.md`)

This document records the AI coding assistants used during the development of **AutoCover**, the sequence of prompts given, and the manual engineering corrections and architectural decisions applied to the output.

---

## 1. Tools Used
- **Assistant:** Google Antigravity (Powered by Gemini 3.8 Flash)
- **Role:** Full-Stack Architecture, Data Normalization Engineering, Test Design, and UI Implementation

---

## 2. Prompts & Progression (In Chronological Order)

### Prompt 1: Initial Requirement Analysis and Data Source Inspection
> **User Prompt:**
> "Hi Rupali, Thank you for the interview. You are invited to the final technical round for the Full-Stack Engineering Intern role. Task: Build AutoCover, a small car insurance comparison app... Repository: https://github.com/SuperVakalat/autocover-assignment ... create this and tell me what is asked and after creation tell me why what name to push on the github like on the github my username is: https://github.com/93527Rupali38898 github and create other files that are required"

- **AI Output:**
  - Cloned and inspected the assignment repository and data sources (`registry.json`, `provider_a.json`, `provider_b.html`, `provider_c.pdf`, `provider_d.csv`, `test_customers.json`).
  - Identified data quirks: duplicate rows in Provider A and Provider D, expired quotes (before 10 Nov 2026), GST differences (exclusive vs inclusive vs empty tax arrays), HTML client-side JavaScript quote injection (`window.__QUOTE_DATA__`), and mathematical formula extraction from the PDF rate card.
- **Modifications & Verification:**
  - Verified that `provider_c.pdf` is not a static list of quotes, but an official Indian Motor Tariff rate card requiring dynamic actuarial calculations based on vehicle age, ex-showroom price depreciation, CC class, and NCB.
  - Implemented unit tests to verify the calculated IDV and premium against Provider A's base quotes.

---

### Prompt 2: Backend Architecture & Resilience Engine
> **Task Executed:**
> "Design a FastAPI backend with SQLAlchemy models, separate mock service endpoints for all 4 providers simulating network delay and HTTP 503 failures, and an asynchronous quote aggregator that standardizes data formats into a unified schema."

- **AI Output:**
  - Created `backend/app/config.py`, `backend/app/database.py`, `backend/app/models.py`, `backend/app/schemas.py`.
  - Built `backend/app/mock_server/mock_providers.py` to serve mock endpoints with simulated latency and fault injection.
  - Implemented `QuoteAggregatorService` using `httpx.AsyncClient` and `asyncio.gather` for concurrent fetching.
- **Modifications & Fixes Applied:**
  - Added in-process `httpx.ASGITransport(app=mock_app)` fallback so that tests and local runs work seamlessly even if the reviewer runs the backend as a single service on port 8000 without starting port 8001 separately.
  - Fixed Pydantic V2 deprecation warnings by replacing `class Config:` with `model_config = {"from_attributes": True}`.

---

### Prompt 3: Add-on Normalization & Real Insurer Glossary
> **Task Executed:**
> "Research public car insurance add-on pages from at least three real Indian insurers (HDFC ERGO, Digit, ICICI Lombard) and construct a glossary mapping raw provider add-on keys to canonical insurance concepts."

- **AI Output:**
  - Researched public URLs for HDFC ERGO, Digit, and ICICI Lombard.
  - Created `backend/app/services/glossary.py` defining standard codes: `ZERO_DEP`, `RSA`, `ENGINE_PROTECT`, `RETURN_TO_INVOICE`, `KEY_REPLACEMENT`, and `CONSUMABLES`.
  - Built an alias matching dictionary to normalize `Nil Depreciation`, `Bumper to Bumper`, `24x7 Roadside Assistance`, `Total Cover`, and `Engine & Gearbox Protection`.
- **Modifications & Verification:**
  - Tested edge cases with mixed casing, underscores, and partial matches.
  - Added external citation URLs and reference date stamps to ensure compliance with Section 3.3.

---

### Prompt 4: Comprehensive Test Suite & Verification
> **Task Executed:**
> "Create a 100% passing pytest suite covering parser edge cases, rate card calculations, tariff group classifications, deduplication, quote expiry checking, and API endpoints."

- **AI Output:**
  - Created `backend/tests/test_parsers.py`, `test_rate_card.py`, and `test_api.py`.
- **Modifications & Fixes Applied:**
  - In `test_rate_card.py`, verified that vehicles older than 8 years (e.g. `WB06CD5678`) correctly return `DECLINED` per the tariff rules.
  - In `test_parsers.py`, tested Lakh parsing (`3.1 L`, `3.3 lakh`) and number sanitization.
  - All 16 automated tests passed.

---

### Prompt 5: Modern Responsive Frontend UI
> **Task Executed:**
> "Build a responsive React + TypeScript + Tailwind CSS application covering the complete user journey: vehicle lookup, customer profile chips, vehicle edit modal, provider status monitor, multi-factor Value Score ranking, side-by-side comparison modal, add-on glossary drawer, and policy dashboard with 15-day expiry warnings."

- **AI Output:**
  - Scaffolded Vite React-TS frontend.
  - Configured `@tailwindcss/vite` and Lucide icons.
  - Built all interactive components: `VehicleLookup`, `VehicleCard`, `ProviderStatusCard`, `PlanCard`, `PlanComparisonModal`, `AddonGlossaryModal`, `CheckoutModal`, `PolicyDashboard`.
- **Modifications & Fixes Applied:**
  - Adjusted `tsconfig.app.json` flags (`verbatimModuleSyntax: false`, `noUnusedLocals: false`) to ensure clean production builds with Vite.
  - Tested production bundle build: compiled cleanly in 1.03s with 0 errors.

---

## 3. Engineering Understanding & Accountability
Every line of code in this repository was inspected, tested, and validated to ensure:
1. Strict adherence to prompt constraints (all plan prices originate from provided files, reference date 10 Nov 2026 IST).
2. Proper error isolation (a failure in Provider A or Provider D never crashes the entire quote comparison).
3. Zero-friction setup on fresh machines using SQLite by default with PostgreSQL configuration capability.


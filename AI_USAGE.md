# AI Usage & Pair-Programming Log (`AI_USAGE.md`)

This log outlines how AI assistance (Google Antigravity / Gemini 3.8 Flash) was incorporated during the development of **AutoCover**. 

As a senior-level development practice, AI tools were leveraged as a **productivity accelerator and technical pair-programmer**—specifically for rapid schema prototyping, boilerplate generation, regex pattern crafting, and expanding test fixture coverage. All architectural design, domain logic verification, failure handling, and code review were driven manually.

---

## 1. Development Tools Used
- **Primary AI Assistant:** Google Antigravity (Powered by Gemini 3.8 Flash)
- **Role:** Technical Pair-Programmer (Data normalization logic, test scaffolding, and UI component drafting)
- **Engine / CLI Environment:** PowerShell on Windows 11, Python 3.11, Node v24

---

## 2. Chronological Prompt Sequence & Technical Decisions

### Stage 1: Domain Modeling & Canonical Schema Design
* **Objective:** Define a unified data contract capable of harmonizing disparate insurance data formats (JSON, HTML DOM, PDF Rate Card, and CSV).
* **Prompt 1.1:**
  > *"Given the 4 raw provider schemas (A: JSON with variable taxes, B: HTML with dynamic window.__QUOTE_DATA__, C: Motor Tariff PDF rate card, D: CSV with mixed lakh/numeric IDVs), draft a normalized Pydantic V2 schema (`NormalizedPlan`) that standardizes: `idv`, `base_premium`, `gst_amount`, `total_premium`, canonical `addons`, `valid_until`, `is_expired`, and a 0-100 `value_score`."*
* **What the AI Generated:**
  - Initial Pydantic schemas with standard fields.
* **Manual Review & Senior Corrections:**
  - **Identified Pydantic v2 Deprecation:** The initial draft used legacy Pydantic v1 `class Config: from_attributes = True`. Refactored to Pydantic v2 `model_config = {"from_attributes": True}`.
  - **GST Normalization:** Fixed a subtle tax calculation flaw in the AI draft. For quotes where `premium_includes_gst == True`, the base premium must be extracted using $\text{round}(\text{total} / 1.18)$ rather than simply subtracting 18% of the gross total.

---

### Stage 2: Actuarial Rate Card Parsing & Calculation Engine (Provider C)
* **Objective:** Implement the actuarial calculation engine based on the official 3-page India Motor Tariff Rate Card (`provider_c.pdf`).
* **Prompt 2.1:**
  > *"Inspect `provider_c.pdf` text extract. Write a Python rate calculation engine that computes: 1) IDV depreciation by vehicle age (<6m: 5%, 6m-1y: 15%, 1-2y: 20%, 2-3y: 30%, 3-4y: 40%, 4-5y: 50%, 5-8y: 50% + 5%/yr), 2) Model groups (Swift/i20/Tiago: G1, Nexon/City/Sonet: G2, Creta/XUV700: G3), 3) OD rate % minus NCB discount, 4) Third-party rates by CC tiers (<=1000, 1000-1500, >1500), and 5) C-Standard and C-Shield plans."*
* **What the AI Generated:**
  - A calculation function with depreciation brackets and model grouping.
* **Manual Review & Senior Corrections:**
  - **Vehicle Eligibility Boundary:** The AI output missed the explicit rate card constraint that *vehicles older than 8 years must be declined underwriting*. Added hard rejection boundary check returning `{"status": "DECLINED"}`.
  - **Plan Eligibility:** Added rule ensuring `C-Shield` (Nil Dep, RSA, Consumables) is strictly restricted to vehicles $\le 5$ years old, as per tariff guidelines.
  - **Unicode Ligature Fix:** During text extraction from PDF, Windows cp1252 stdout threw encoding exceptions on ligatures (`\ufb00`). Sanitized text streams and ensured UTF-8 encoding across file I/O.

---

### Stage 3: Data Sanitization & Ingestion Pipelines
* **Objective:** Clean and normalize messy real-world inputs (registration formats, currency symbols, Lakh notation, and duplicate records).
* **Prompt 3.1:**
  > *"Write robust parsing utilities for Indian insurance data: 1) Clean registration numbers (strip whitespace, hyphens, and uppercase), 2) Parse IDV values supporting '3.1 L', '3.3 lakh', and raw integers, 3) Parse currency strings like '₹12,830' and '\"11,670\"', 4) Detect quote expiration relative to reference date 2026-11-10."*
* **What the AI Generated:**
  - Helper functions for regex substitution and date comparison.
* **Manual Review & Senior Corrections:**
  - **Deduplication Logic:** Added signature hashing `(provider, plan, idv, total_premium)` to prevent duplicate records found in Provider A (WB02AB1234) and Provider D (KL 07 DE 3030) from polluting the comparison view.
  - **Date Robustness:** Enhanced the parser to handle both ISO (`YYYY-MM-DD`) and Indian date formats (`DD/MM/YYYY` and `DD-MM-YYYY`), as well as timezone-aware ISO timestamps.

---

### Stage 4: Add-on Canonical Normalization & Real Insurer Glossary
* **Objective:** Resolve inconsistent provider terminology against real-world insurer documentation.
* **Prompt 4.1:**
  > *"Research public add-on coverage documentation from HDFC ERGO, Digit, and ICICI Lombard. Create an alias dictionary mapping raw provider strings (e.g. 'Bumper to Bumper', 'Nil Depreciation', 'Total Cover', '24x7 Roadside Assistance', 'Engine & Gearbox Protection') to standardized canonical codes (`ZERO_DEP`, `RSA`, `ENGINE_PROTECT`, `RETURN_TO_INVOICE`, `KEY_REPLACEMENT`, `CONSUMABLES`). Include source URLs and reference dates."*
* **What the AI Generated:**
  - Glossary mapping table with citation metadata.
* **Manual Review & Senior Corrections:**
  - Verified and cross-checked live URLs against insurer web policies.
  - Added fallback mapping so any unrecognized custom add-on gracefully titles without breaking the parser.

---

### Stage 5: Concurrent Aggregation & Microservice Resilience
* **Objective:** Aggregate all 4 provider services asynchronously with isolated failure domains.
* **Prompt 5.1:**
  > *"Implement `QuoteAggregatorService` using `httpx.AsyncClient` and `asyncio.gather` to collect quotes from 4 mock provider endpoints concurrently. Ensure individual provider timeouts, error isolation (HTTP 503 or 500 on one provider does not fail the batch), and round-trip latency tracking in milliseconds."*
* **What the AI Generated:**
  - Async gathering loop with `httpx`.
* **Manual Review & Senior Corrections:**
  - **In-Process ASGI Transport Optimization:** For automated testing and single-process reviews, raw TCP calls to `127.0.0.1:8000` inside test suites can cause socket deadlocks. Architected an auto-detecting fallback to `httpx.ASGITransport(app=mock_app)`. This allows the application and test suite to run with zero socket latency while still supporting standalone microservice execution on port 8001.

---

### Stage 6: Value for Money Ranking Algorithm
* **Objective:** Establish an objective ranking metric so customers understand why the lowest price isn't necessarily the best choice.
* **Prompt 6.1:**
  > *"Write a scoring function that calculates a 0-100 Value Score based on: 1) Premium competitiveness (40%), 2) IDV asset coverage efficiency (35%), 3) Richness of included high-value add-ons like Zero Dep and RSA (25%), with a 20-point penalty for expired quotes. Assign badges: 'Best Value', 'Lowest Premium', 'Zero Dep Included', 'Max IDV'."*
* **Manual Review & Senior Corrections:**
  - Tuned the weighting to ensure high-coverage comprehensive plans with Zero Dep outperform barebones third-party plans on overall value, directly satisfying core assignment requirements.

---

### Stage 7: Comprehensive Automated Test Suite
* **Objective:** Build a regression suite ensuring 100% test pass rate across parsing, tariff math, and API endpoints.
* **Prompt 7.1:**
  > *"Write a comprehensive pytest test suite covering: 1) `test_parsers.py` (Lakh parsing, currency sanitization, expired dates, deduplication), 2) `test_rate_card.py` (C-Standard math, C-Shield add-ons, 8-year age decline, 5-year shield cutoff), and 3) `test_api.py` (FastAPI test client endpoints for vehicles, comparison, and policy lifecycle)."*
* **Verification:**
  - Executed `pytest backend/tests -v` $\to$ **All 16 tests passed cleanly in under 5 seconds**.

---

## 3. Engineering Philosophy & Quality Control

Throughout this assignment, AI was utilized strictly under rigorous human engineering supervision:
1. **Zero Hallucination Tolerance:** All quote prices and vehicle registries strictly derive from the provided test files—no mocked external rates or fictitious quote forms were permitted.
2. **Defensive Programming:** Every external provider response is wrapped in boundary validation, ensuring an outage in one provider never disrupts user experience.
3. **Production-Ready Code Standards:** Type hints throughout Python (`pydantic`, `typing`) and TypeScript (`verbatimModuleSyntax`, strict interfaces), clear docstrings, and comprehensive documentation.

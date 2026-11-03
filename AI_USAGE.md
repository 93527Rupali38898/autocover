# AI Usage & Pair-Programming Log (`AI_USAGE.md`)

This document describes how AI-assisted development tools were used during the development of **AutoCover**.

Google Antigravity, powered by Gemini 3.8 Flash, was used as a development assistant for tasks such as schema prototyping, code generation, data parsing, regular expressions, API implementation, and test-case generation.

AI-generated code was reviewed, modified, and tested before being integrated into the project. Decisions involving application architecture, business rules, data validation, error handling, and implementation details were made during development.

---

## 1. Development Environment

| Component | Details |
|---|---|
| AI Assistant | Google Antigravity |
| AI Model | Gemini 3.8 Flash |
| Operating System | Windows 11 |
| Terminal | PowerShell |
| Python | 3.11 |
| Node.js | v24 |
| Backend Framework | FastAPI |
| Data Validation | Pydantic V2 |
| HTTP Client | httpx |
| Testing Framework | pytest |

**AI Assistance Areas:**
- Data schema design and normalization.
- Python utility and parsing function generation.
- Regex development for data extraction.
- API and asynchronous service implementation.
- Test-case and fixture generation.
- Debugging and code improvement.

---

## 2. Development Process and AI Interaction Log

### Stage 1: Domain Modeling and Normalized Schema

**Objective:** Design a common data structure to handle insurance quotes received from four different providers with different data formats.

**Prompt 1.1:**

> I have four insurance providers returning data in different formats:
> - Provider A: JSON containing variable tax fields.
> - Provider B: HTML data containing dynamically generated quote information.
> - Provider C: PDF containing motor insurance tariff rates.
> - Provider D: CSV containing IDV values in different formats, including lakh notation and numeric values.
>
> Design a normalized Pydantic V2 schema named `NormalizedPlan` that can represent quotes from all four providers.
>
> Include fields for IDV, base premium, GST amount, total premium, add-ons, validity date, expiration status, and a value score between 0 and 100.
>
> Keep the schema reusable and make sure it supports data received from different providers without requiring provider-specific fields in the final comparison layer.

**AI-generated output:**
- Initial Pydantic model definitions.
- Suggested field types and optional fields.
- Initial data normalization structure.

**Changes made during implementation:**
- Updated the model configuration to use Pydantic V2 syntax (`model_config`) instead of the older V1 `class Config` approach.
- Added consistent handling of optional fields across providers.
- Corrected GST extraction for quotes where `premium_includes_gst` is true. The base premium is calculated using `round(total / 1.18)` rather than subtracting 18% of the gross amount.
- Ensured that the normalized schema could be used by the comparison service without depending on the original provider response format.

---

### Stage 2: Motor Tariff PDF Parsing and Calculation Engine

**Objective:** Implement the insurance calculation logic using the official three-page India Motor Tariff Rate Card provided in `provider_c.pdf`.

**Prompt 2.1:**

> Inspect the extracted contents of `provider_c.pdf` and help implement a Python rate calculation module.
>
> The module should calculate:
> 1. IDV depreciation based on vehicle age:
>    - Below 6 months: 5%
>    - 6 months to 1 year: 15%
>    - 1–2 years: 20%
>    - 2–3 years: 30%
>    - 3–4 years: 40%
>    - 4–5 years: 50%
>    - 5–8 years: 50% plus 5% per additional year.
> 2. Vehicle model grouping:
>    - Swift, i20, Tiago: G1
>    - Nexon, City, Sonet: G2
>    - Creta, XUV700: G3
> 3. Own Damage (OD) premium calculation with applicable NCB discount.
> 4. Third-party premium calculation using engine CC categories.
> 5. Calculation of C-Standard and C-Shield insurance plans.
>
> Keep the calculation logic separate from the API routes and make the functions reusable and easy to test.

**AI-generated output:**
- Initial depreciation calculation functions.
- Vehicle model grouping logic.
- Premium calculation structure.
- Initial implementation of insurance plan calculations.

**Changes made during implementation:**
- Added an underwriting rejection condition for vehicles older than eight years, returning `{"status": "DECLINED"}`.
- Added an eligibility check restricting C-Shield coverage (Nil Depreciation, RSA, and Consumables) to vehicles that are five years old or younger.
- Reviewed the depreciation brackets and calculation boundaries against the supplied tariff information.
- Fixed a Unicode encoding issue encountered while extracting PDF text on Windows. The extracted content contained ligature characters such as `\ufb00`, which caused errors with the default Windows console encoding.
- Standardized file and text handling to UTF-8.

---

### Stage 3: Data Cleaning and Provider Ingestion

**Objective:** Build reusable parsing utilities to handle inconsistent values and formats received from insurance providers.

**Prompt 3.1:**

> Create reusable Python parsing utilities for Indian motor insurance data.
>
> Implement functions for:
> 1. Cleaning vehicle registration numbers by removing spaces and hyphens and converting them to uppercase.
> 2. Parsing IDV values in formats such as `3.1 L`, `3.3 lakh`, and raw integers.
> 3. Cleaning currency values such as `₹12,830` and `"11,670"`.
> 4. Checking whether an insurance quote has expired using a reference date of 2026-11-10.
> 5. Handling missing or invalid values without causing the complete ingestion process to fail.
>
> Use appropriate regular expressions and keep the functions independent so they can be tested separately.

**AI-generated output:**
- Initial regex patterns for registration numbers.
- Currency and IDV parsing functions.
- Date comparison utilities.

**Changes made during implementation:**
- Added duplicate detection using a signature consisting of `(provider, plan, idv, total_premium)`.
- Used the signature to prevent duplicate records from appearing in the comparison results, including records associated with Provider A (`WB02AB1234`) and Provider D (`KL 07 DE 3030`).
- Extended date parsing to support ISO dates (`YYYY-MM-DD`), Indian date formats (`DD/MM/YYYY`, `DD-MM-YYYY`), and timezone-aware ISO timestamps.
- Added handling for empty values and unexpected input formats.

---

### Stage 4: Add-on Normalization and Insurer Terminology

**Objective:** Standardize insurance add-on names so that equivalent coverage options from different providers can be compared consistently.

**Prompt 4.1:**

> Research publicly available add-on coverage terminology used by HDFC ERGO, Digit, and ICICI Lombard.
>
> Create a Python alias dictionary that maps different provider-specific names to common add-on codes.
>
> Include mappings for:
> - Bumper to Bumper / Nil Depreciation → `ZERO_DEP`
> - 24x7 Roadside Assistance → `RSA`
> - Engine & Gearbox Protection → `ENGINE_PROTECT`
> - Return to Invoice → `RETURN_TO_INVOICE`
> - Key Replacement → `KEY_REPLACEMENT`
> - Consumables Cover → `CONSUMABLES`
>
> Keep the mapping extensible so additional provider-specific names can be added later. Also include source URLs and reference dates for the terminology used.

**AI-generated output:**
- Initial add-on alias dictionary.
- Suggested canonical codes.
- Initial mapping of common insurance terminology.

**Changes made during implementation:**
- Cross-checked the terminology against publicly available insurer documentation.
- Updated aliases where provider terminology differed.
- Added a fallback mechanism for unrecognized add-ons so their original names could still be displayed instead of causing normalization errors.
- Kept canonical add-on codes consistent across all provider responses.

---

### Stage 5: Asynchronous Quote Aggregation and Error Handling

**Objective:** Fetch insurance quotes from four provider services concurrently while handling individual provider failures independently.

**Prompt 5.1:**

> Implement a `QuoteAggregatorService` using Python's `httpx.AsyncClient`, `asyncio.gather`, and asynchronous request handling.
>
> The service should:
> 1. Send requests to four mock insurance provider endpoints concurrently.
> 2. Support individual request timeouts.
> 3. Handle HTTP 500, HTTP 503, connection errors, and timeout exceptions independently.
> 4. Return successful provider responses even when another provider fails.
> 5. Record the response time of each provider in milliseconds.
>
> Avoid allowing one provider's failure to interrupt the complete quote aggregation process.
>
> Also consider how the service can be tested using FastAPI's ASGI transport without requiring an external server process.

**AI-generated output:**
- Initial asynchronous aggregation implementation.
- Concurrent request execution using `asyncio.gather`.
- Basic exception handling and latency measurement.

**Changes made during implementation:**
- Added isolated exception handling for individual provider requests.
- Ensured that unsuccessful provider responses did not prevent other quotes from being returned.
- Used `httpx.ASGITransport(app=mock_app)` for in-process testing to avoid unnecessary network requests and socket-related issues.
- Kept support for standalone service execution through HTTP endpoints.
- Added response-time tracking for individual providers.

---

### Stage 6: Value-for-Money Scoring and Ranking

**Objective:** Develop a scoring mechanism that helps users compare insurance plans based on overall coverage and cost rather than considering only the lowest premium.

**Prompt 6.1:**

> Implement a Python function that calculates a Value Score between 0 and 100 for normalized insurance plans.
>
> Use the following weighted factors:
> 1. Premium competitiveness: 40%
> 2. IDV coverage efficiency: 35%
> 3. Included high-value add-ons, such as Zero Depreciation and RSA: 25%
>
> Apply a 20-point penalty to expired quotes.
>
> Also implement badges for:
> - Best Value
> - Lowest Premium
> - Zero Dep Included
> - Max IDV
>
> Make sure the ranking logic considers the overall coverage offered by a plan and does not automatically rank the cheapest insurance plan as the best option.

**AI-generated output:**
- Initial weighted scoring function.
- Suggested ranking conditions.
- Badge assignment logic.

**Changes made during implementation:**
- Adjusted the scoring calculations to make comparisons more meaningful across plans.
- Ensured that add-on coverage contributes to the overall value score.
- Added the expired quote penalty.
- Reviewed the ranking behavior to ensure comprehensive plans with useful add-ons could rank higher than basic plans with lower premiums.
- Kept individual badges separate from the overall ranking score.

---

### Stage 7: Automated Testing and Regression Checks

**Objective:** Generate and execute test cases covering data parsing, premium calculations, and API functionality.

**Prompt 7.1:**

> Create a pytest test suite for the AutoCover backend.
>
> Organize the tests into three files:
>
> **1. `test_parsers.py`**
> - IDV parsing for lakh notation and numeric values.
> - Currency string sanitization.
> - Registration number normalization.
> - Expired quote detection.
> - Duplicate record detection.
>
> **2. `test_rate_card.py`**
> - C-Standard premium calculations.
> - C-Shield add-on calculations.
> - Vehicle rejection for age greater than eight years.
> - C-Shield eligibility for vehicles up to five years old.
> - Depreciation boundary conditions.
>
> **3. `test_api.py`**
> - FastAPI test client functionality.
> - Vehicle-related endpoints.
> - Insurance comparison endpoint.
> - Policy lifecycle endpoints.
>
> Use appropriate test fixtures and include both valid and invalid input scenarios. Make sure the tests can run without depending on external provider services.

**AI-generated output:**
- Initial pytest test cases.
- Reusable fixtures.
- API endpoint test structure.
- Test data for different provider scenarios.

**Verification and changes:**
- Reviewed the generated test cases against the implemented business rules.
- Added boundary and invalid-input scenarios.
- Executed the test suite using:

```bash
pytest backend/tests -v
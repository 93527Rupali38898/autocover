"""
Insurance Quote Aggregation and Normalization Engine.
Fetches quotes concurrently from external mock provider services:
- Provider A: JSON API (handles deduplication, GST variants, declined status, expired quotes)
- Provider B: HTML Web Portal (extracts JS window.__QUOTE_DATA__, parses Lakh IDV & ₹ strings)
- Provider C: PDF Rate Card (calculates actuarial tariff rates based on age, group, and CC)
- Provider D: CSV Batch Export (handles whitespace/casing, duplicates, mixed IDV units)

Normalizes plans into a unified comparison schema and calculates value scores.
"""

import re
import json
import time
import asyncio
from datetime import datetime, date
from typing import List, Dict, Any, Tuple, Optional
import httpx
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

from backend.app.config import (
    MOCK_PROVIDER_URL,
    REFERENCE_DATE,
    DATA_DIR
)
from backend.app.schemas import (
    NormalizedPlan,
    NormalizedAddon,
    ProviderFetchStatus,
    ComparisonResponse,
    VehicleResponse
)
from backend.app.services.glossary import normalize_addon_name
from backend.app.services.rate_card import ProviderCRateEngine

def clean_reg_no(reg: str) -> str:
    """Normalize vehicle registration numbers (remove spaces, dashes, dots, uppercase)."""
    return re.sub(r"[^A-Za-z0-9]", "", reg or "").upper()

def parse_currency(val: Any) -> int:
    """Safely extracts integer amount from numbers or strings with currency symbols and commas."""
    if isinstance(val, (int, float)):
        return int(round(val))
    if not val:
        return 0
    clean = re.sub(r"[^\d.]", "", str(val))
    try:
        return int(round(float(clean)))
    except ValueError:
        return 0

def parse_idv_value(val: Any) -> int:
    """
    Parses IDV from numbers or strings like '3.1 L', '3.3 lakh', or '332000'.
    """
    if isinstance(val, (int, float)):
        return int(round(val))
    if not val:
        return 0
    s = str(val).lower().strip()
    # Check for lakh / L
    m = re.search(r"([\d.]+)\s*(?:lakh|l)\b", s)
    if m:
        try:
            return int(round(float(m.group(1)) * 100000))
        except ValueError:
            pass
    return parse_currency(s)

def parse_date_to_str(date_val: Any) -> Optional[str]:
    """Parses various date formats to ISO YYYY-MM-DD."""
    if not date_val:
        return None
    s = str(date_val).strip()
    try:
        # Check standard ISO or DD-MM-YYYY or DD/MM/YYYY
        if "/" in s:
            d, m, y = [int(p) for p in s.split("/")[:3]]
            return date(y, m, d).isoformat()
        if "-" in s and len(s.split("-")[0]) == 2:
            d, m, y = [int(p) for p in s.split("-")[:3]]
            return date(y, m, d).isoformat()
        dt = date_parser.parse(s)
        return dt.date().isoformat()
    except Exception:
        return s

def check_if_expired(valid_until_str: Optional[str], ref_date: date = REFERENCE_DATE) -> bool:
    """Determines whether a quote's validity expired relative to the reference date."""
    if not valid_until_str:
        return False
    try:
        dt = date_parser.parse(valid_until_str)
        q_date = dt.date()
        return q_date < ref_date
    except Exception:
        return False

class QuoteAggregatorService:
    """Orchestrates asynchronous quote collection from mock provider services."""

    def __init__(self, base_mock_url: str = MOCK_PROVIDER_URL, transport: Optional[httpx.BaseTransport] = None):
        self.mock_url = base_mock_url.rstrip("/")
        self.transport = transport

    async def fetch_provider_a(
        self,
        client: httpx.AsyncClient,
        reg_no: str,
        simulate_fail: bool = False
    ) -> Tuple[List[NormalizedPlan], ProviderFetchStatus]:
        """Fetch and parse Provider A's JSON quotes."""
        t0 = time.time()
        status = ProviderFetchStatus(
            provider_code="A",
            provider_name="SecureDrive (Provider A)",
            format="JSON REST API",
            status="SUCCESS"
        )
        plans: List[NormalizedPlan] = []
        cleaned_target = clean_reg_no(reg_no)

        try:
            url = f"{self.mock_url}/provider-a/quotes"
            params = {}
            if simulate_fail:
                params["simulate_fail"] = "true"

            resp = await client.get(url, params=params, timeout=6.0)
            status.response_time_ms = int((time.time() - t0) * 1000)

            if resp.status_code == 503:
                status.status = "FAILED"
                status.error_message = "Provider A server returned 503 Service Unavailable"
                return plans, status

            if resp.status_code != 200:
                status.status = "FAILED"
                status.error_message = f"HTTP {resp.status_code}: {resp.text[:100]}"
                return plans, status

            data = resp.json()
            quotes = data.get("quotes", [])

            # Filter quotes matching our vehicle registration
            seen_signatures = set()
            for q in quotes:
                q_reg = clean_reg_no(q.get("registration", ""))
                if q_reg != cleaned_target:
                    continue

                # Check if declined
                if q.get("status") == "DECLINED":
                    status.status = "DECLINED"
                    status.error_message = q.get("reason", "Declined by underwriting")
                    continue

                plan_name = q.get("plan", "Standard Plan")
                coverage = q.get("coverage", "COMPREHENSIVE")
                idv = parse_idv_value(q.get("idv", 0))

                # Handle tax variations
                # Case 1: premium_includes_gst == True
                if q.get("premium_includes_gst"):
                    total_prem = parse_currency(q.get("premium", 0))
                    base_prem = int(round(total_prem / 1.18))
                    gst_amount = total_prem - base_prem
                # Case 2: base_premium provided with taxes array
                else:
                    base_prem = parse_currency(q.get("base_premium", 0))
                    taxes = q.get("taxes", [])
                    gst_rate = 0.0
                    for t in taxes:
                        if t.get("name") == "GST":
                            gst_rate += float(t.get("rate", 0.18))
                    gst_amount = int(round(base_prem * gst_rate))
                    total_prem = base_prem + gst_amount

                # Deduplication check
                sig = (plan_name, coverage, idv, total_prem)
                if sig in seen_signatures:
                    continue
                seen_signatures.add(sig)

                # Normalize add-ons
                raw_addons = q.get("addons", [])
                normalized_addons = [normalize_addon_name(a) for a in raw_addons]

                valid_until = q.get("valid_until")
                is_expired = check_if_expired(valid_until)

                plan_obj = NormalizedPlan(
                    id=f"A-{cleaned_target}-{len(plans)+1}",
                    provider_code="A",
                    provider_name="SecureDrive (Provider A)",
                    plan_name=plan_name,
                    coverage_type=coverage,
                    idv=idv,
                    base_premium=base_prem,
                    gst_amount=gst_amount,
                    total_premium=total_prem,
                    addons=normalized_addons,
                    valid_until=valid_until,
                    is_expired=is_expired,
                    raw_metadata=q
                )
                plans.append(plan_obj)

            status.plans_count = len(plans)
            if not plans and status.status != "DECLINED":
                status.status = "NO_QUOTE"
                status.error_message = "No matching quotes found for registration"

        except Exception as e:
            status.response_time_ms = int((time.time() - t0) * 1000)
            status.status = "FAILED"
            status.error_message = f"Network or parsing error: {str(e)}"

        return plans, status

    async def fetch_provider_b(
        self,
        client: httpx.AsyncClient,
        reg_no: str
    ) -> Tuple[List[NormalizedPlan], ProviderFetchStatus]:
        """Fetch and parse Provider B's HTML portal with dynamic JS prices."""
        t0 = time.time()
        status = ProviderFetchStatus(
            provider_code="B",
            provider_name="AutoProtect (Provider B)",
            format="HTML + Dynamic JS",
            status="SUCCESS"
        )
        plans: List[NormalizedPlan] = []
        cleaned_target = clean_reg_no(reg_no)

        try:
            url = f"{self.mock_url}/provider-b/quote-page"
            resp = await client.get(url, timeout=8.0)
            status.response_time_ms = int((time.time() - t0) * 1000)

            if resp.status_code != 200:
                status.status = "FAILED"
                status.error_message = f"HTTP {resp.status_code}: {resp.text[:100]}"
                return plans, status

            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            # Extract window.__QUOTE_DATA__ from script tag
            quote_data = {}
            m = re.search(r"window\.__QUOTE_DATA__\s*=\s*(\{.*?\});", html, re.DOTALL)
            if m:
                try:
                    quote_data = json.loads(m.group(1))
                except Exception:
                    pass

            # Find vehicle section matching registration
            sections = soup.find_all("section", class_="vehicle")
            matched_section = None
            for s in sections:
                s_reg = clean_reg_no(s.get("data-reg", ""))
                if s_reg == cleaned_target:
                    matched_section = s
                    break

            if not matched_section:
                status.status = "NO_QUOTE"
                status.error_message = "Vehicle registration not found in Provider B results"
                return plans, status

            # Check if disabled / declined
            disabled_card = matched_section.find("div", class_="plan-card disabled")
            if disabled_card:
                reason = disabled_card.get_text(strip=True)
                status.status = "DECLINED"
                status.error_message = reason
                return plans, status

            # Parse plan cards
            plan_cards = matched_section.find_all("div", class_="plan-card")
            for card in plan_cards:
                if "disabled" in card.get("class", []):
                    continue

                plan_id = card.get("data-plan-id", "")
                h3 = card.find("h3")
                plan_name = h3.get_text(strip=True) if h3 else "Smart Shield"

                # Extract add-ons from list
                raw_addons = []
                ul = card.find("ul", class_="addons")
                if ul:
                    for li in ul.find_all("li"):
                        raw_addons.append(li.get_text(strip=True))

                # Extract dynamic price info from __QUOTE_DATA__
                price_info = quote_data.get(plan_id, {})
                raw_total = price_info.get("total", "₹0")
                total_prem = parse_currency(raw_total)
                # Provider B note: 'incl. taxes'
                base_prem = int(round(total_prem / 1.18))
                gst_amount = total_prem - base_prem

                raw_cover = price_info.get("cover", "0 L")
                idv = parse_idv_value(raw_cover)

                raw_valid_till = price_info.get("valid_till")
                valid_until_iso = parse_date_to_str(raw_valid_till)
                is_expired = check_if_expired(valid_until_iso)

                normalized_addons = [normalize_addon_name(a) for a in raw_addons]

                plan_obj = NormalizedPlan(
                    id=f"B-{plan_id}",
                    provider_code="B",
                    provider_name="AutoProtect (Provider B)",
                    plan_name=plan_name,
                    coverage_type="COMPREHENSIVE",
                    idv=idv,
                    base_premium=base_prem,
                    gst_amount=gst_amount,
                    total_premium=total_prem,
                    addons=normalized_addons,
                    valid_until=valid_until_iso,
                    is_expired=is_expired,
                    raw_metadata={"plan_id": plan_id, **price_info}
                )
                plans.append(plan_obj)

            status.plans_count = len(plans)

        except Exception as e:
            status.response_time_ms = int((time.time() - t0) * 1000)
            status.status = "FAILED"
            status.error_message = f"Provider B parsing failure: {str(e)}"

        return plans, status

    async def fetch_provider_c(
        self,
        client: httpx.AsyncClient,
        vehicle_dict: Dict[str, Any]
    ) -> Tuple[List[NormalizedPlan], ProviderFetchStatus]:
        """Fetch PDF rate card from Provider C and compute actuarial plans."""
        t0 = time.time()
        status = ProviderFetchStatus(
            provider_code="C",
            provider_name="National Shield (Provider C)",
            format="PDF Rate Card",
            status="SUCCESS"
        )
        plans: List[NormalizedPlan] = []
        cleaned_target = clean_reg_no(vehicle_dict.get("registration_number", ""))

        try:
            # First request the PDF from the mock server to simulate external fetch
            url = f"{self.mock_url}/provider-c/rate-card.pdf"
            resp = await client.get(url, timeout=6.0)
            status.response_time_ms = int((time.time() - t0) * 1000)

            if resp.status_code != 200:
                status.status = "FAILED"
                status.error_message = f"Failed to download Rate Card PDF (HTTP {resp.status_code})"
                return plans, status

            # Calculate quotes using official rate card tariff engine
            calc_result = ProviderCRateEngine.calculate_quotes(vehicle_dict, REFERENCE_DATE)

            if calc_result.get("status") == "DECLINED":
                status.status = "DECLINED"
                status.error_message = calc_result.get("reason", "Vehicle not eligible under Provider C tariff")
                return plans, status

            raw_plans = calc_result.get("plans", [])
            for idx, p in enumerate(raw_plans):
                norm_addons = [normalize_addon_name(a) for a in p.get("addons", [])]
                plan_obj = NormalizedPlan(
                    id=f"C-{cleaned_target}-{idx+1}",
                    provider_code="C",
                    provider_name="National Shield (Provider C)",
                    plan_name=p["plan_name"],
                    coverage_type=p["coverage"],
                    idv=p["idv"],
                    base_premium=p["base_premium"],
                    gst_amount=p["gst"],
                    total_premium=p["total_premium"],
                    addons=norm_addons,
                    valid_until=p.get("valid_until"),
                    is_expired=False,
                    raw_metadata=calc_result.get("metadata", {})
                )
                plans.append(plan_obj)

            status.plans_count = len(plans)

        except Exception as e:
            status.response_time_ms = int((time.time() - t0) * 1000)
            status.status = "FAILED"
            status.error_message = f"Provider C computation error: {str(e)}"

        return plans, status

    async def fetch_provider_d(
        self,
        client: httpx.AsyncClient,
        reg_no: str,
        simulate_fail: bool = False
    ) -> Tuple[List[NormalizedPlan], ProviderFetchStatus]:
        """Fetch and parse Provider D's daily CSV batch export."""
        t0 = time.time()
        status = ProviderFetchStatus(
            provider_code="D",
            provider_name="DriveSure (Provider D)",
            format="CSV Batch Export",
            status="SUCCESS"
        )
        plans: List[NormalizedPlan] = []
        cleaned_target = clean_reg_no(reg_no)

        try:
            url = f"{self.mock_url}/provider-d/export.csv"
            params = {}
            if simulate_fail:
                params["simulate_fail"] = "true"

            resp = await client.get(url, params=params, timeout=6.0)
            status.response_time_ms = int((time.time() - t0) * 1000)

            if resp.status_code != 200:
                status.status = "FAILED"
                status.error_message = f"HTTP {resp.status_code}: {resp.text[:100]}"
                return plans, status

            lines = resp.text.strip().splitlines()
            if not lines:
                status.status = "NO_QUOTE"
                return plans, status

            header = [h.strip() for h in lines[0].split(",")]
            # Format: reg_no,vehicle,plan,premium_incl_gst,idv,addons,valid_till
            seen_signatures = set()

            for line in lines[1:]:
                if not line.strip():
                    continue

                # Handle quotes around numbers like "11,670"
                # Simple CSV parsing taking into account quotes
                parts = []
                in_quotes = False
                cur = []
                for char in line:
                    if char == '"':
                        in_quotes = not in_quotes
                    elif char == ',' and not in_quotes:
                        parts.append("".join(cur).strip())
                        cur = []
                    else:
                        cur.append(char)
                parts.append("".join(cur).strip())

                if len(parts) < 7:
                    continue

                row_reg = clean_reg_no(parts[0])
                if row_reg != cleaned_target:
                    continue

                plan_name = parts[2]
                total_prem = parse_currency(parts[3])
                base_prem = int(round(total_prem / 1.18))
                gst_amount = total_prem - base_prem
                idv = parse_idv_value(parts[4])

                raw_addons_str = parts[5].strip()
                raw_addons = [a.strip() for a in raw_addons_str.split("|")] if raw_addons_str else []

                valid_till_str = parts[6].strip()
                valid_until_iso = parse_date_to_str(valid_till_str)
                is_expired = check_if_expired(valid_until_iso)

                # Deduplication check
                sig = (plan_name, idv, total_prem, raw_addons_str)
                if sig in seen_signatures:
                    continue
                seen_signatures.add(sig)

                norm_addons = [normalize_addon_name(a) for a in raw_addons]

                plan_obj = NormalizedPlan(
                    id=f"D-{cleaned_target}-{len(plans)+1}",
                    provider_code="D",
                    provider_name="DriveSure (Provider D)",
                    plan_name=plan_name,
                    coverage_type="COMPREHENSIVE",
                    idv=idv,
                    base_premium=base_prem,
                    gst_amount=gst_amount,
                    total_premium=total_prem,
                    addons=norm_addons,
                    valid_until=valid_until_iso,
                    is_expired=is_expired,
                    raw_metadata={
                        "raw_vehicle": parts[1],
                        "raw_valid_till": valid_till_str
                    }
                )
                plans.append(plan_obj)

            status.plans_count = len(plans)
            if not plans:
                status.status = "NO_QUOTE"
                status.error_message = "No quotes exported for registration"

        except Exception as e:
            status.response_time_ms = int((time.time() - t0) * 1000)
            status.status = "FAILED"
            status.error_message = f"Provider D CSV parse error: {str(e)}"

        return plans, status

    def score_and_rank_plans(self, plans: List[NormalizedPlan]) -> List[NormalizedPlan]:
        """
        Calculates Value for Money scores and smart badges.
        The score rewards high IDV, reasonable premiums, and comprehensive add-ons,
        ensuring customers understand why the cheapest plan isn't always the best.
        """
        if not plans:
            return []

        # Find min/max for normalization
        premiums = [p.total_premium for p in plans if p.total_premium > 0]
        idvs = [p.idv for p in plans if p.idv > 0]

        min_prem = min(premiums) if premiums else 1
        max_idv = max(idvs) if idvs else 1

        for plan in plans:
            badges = []

            # Value score components:
            # 1. Price factor (cheaper gives up to 40 pts)
            price_score = (min_prem / max(plan.total_premium, 1)) * 40.0

            # 2. Coverage factor (higher IDV gives up to 35 pts)
            coverage_score = (plan.idv / max_idv) * 35.0

            # 3. Add-ons factor (up to 25 pts)
            addon_count = len(plan.addons)
            addon_score = min(addon_count * 7.5, 25.0)

            # Penalty for expired quote
            expired_penalty = 20.0 if plan.is_expired else 0.0

            total_score = max(0.0, min(100.0, price_score + coverage_score + addon_score - expired_penalty))
            plan.value_score = round(total_score, 1)

            # Assign badges
            if plan.total_premium == min_prem:
                badges.append("Lowest Premium")

            has_zero_dep = any(a.code == "ZERO_DEP" for a in plan.addons)
            if has_zero_dep:
                badges.append("Zero Dep Included")

            if plan.idv == max_idv:
                badges.append("Max IDV")

            plan.badges = badges

        # Sort descending by value score, then find the overall highest value plan
        sorted_plans = sorted(plans, key=lambda p: p.value_score, reverse=True)
        if sorted_plans and not sorted_plans[0].is_expired:
            if "Best Value" not in sorted_plans[0].badges:
                sorted_plans[0].badges.insert(0, "Best Value")

        return sorted_plans

    async def aggregate_all(
        self,
        vehicle_dict: Dict[str, Any],
        fail_provider_a: bool = False,
        fail_provider_d: bool = False
    ) -> ComparisonResponse:
        """Collects from all 4 providers concurrently and returns comparative results."""
        reg_no = vehicle_dict.get("registration_number", "")

        client_kwargs = {}
        if self.transport:
            client_kwargs["transport"] = self.transport

        async with httpx.AsyncClient(**client_kwargs) as client:
            # Run all 4 provider collections concurrently
            results = await asyncio.gather(
                self.fetch_provider_a(client, reg_no, simulate_fail=fail_provider_a),
                self.fetch_provider_b(client, reg_no),
                self.fetch_provider_c(client, vehicle_dict),
                self.fetch_provider_d(client, reg_no, simulate_fail=fail_provider_d)
            )

        all_plans: List[NormalizedPlan] = []
        statuses: List[ProviderFetchStatus] = []

        for p_list, stat in results:
            all_plans.extend(p_list)
            statuses.append(stat)

        # Apply value scoring and ranking
        ranked_plans = self.score_and_rank_plans(all_plans)

        # Calculate high level summary
        valid_plans = [p for p in ranked_plans if not p.is_expired]
        lowest_prem = min([p.total_premium for p in valid_plans], default=0)
        highest_idv = max([p.idv for p in valid_plans], default=0)
        best_plan = ranked_plans[0].plan_name if ranked_plans else None

        summary = {
            "total_plans_found": len(ranked_plans),
            "valid_plans_count": len(valid_plans),
            "lowest_premium": lowest_prem,
            "highest_idv": highest_idv,
            "best_value_plan": best_plan,
            "active_providers_count": sum(1 for s in statuses if s.status == "SUCCESS")
        }

        # Convert vehicle dict to VehicleResponse
        vehicle_resp = VehicleResponse(
            registration_number=vehicle_dict.get("registration_number"),
            make=vehicle_dict.get("make"),
            model=vehicle_dict.get("model"),
            variant=vehicle_dict.get("variant"),
            fuel_type=vehicle_dict.get("fuel_type") or "Petrol",
            engine_cc=vehicle_dict.get("engine_cc", 1200),
            registration_date=str(vehicle_dict.get("registration_date")),
            rto=vehicle_dict.get("rto", "N/A"),
            ex_showroom_price=vehicle_dict.get("ex_showroom_price", 0),
            current_policy_expiry=vehicle_dict.get("current_policy_expiry"),
            claims_last_year=vehicle_dict.get("claims_last_year", 0),
            ncb_percent=vehicle_dict.get("ncb_percent", 0),
            formatted_expiry=parse_date_to_str(vehicle_dict.get("current_policy_expiry")),
            is_policy_expired=check_if_expired(parse_date_to_str(vehicle_dict.get("current_policy_expiry")))
        )

        return ComparisonResponse(
            vehicle=vehicle_resp,
            plans=ranked_plans,
            provider_statuses=statuses,
            reference_date=REFERENCE_DATE.isoformat(),
            summary=summary
        )

from datetime import date
import pytest
from backend.app.services.rate_card import ProviderCRateEngine

def test_rate_card_standard_plan():
    # Swift VXi (Group 1, 1197cc), registered 2022-08-14, ref date 2026-11-10 (~4.24 yrs)
    vehicle = {
        "registration_number": "WB02AB1234",
        "make": "Maruti Suzuki",
        "model": "Swift",
        "variant": "VXi",
        "engine_cc": 1197,
        "registration_date": "2022-08-14",
        "ex_showroom_price": 650000,
        "ncb_percent": 35
    }
    res = ProviderCRateEngine.calculate_quotes(vehicle, date(2026, 11, 10))
    assert res["status"] == "QUOTED"
    plans = res["plans"]
    assert len(plans) == 2  # C-Standard and C-Shield (since vehicle <= 5 yrs)

    std = next(p for p in plans if p["plan_name"] == "C-Standard")
    assert std["idv"] == 325000  # 50% dep on 650000
    assert std["base_premium"] == 9965
    assert std["total_premium"] == 11759  # 9965 + 18% GST

def test_rate_card_shield_plan_addons():
    vehicle = {
        "registration_number": "WB02AB1234",
        "make": "Maruti Suzuki",
        "model": "Swift",
        "variant": "VXi",
        "engine_cc": 1197,
        "registration_date": "2022-08-14",
        "ex_showroom_price": 650000,
        "ncb_percent": 35
    }
    res = ProviderCRateEngine.calculate_quotes(vehicle, date(2026, 11, 10))
    shield = next(p for p in res["plans"] if p["plan_name"] == "C-Shield")
    assert "Nil Depreciation" in shield["addons"]
    assert "Roadside Assistance" in shield["addons"]
    assert "Consumables" in shield["addons"]
    assert shield["total_premium"] == 14038

def test_rate_card_declined_over_8_years():
    # Hyundai i20 registered 2014-03-02 (> 12 years old)
    vehicle = {
        "registration_number": "WB06CD5678",
        "make": "Hyundai",
        "model": "i20",
        "variant": "Asta",
        "engine_cc": 1197,
        "registration_date": "2014-03-02",
        "ex_showroom_price": 740000,
        "ncb_percent": 50
    }
    res = ProviderCRateEngine.calculate_quotes(vehicle, date(2026, 11, 10))
    assert res["status"] == "DECLINED"
    assert "older than 8 years" in res["reason"]

def test_rate_card_no_shield_for_older_than_5_years():
    # Honda City registered 2019-11-25 (~6.96 yrs old)
    vehicle = {
        "registration_number": "TN09XY3456",
        "make": "Honda",
        "model": "City",
        "variant": "V CVT",
        "engine_cc": 1498,
        "registration_date": "2019-11-25",
        "ex_showroom_price": 1230000,
        "ncb_percent": 50
    }
    res = ProviderCRateEngine.calculate_quotes(vehicle, date(2026, 11, 10))
    assert res["status"] == "QUOTED"
    # Over 5 years old: only C-Standard is offered, C-Shield is not
    plan_names = [p["plan_name"] for p in res["plans"]]
    assert "C-Standard" in plan_names
    assert "C-Shield" not in plan_names

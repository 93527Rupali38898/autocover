from datetime import date
import pytest
from backend.app.services.aggregator_service import (
    clean_reg_no,
    parse_currency,
    parse_idv_value,
    parse_date_to_str,
    check_if_expired
)
from backend.app.services.glossary import normalize_addon_name, STANDARD_ADDONS

def test_clean_reg_no():
    assert clean_reg_no("WB 02 AB 1234") == "WB02AB1234"
    assert clean_reg_no("kl-07-de-3030") == "KL07DE3030"
    assert clean_reg_no("MH12 EF 4321") == "MH12EF4321"
    assert clean_reg_no("DL 3C AB 0042") == "DL3CAB0042"

def test_parse_currency():
    assert parse_currency("₹12,830") == 12830
    assert parse_currency("11,670") == 11670
    assert parse_currency(9965) == 9965
    assert parse_currency(None) == 0

def test_parse_idv_value():
    assert parse_idv_value("3.1 L") == 310000
    assert parse_idv_value("3.3 lakh") == 330000
    assert parse_idv_value("7.5 lakh") == 750000
    assert parse_idv_value(325000) == 325000
    assert parse_idv_value("332000") == 332000

def test_check_if_expired():
    ref = date(2026, 11, 10)
    # Expired before Nov 10
    assert check_if_expired("2026-11-05T23:59:00+05:30", ref) is True
    assert check_if_expired("2026-10-15", ref) is True
    # Valid after Nov 10
    assert check_if_expired("2026-11-30T23:59:00+05:30", ref) is False
    assert check_if_expired("2026-12-31", ref) is False

def test_addon_glossary_normalization():
    # Zero Depreciation variations across providers
    assert normalize_addon_name("ZERO_DEP").code == "ZERO_DEP"
    assert normalize_addon_name("Bumper to Bumper").code == "ZERO_DEP"
    assert normalize_addon_name("Nil Depreciation").code == "ZERO_DEP"
    assert normalize_addon_name("Zero Dep").code == "ZERO_DEP"

    # Roadside Assistance variations
    assert normalize_addon_name("RSA").code == "RSA"
    assert normalize_addon_name("24x7 Roadside Assistance").code == "RSA"
    assert normalize_addon_name("Roadside Assistance").code == "RSA"

    # Engine Protection
    assert normalize_addon_name("Engine & Gearbox Protection").code == "ENGINE_PROTECT"
    assert normalize_addon_name("Engine Protect").code == "ENGINE_PROTECT"

    # Return to invoice
    assert normalize_addon_name("Total Cover").code == "RETURN_TO_INVOICE"
    assert normalize_addon_name("Return to Invoice").code == "RETURN_TO_INVOICE"

    # Key replacement
    assert normalize_addon_name("Key Replacement").code == "KEY_REPLACEMENT"

    # Consumables
    assert normalize_addon_name("Consumables").code == "CONSUMABLES"

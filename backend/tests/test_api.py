import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["reference_date"] == "2026-11-10"

def test_test_customers():
    response = client.get("/api/test-customers")
    assert response.status_code == 200
    data = response.json()
    assert len(data["customers"]) > 0
    assert any(c["registration_number"] == "WB 02 AB 1234" for c in data["customers"])

def test_get_vehicle_valid():
    response = client.get("/api/vehicles/WB02AB1234")
    assert response.status_code == 200
    data = response.json()
    assert data["make"] == "Maruti Suzuki"
    assert data["model"] == "Swift"
    assert data["registration_number"] == "WB02AB1234"

def test_get_vehicle_not_found():
    response = client.get("/api/vehicles/WB02AB9999")
    assert response.status_code == 404

def test_get_glossary():
    response = client.get("/api/quotes/glossary")
    assert response.status_code == 200
    data = response.json()
    assert "sources" in data
    assert len(data["sources"]) >= 3
    assert "standard_addons" in data
    assert "ZERO_DEP" in data["standard_addons"]

def test_create_and_list_policy():
    payload = {
        "customer_name": "Test User",
        "customer_phone": "+91 99999 88888",
        "customer_email": "test@example.com",
        "registration_number": "WB02AB1234",
        "provider_code": "A",
        "provider_name": "SecureDrive (Provider A)",
        "plan_name": "Essential",
        "coverage_type": "COMPREHENSIVE",
        "idv": 325000,
        "base_premium": 9965,
        "gst_amount": 1794,
        "total_premium": 11759,
        "addons": ["Zero Depreciation"]
    }
    create_res = client.post("/api/policies", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["policy_number"].startswith("AC-2026-")
    assert created["customer_name"] == "Test User"

    list_res = client.get("/api/policies")
    assert list_res.status_code == 200
    policies = list_res.json()
    assert any(p["policy_number"] == created["policy_number"] for p in policies)

def test_compare_quotes():
    # WB02AB1234 should return plans across providers
    response = client.get("/api/quotes/compare/WB02AB1234")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) > 0
    assert "provider_statuses" in data
    assert len(data["provider_statuses"]) == 4

    # Verify ranking and badges
    plans = data["plans"]
    assert any("Best Value" in p["badges"] for p in plans)
    assert any("Lowest Premium" in p["badges"] for p in plans)


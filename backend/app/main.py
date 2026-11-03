"""
AutoCover Insurance Comparison Platform - Backend API.
Provides RESTful endpoints for vehicle lookup, multi-provider quote aggregation,
plan comparison with add-on glossary mapping, and policy dashboard management.
"""

import os
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.config import REFERENCE_DATE, MOCK_PROVIDER_URL
from backend.app.database import engine, Base, get_db
from backend.app.schemas import (
    VehicleResponse,
    VehicleUpdate,
    ComparisonResponse,
    PolicyCreate,
    PolicyResponse,
    TestCustomersData
)
from backend.app.services.registry_service import RegistryService, normalize_reg
from backend.app.services.aggregator_service import QuoteAggregatorService
from backend.app.services.glossary import get_glossary_data
from backend.app.services.policy_service import PolicyService
from backend.app.mock_server.mock_providers import mock_app

# Create DB tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed vehicle data from registry.json on startup
    db = next(get_db())
    try:
        RegistryService.seed_vehicles_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="AutoCover API",
    description="Smart Vehicle Insurance Comparison & Aggregation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount mock provider service directly for seamless single-process or multi-process execution
app.mount("/mock", mock_app)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "AutoCover API",
        "reference_date": REFERENCE_DATE.isoformat(),
        "database": "connected"
    }

@app.get("/api/test-customers", response_model=TestCustomersData)
def get_test_customers():
    """Returns sample test customers and edge-case registration numbers from test_customers.json."""
    return RegistryService.get_test_customers()

@app.get("/api/vehicles/{registration_number}", response_model=VehicleResponse)
def get_vehicle_details(registration_number: str, db: Session = Depends(get_db)):
    """
    Looks up vehicle registry details by registration number.
    Handles space/case normalizations and date standardizations.
    """
    clean_reg = normalize_reg(registration_number)
    vehicle = RegistryService.get_vehicle_by_registration(db, clean_reg)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with registration '{registration_number}' not found in registry. Please verify or try another test registration."
        )

    # Check policy expiry relative to reference date (10 Nov 2026)
    days_left = None
    is_expired = False
    if vehicle.current_policy_expiry:
        try:
            from dateutil import parser as dt_p
            exp_d = dt_p.parse(vehicle.current_policy_expiry).date()
            days_left = (exp_d - REFERENCE_DATE).days
            is_expired = days_left < 0
        except Exception:
            pass

    return VehicleResponse(
        registration_number=vehicle.registration_number,
        make=vehicle.make,
        model=vehicle.model,
        variant=vehicle.variant,
        fuel_type=vehicle.fuel_type or "Petrol",
        engine_cc=vehicle.engine_cc,
        registration_date=vehicle.registration_date,
        rto=vehicle.rto,
        ex_showroom_price=vehicle.ex_showroom_price,
        current_policy_expiry=vehicle.current_policy_expiry,
        claims_last_year=vehicle.claims_last_year,
        ncb_percent=vehicle.ncb_percent,
        formatted_expiry=vehicle.current_policy_expiry,
        is_policy_expired=is_expired,
        days_to_expiry=days_left
    )

@app.put("/api/vehicles/{registration_number}", response_model=VehicleResponse)
def update_vehicle_details(
    registration_number: str,
    update_data: VehicleUpdate,
    db: Session = Depends(get_db)
):
    """Allows user to correct vehicle details (e.g. fuel type, NCB %, or expiry date)."""
    clean_reg = normalize_reg(registration_number)
    updated = RegistryService.update_vehicle(db, clean_reg, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Vehicle not found for update")

    return get_vehicle_details(clean_reg, db)

@app.get("/api/quotes/compare/{registration_number}", response_model=ComparisonResponse)
async def compare_insurance_quotes(
    registration_number: str,
    fail_provider_a: bool = Query(default=False, description="Simulate 503 outage on Provider A"),
    fail_provider_d: bool = Query(default=False, description="Simulate failure on Provider D"),
    db: Session = Depends(get_db)
):
    """
    Core Aggregation Endpoint:
    Collects quotes asynchronously from Providers A, B, C, and D.
    Parses disparate formats (JSON, HTML+JS, PDF Rate Card, CSV),
    standardizes add-ons using the insurer glossary, deduplicates quotes,
    and computes Value for Money ranking.
    """
    clean_reg = normalize_reg(registration_number)
    vehicle = RegistryService.get_vehicle_by_registration(db, clean_reg)
    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail=f"Registration '{registration_number}' not found in registry."
        )

    vehicle_dict = {
        "registration_number": vehicle.registration_number,
        "make": vehicle.make,
        "model": vehicle.model,
        "variant": vehicle.variant,
        "fuel_type": vehicle.fuel_type or "Petrol",
        "engine_cc": vehicle.engine_cc,
        "registration_date": vehicle.registration_date,
        "rto": vehicle.rto,
        "ex_showroom_price": vehicle.ex_showroom_price,
        "current_policy_expiry": vehicle.current_policy_expiry,
        "claims_last_year": vehicle.claims_last_year,
        "ncb_percent": vehicle.ncb_percent
    }

    # Dynamically determine mock server URL (can be port 8001 or in-process ASGITransport)
    mock_url = os.getenv("MOCK_PROVIDER_URL", "http://127.0.0.1:8001")
    transport = None

    use_in_process = False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=0.2) as test_client:
            res = await test_client.get(f"{mock_url}/health")
            if res.status_code != 200:
                use_in_process = True
    except Exception:
        use_in_process = True

    if use_in_process:
        import httpx
        mock_url = "http://testserver"
        transport = httpx.ASGITransport(app=mock_app)

    service = QuoteAggregatorService(base_mock_url=mock_url, transport=transport)
    comparison = await service.aggregate_all(
        vehicle_dict=vehicle_dict,
        fail_provider_a=fail_provider_a,
        fail_provider_d=fail_provider_d
    )

    return comparison

@app.get("/api/quotes/glossary")
def get_addon_glossary():
    """Returns the standardized add-on glossary with real insurer references."""
    return get_glossary_data()

@app.post("/api/policies", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(req: PolicyCreate, db: Session = Depends(get_db)):
    """Mock purchase/confirmation: saves a selected insurance policy to the database."""
    policy = PolicyService.create_policy(db, req)
    all_p = PolicyService.get_all_policies(db)
    for p in all_p:
        if p.id == policy.id:
            return p
    return policy

@app.get("/api/policies", response_model=List[PolicyResponse])
def list_policies(db: Session = Depends(get_db)):
    """Retrieves all confirmed customer policies."""
    return PolicyService.get_all_policies(db)

@app.get("/api/policies/expiring", response_model=List[PolicyResponse])
def get_expiring_policies(threshold_days: int = 15, db: Session = Depends(get_db)):
    """Identifies policies approaching expiry within the specified window (default 15 days)."""
    return PolicyService.get_expiring_policies(db, threshold_days=threshold_days)

@app.post("/api/policies/seed-demo")
def seed_demo_policies(db: Session = Depends(get_db)):
    """Seeds sample confirmed policies for demonstration purposes."""
    existing = db.query(PolicyService.get_all_policies(db)).first() if hasattr(PolicyService, "foo") else None
    if db.query(Base.metadata.tables["policies"]).count() > 0:
        return {"message": "Policies already seeded", "count": db.query(Base.metadata.tables["policies"]).count()}

    # Sample policy 1: Active policy
    p1 = PolicyCreate(
        customer_name="Rahul Sen",
        customer_phone="+91 98300 11111",
        customer_email="rahul.sen@example.com",
        registration_number="WB02AB1234",
        provider_code="A",
        provider_name="SecureDrive (Provider A)",
        plan_name="Comprehensive Plus",
        coverage_type="COMPREHENSIVE",
        idv=325000,
        base_premium=11346,
        gst_amount=2042,
        total_premium=13388,
        addons=["Zero Depreciation", "24x7 Roadside Assistance"]
    )
    PolicyService.create_policy(db, p1)

    # Sample policy 2: Expiring in 10 days relative to 10 Nov 2026
    p2 = PolicyCreate(
        customer_name="Fatima Khan",
        customer_phone="+91 98110 55555",
        customer_email="fatima.khan@example.com",
        registration_number="DL3CAB0042",
        provider_code="B",
        provider_name="AutoProtect (Provider B)",
        plan_name="Smart Shield",
        coverage_type="COMPREHENSIVE",
        idv=690000,
        base_premium=27444,
        gst_amount=4940,
        total_premium=32384,
        addons=["Zero Depreciation", "24x7 Roadside Assistance"]
    )
    created2 = PolicyService.create_policy(db, p2)
    # Adjust expiry date to 2026-11-20 (10 days from reference date)
    created2.policy_expiry_date = "2026-11-20"
    created2.status = "EXPIRING_SOON"
    db.commit()

    return {"message": "Demo policies seeded successfully"}

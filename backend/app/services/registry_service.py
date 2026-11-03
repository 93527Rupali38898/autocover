"""
Vehicle Registry & Seed Service.
Manages vehicle data lookups, input normalization, corrections, and test customer fixtures.
"""

import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from dateutil import parser as date_parser

from backend.app.config import DATA_DIR, REFERENCE_DATE
from backend.app.models import VehicleModel
from backend.app.schemas import VehicleUpdate, TestCustomersData

def normalize_reg(reg: str) -> str:
    """Normalize registration number: uppercase, remove all whitespace and hyphens."""
    import re
    return re.sub(r"[^A-Za-z0-9]", "", reg or "").upper()

def parse_date_safely(raw_date: Optional[str]) -> Optional[str]:
    """Handles both DD/MM/YYYY and YYYY-MM-DD."""
    if not raw_date:
        return None
    raw_date = str(raw_date).strip()
    try:
        if "/" in raw_date:
            d, m, y = [int(p) for p in raw_date.split("/")[:3]]
            return f"{y:04d}-{m:02d}-{d:02d}"
        dt = date_parser.parse(raw_date)
        return dt.date().isoformat()
    except Exception:
        return raw_date

class RegistryService:
    """Handles vehicle registry operations and database caching."""

    @staticmethod
    def seed_vehicles_if_empty(db: Session):
        """Seeds vehicle registry from data/registry.json if database table is empty."""
        count = db.query(VehicleModel).count()
        if count > 0:
            return

        json_path = DATA_DIR / "registry.json"
        if not json_path.exists():
            return

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        vehicles = data.get("vehicles", [])
        for v in vehicles:
            reg_clean = normalize_reg(v["registration_number"])
            # Fallback for missing fuel_type (e.g., WB20PQ0909)
            fuel = v.get("fuel_type") or "Petrol"
            exp_date = parse_date_safely(v.get("current_policy_expiry"))

            record = VehicleModel(
                registration_number=reg_clean,
                make=v["make"],
                model=v["model"],
                variant=v["variant"],
                fuel_type=fuel,
                engine_cc=v["engine_cc"],
                registration_date=parse_date_safely(v["registration_date"]),
                rto=v["rto"],
                ex_showroom_price=v["ex_showroom_price"],
                current_policy_expiry=exp_date,
                claims_last_year=v.get("claims_last_year", 0),
                ncb_percent=v.get("ncb_percent", 0)
            )
            db.merge(record)
        db.commit()

    @staticmethod
    def get_vehicle_by_registration(db: Session, reg_no: str) -> Optional[VehicleModel]:
        """Looks up a vehicle by normalized registration number."""
        RegistryService.seed_vehicles_if_empty(db)
        clean = normalize_reg(reg_no)
        return db.query(VehicleModel).filter(VehicleModel.registration_number == clean).first()

    @staticmethod
    def update_vehicle(db: Session, reg_no: str, update_data: VehicleUpdate) -> Optional[VehicleModel]:
        """Allows users to update or correct vehicle details."""
        vehicle = RegistryService.get_vehicle_by_registration(db, reg_no)
        if not vehicle:
            return None

        for field, value in update_data.model_dump(exclude_unset=True).items():
            if value is not None:
                if field == "current_policy_expiry":
                    value = parse_date_safely(value)
                setattr(vehicle, field, value)

        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def get_test_customers() -> TestCustomersData:
        """Loads sample customers and edge case registration numbers."""
        test_file = DATA_DIR / "test_customers.json"
        if test_file.exists():
            with open(test_file, "r", encoding="utf-8") as f:
                raw = json.load(f)
                return TestCustomersData(**raw)

        return TestCustomersData(
            reference_date=REFERENCE_DATE.isoformat(),
            customers=[],
            also_try=[]
        )

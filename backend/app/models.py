from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base

class VehicleModel(Base):
    __tablename__ = "vehicles"

    registration_number = Column(String(20), primary_key=True, index=True)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    variant = Column(String(50), nullable=False)
    fuel_type = Column(String(20), nullable=True)
    engine_cc = Column(Integer, nullable=False)
    registration_date = Column(String(20), nullable=False)
    rto = Column(String(50), nullable=False)
    ex_showroom_price = Column(Integer, nullable=False)
    current_policy_expiry = Column(String(20), nullable=True)
    claims_last_year = Column(Integer, default=0)
    ncb_percent = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PolicyModel(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    policy_number = Column(String(30), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    customer_email = Column(String(100), nullable=True)
    registration_number = Column(String(20), index=True, nullable=False)
    provider_code = Column(String(20), nullable=False)
    provider_name = Column(String(100), nullable=False)
    plan_name = Column(String(100), nullable=False)
    coverage_type = Column(String(50), nullable=False)
    idv = Column(Integer, nullable=False)
    base_premium = Column(Integer, nullable=False)
    gst_amount = Column(Integer, nullable=False)
    total_premium = Column(Integer, nullable=False)
    addons_json = Column(Text, default="[]")
    policy_start_date = Column(String(20), nullable=False)
    policy_expiry_date = Column(String(20), nullable=False)
    status = Column(String(30), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)


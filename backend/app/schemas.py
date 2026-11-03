from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VehicleBase(BaseModel):
    registration_number: str
    make: str
    model: str
    variant: str
    fuel_type: Optional[str] = "Petrol"
    engine_cc: int
    registration_date: str
    rto: str
    ex_showroom_price: int
    current_policy_expiry: Optional[str] = None
    claims_last_year: int = 0
    ncb_percent: int = 0

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    fuel_type: Optional[str] = None
    engine_cc: Optional[int] = None
    registration_date: Optional[str] = None
    rto: Optional[str] = None
    ex_showroom_price: Optional[int] = None
    current_policy_expiry: Optional[str] = None
    claims_last_year: Optional[int] = None
    ncb_percent: Optional[int] = None

class VehicleResponse(VehicleBase):
    formatted_expiry: Optional[str] = None
    is_policy_expired: bool = False
    days_to_expiry: Optional[int] = None

    model_config = {"from_attributes": True}

class NormalizedAddon(BaseModel):
    code: str
    name: str
    description: str
    original_name: str

class NormalizedPlan(BaseModel):
    id: str
    provider_code: str
    provider_name: str
    plan_name: str
    coverage_type: str
    idv: int
    base_premium: int
    gst_amount: int
    total_premium: int
    addons: List[NormalizedAddon] = []
    valid_until: Optional[str] = None
    is_expired: bool = False
    value_score: float = 0.0
    badges: List[str] = []
    raw_metadata: Dict[str, Any] = {}

class ProviderFetchStatus(BaseModel):
    provider_code: str
    provider_name: str
    format: str
    status: str  # SUCCESS, DECLINED, FAILED, TIMEOUT
    response_time_ms: int = 0
    error_message: Optional[str] = None
    plans_count: int = 0

class ComparisonResponse(BaseModel):
    vehicle: VehicleResponse
    plans: List[NormalizedPlan]
    provider_statuses: List[ProviderFetchStatus]
    reference_date: str
    summary: Dict[str, Any]

class PolicyCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    registration_number: str
    provider_code: str
    provider_name: str
    plan_name: str
    coverage_type: str
    idv: int
    base_premium: int
    gst_amount: int
    total_premium: int
    addons: List[str] = []

class PolicyResponse(BaseModel):
    id: int
    policy_number: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    registration_number: str
    provider_code: str
    provider_name: str
    plan_name: str
    coverage_type: str
    idv: int
    base_premium: int
    gst_amount: int
    total_premium: int
    addons: List[str]
    policy_start_date: str
    policy_expiry_date: str
    status: str
    days_until_expiry: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class TestCustomer(BaseModel):
    name: str
    phone: str
    registration_number: str

class TestCustomersData(BaseModel):
    reference_date: str
    customers: List[TestCustomer]
    also_try: List[str]

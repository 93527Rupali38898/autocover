"""
Policy Management & Persistence Service.
Handles mock policy selection, confirmation, database persistence,
and expiry monitoring (identifying policies expiring within 15 days).
"""

import json
import random
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from dateutil import parser as date_parser

from backend.app.config import REFERENCE_DATE
from backend.app.models import PolicyModel
from backend.app.schemas import PolicyCreate, PolicyResponse

class PolicyService:
    """Manages policy lifecycle and expiry tracking."""

    @staticmethod
    def create_policy(db: Session, req: PolicyCreate) -> PolicyModel:
        """Saves a confirmed insurance policy."""
        # Policy starts on reference date (10 Nov 2026), expires in 1 year
        start_date = REFERENCE_DATE
        # Add 365 days
        expiry_date = start_date + timedelta(days=365)

        policy_number = f"AC-{REFERENCE_DATE.year}-{random.randint(100000, 999999)}"

        policy = PolicyModel(
            policy_number=policy_number,
            customer_name=req.customer_name,
            customer_phone=req.customer_phone,
            customer_email=req.customer_email or "",
            registration_number=req.registration_number.upper(),
            provider_code=req.provider_code,
            provider_name=req.provider_name,
            plan_name=req.plan_name,
            coverage_type=req.coverage_type,
            idv=req.idv,
            base_premium=req.base_premium,
            gst_amount=req.gst_amount,
            total_premium=req.total_premium,
            addons_json=json.dumps(req.addons),
            policy_start_date=start_date.isoformat(),
            policy_expiry_date=expiry_date.isoformat(),
            status="ACTIVE"
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy

    @staticmethod
    def get_all_policies(db: Session) -> List[PolicyResponse]:
        """Lists all stored policies with expiry analysis."""
        policies = db.query(PolicyModel).order_by(PolicyModel.created_at.desc()).all()
        results = []
        for p in policies:
            addons_list = []
            try:
                addons_list = json.loads(p.addons_json)
            except Exception:
                pass

            # Calculate days to expiry
            days_left = None
            status_val = p.status
            try:
                exp_dt = date_parser.parse(p.policy_expiry_date).date()
                days_left = (exp_dt - REFERENCE_DATE).days
                if days_left < 0:
                    status_val = "EXPIRED"
                elif days_left <= 15:
                    status_val = "EXPIRING_SOON"
            except Exception:
                pass

            results.append(PolicyResponse(
                id=p.id,
                policy_number=p.policy_number,
                customer_name=p.customer_name,
                customer_phone=p.customer_phone,
                customer_email=p.customer_email,
                registration_number=p.registration_number,
                provider_code=p.provider_code,
                provider_name=p.provider_name,
                plan_name=p.plan_name,
                coverage_type=p.coverage_type,
                idv=p.idv,
                base_premium=p.base_premium,
                gst_amount=p.gst_amount,
                total_premium=p.total_premium,
                addons=addons_list,
                policy_start_date=p.policy_start_date,
                policy_expiry_date=p.policy_expiry_date,
                status=status_val,
                days_until_expiry=days_left,
                created_at=p.created_at
            ))
        return results

    @staticmethod
    def get_expiring_policies(db: Session, threshold_days: int = 15) -> List[PolicyResponse]:
        """Returns active policies expiring within threshold days of the reference date."""
        all_policies = PolicyService.get_all_policies(db)
        return [
            p for p in all_policies
            if p.days_until_expiry is not None and 0 <= p.days_until_expiry <= threshold_days
        ]

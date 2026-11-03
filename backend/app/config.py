import os
from pathlib import Path
from datetime import date

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))

# Reference date for quote validity and policy expiry calculations (10 November 2026 IST)
REFERENCE_DATE_STR = os.getenv("REFERENCE_DATE", "2026-11-10")
REFERENCE_DATE = date.fromisoformat(REFERENCE_DATE_STR)

# Database URL: SQLite by default for zero-friction setup, PostgreSQL supported
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./autocover.db")

# Mock provider service base URL
MOCK_PROVIDER_URL = os.getenv("MOCK_PROVIDER_URL", "http://127.0.0.1:8001")

# Provider simulation behavior
SIMULATE_SLOW_PROVIDERS = os.getenv("SIMULATE_SLOW_PROVIDERS", "true").lower() in ("true", "1", "yes")
SIMULATE_FAILURES = os.getenv("SIMULATE_FAILURES", "false").lower() in ("true", "1", "yes")


"""
Mock Provider Microservice.
Simulates 4 external insurance provider endpoints exposing disparate data formats:
- Provider A: JSON REST API with occasional 503 outage simulation.
- Provider B: Web portal serving HTML with dynamic JavaScript client-side rendering & latency.
- Provider C: File server providing downloadable PDF rate card.
- Provider D: Legacy batch export server providing CSV quote data.
"""

import os
import asyncio
from pathlib import Path
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import DATA_DIR, SIMULATE_SLOW_PROVIDERS, SIMULATE_FAILURES

mock_app = FastAPI(
    title="AutoCover Mock Insurance Provider Service",
    description="Simulates independent external insurer endpoints with variable latency and error injection."
)

mock_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@mock_app.get("/health")
def health():
    return {
        "status": "online",
        "service": "AutoCover Mock Providers",
        "data_dir": str(DATA_DIR)
    }

# ----------------- PROVIDER A: JSON API -----------------
@mock_app.get("/provider-a/quotes")
async def get_provider_a_quotes(
    simulate_fail: bool = Query(default=False, description="Simulate HTTP 503 Service Unavailable"),
    reg: str = Query(default="", description="Optional vehicle registration filter")
):
    """
    Returns Provider A JSON quote database.
    Can trigger 503 error when simulate_fail is true or global SIMULATE_FAILURES is active.
    """
    if simulate_fail or (SIMULATE_FAILURES and os.getenv("FAIL_PROVIDER_A") == "1"):
        raise HTTPException(
            status_code=503,
            detail="Provider A underwriting server temporarily unavailable (503 Service Unavailable)"
        )

    file_path = DATA_DIR / "provider_a.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="provider_a.json not found")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return Response(content=content, media_type="application/json")


# ----------------- PROVIDER B: HTML WITH DYNAMIC SCRIPT -----------------
@mock_app.get("/provider-b/quote-page", response_class=HTMLResponse)
async def get_provider_b_html(
    delay_seconds: float = Query(default=1.5 if SIMULATE_SLOW_PROVIDERS else 0.0, description="Simulated network latency")
):
    """
    Serves Provider B's HTML portal.
    Simulates real-world legacy system latency (1.5 - 2.5 seconds).
    """
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    file_path = DATA_DIR / "provider_b.html"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="provider_b.html not found")

    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    return HTMLResponse(content=html)


# ----------------- PROVIDER C: PDF RATE CARD -----------------
@mock_app.get("/provider-c/rate-card.pdf")
async def get_provider_c_pdf():
    """
    Serves Provider C's official Private Car Package Policy Rate Card PDF.
    """
    file_path = DATA_DIR / "provider_c.pdf"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="provider_c.pdf not found")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename="provider_c_rate_card.pdf"
    )


# ----------------- PROVIDER D: CSV EXPORT -----------------
@mock_app.get("/provider-d/export.csv")
async def get_provider_d_csv(
    simulate_fail: bool = Query(default=False, description="Simulate CSV export server error")
):
    """
    Serves Provider D's daily batch quote CSV file.
    """
    if simulate_fail:
        raise HTTPException(status_code=500, detail="Provider D batch generation pipeline failure")

    file_path = DATA_DIR / "provider_d.csv"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="provider_d.csv not found")

    with open(file_path, "r", encoding="utf-8") as f:
        csv_data = f.read()

    return Response(content=csv_data, media_type="text/csv")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(mock_app, host="127.0.0.1", port=8001)

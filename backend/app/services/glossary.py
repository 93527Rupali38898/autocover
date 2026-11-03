"""
Add-on Glossary & Normalization Service.
Maps provider-specific terminology to industry-standard insurance concepts.
Researched and referenced against public car insurance add-on documentation from:
1. HDFC ERGO: https://www.hdfcergo.com/car-insurance/add-on-covers
2. Digit Insurance: https://www.godigit.com/motor-insurance/car-insurance/add-on-covers
3. ICICI Lombard: https://www.icicilombard.com/motor-insurance/car-insurance/add-on-covers
"""

from typing import Dict, Any, List, Optional
from backend.app.schemas import NormalizedAddon

GLOSSARY_SOURCES = [
    {
        "insurer": "HDFC ERGO General Insurance",
        "url": "https://www.hdfcergo.com/car-insurance/add-on-covers",
        "referenced_date": "2026-11-10",
        "notes": "Covers Zero Depreciation, Emergency Assistance (RSA), Engine and Gearbox Protector, Return to Invoice, Key Replacement, and Consumables."
    },
    {
        "insurer": "Digit General Insurance",
        "url": "https://www.godigit.com/motor-insurance/car-insurance/add-on-covers",
        "referenced_date": "2026-11-10",
        "notes": "Covers Bumper to Bumper (Zero Dep), 24x7 Roadside Assistance, Engine & Gearbox Protection, Return to Invoice Cover, and Key & Lock Protect."
    },
    {
        "insurer": "ICICI Lombard General Insurance",
        "url": "https://www.icicilombard.com/motor-insurance/car-insurance/add-on-covers",
        "referenced_date": "2026-11-10",
        "notes": "Covers Zero Depreciation, Roadside Assistance Cover, Engine Protect Plus, Return to Invoice, and Key Protect Cover."
    }
]

STANDARD_ADDONS: Dict[str, Dict[str, Any]] = {
    "ZERO_DEP": {
        "code": "ZERO_DEP",
        "name": "Zero Depreciation",
        "category": "Damage Protection",
        "description": "Waives vehicle depreciation on replaced parts (plastic, rubber, metal) during claim settlements, giving 100% reimbursement.",
        "real_world_names": {
            "HDFC ERGO": "Zero Depreciation Cover",
            "Digit": "Bumper to Bumper / Zero Dep",
            "ICICI Lombard": "Zero Depreciation"
        },
        "provider_mappings": {
            "Provider A": "ZERO_DEP",
            "Provider B": "Bumper to Bumper",
            "Provider C": "Nil Depreciation",
            "Provider D": "Zero Dep"
        },
        "aliases": [
            "zero_dep", "zero dep", "nil depreciation", "bumper to bumper",
            "bumper-to-bumper", "depreciation waiver", "nil dep"
        ]
    },
    "RSA": {
        "code": "RSA",
        "name": "24x7 Roadside Assistance",
        "category": "Emergency Services",
        "description": "Round-the-clock emergency support for battery jump-start, flat tyre repair, emergency fuel delivery, and towing.",
        "real_world_names": {
            "HDFC ERGO": "Emergency Assistance (RSA)",
            "Digit": "24x7 Roadside Assistance",
            "ICICI Lombard": "Roadside Assistance Cover"
        },
        "provider_mappings": {
            "Provider A": "RSA",
            "Provider B": "24x7 Roadside Assistance",
            "Provider C": "Roadside Assistance",
            "Provider D": "RSA"
        },
        "aliases": [
            "rsa", "24x7 roadside assistance", "roadside assistance",
            "breakdown assistance", "emergency roadside"
        ]
    },
    "ENGINE_PROTECT": {
        "code": "ENGINE_PROTECT",
        "name": "Engine & Gearbox Protection",
        "category": "Mechanical Protection",
        "description": "Covers repair and replacement costs for engine and transmission damage caused by water ingression (hydrostatic lock) or oil leakage.",
        "real_world_names": {
            "HDFC ERGO": "Engine and Gearbox Protector",
            "Digit": "Engine & Gearbox Protection",
            "ICICI Lombard": "Engine Protect Plus"
        },
        "provider_mappings": {
            "Provider A": "N/A",
            "Provider B": "Engine & Gearbox Protection",
            "Provider C": "Engine Protect",
            "Provider D": "Engine Protect"
        },
        "aliases": [
            "engine protect", "engine & gearbox protection", "engine protection",
            "engine and gearbox protector", "hydrostatic lock cover"
        ]
    },
    "RETURN_TO_INVOICE": {
        "code": "RETURN_TO_INVOICE",
        "name": "Return to Invoice (RTI)",
        "category": "Financial Protection",
        "description": "In case of total loss or theft, pays the difference between vehicle IDV and original on-road purchase invoice value, including registration and road tax.",
        "real_world_names": {
            "HDFC ERGO": "Return to Invoice",
            "Digit": "Return to Invoice Cover",
            "ICICI Lombard": "Return to Invoice"
        },
        "provider_mappings": {
            "Provider A": "N/A",
            "Provider B": "Total Cover",
            "Provider C": "Return to Invoice",
            "Provider D": "N/A"
        },
        "aliases": [
            "return to invoice", "total cover", "rti", "invoice protection"
        ]
    },
    "KEY_REPLACEMENT": {
        "code": "KEY_REPLACEMENT",
        "name": "Key Replacement Cover",
        "category": "Convenience & Security",
        "description": "Reimburses the cost of acquiring replacement keys and changing the vehicle lock set if keys are lost or stolen.",
        "real_world_names": {
            "HDFC ERGO": "Key Replacement",
            "Digit": "Key & Lock Protect",
            "ICICI Lombard": "Key Protect Cover"
        },
        "provider_mappings": {
            "Provider A": "N/A",
            "Provider B": "Key Replacement",
            "Provider C": "N/A",
            "Provider D": "N/A"
        },
        "aliases": [
            "key replacement", "key protect", "key & lock protect", "lost key"
        ]
    },
    "CONSUMABLES": {
        "code": "CONSUMABLES",
        "name": "Consumables Cover",
        "category": "Cost Protection",
        "description": "Reimburses expenses on non-reusable consumable parts like lubricants, engine oil, brake oil, nuts, bolts, screws, and AC gas during claim repairs.",
        "real_world_names": {
            "HDFC ERGO": "Consumables Cover",
            "Digit": "Consumable Cover",
            "ICICI Lombard": "Garage Cash & Consumables"
        },
        "provider_mappings": {
            "Provider A": "N/A",
            "Provider B": "N/A",
            "Provider C": "Consumables",
            "Provider D": "N/A"
        },
        "aliases": [
            "consumables", "consumables cover", "consumable expenses"
        ]
    }
}

def normalize_addon_name(raw_name: str) -> NormalizedAddon:
    """Normalize any provider's raw add-on string to a standard NormalizedAddon."""
    clean = raw_name.strip().lower()

    for code, info in STANDARD_ADDONS.items():
        if clean == code.lower():
            return NormalizedAddon(
                code=code,
                name=info["name"],
                description=info["description"],
                original_name=raw_name
            )
        for alias in info["aliases"]:
            if clean == alias.lower() or alias.lower() in clean:
                return NormalizedAddon(
                    code=code,
                    name=info["name"],
                    description=info["description"],
                    original_name=raw_name
                )

    # Fallback for unrecognized add-on
    return NormalizedAddon(
        code="CUSTOM",
        name=raw_name.title(),
        description=f"Additional protection add-on: {raw_name}",
        original_name=raw_name
    )

def get_glossary_data() -> Dict[str, Any]:
    """Return complete glossary metadata, citations, and mapping table."""
    return {
        "sources": GLOSSARY_SOURCES,
        "standard_addons": STANDARD_ADDONS
    }

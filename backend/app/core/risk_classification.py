"""
CLIMASCOPE Authoritative Climate Risk Classification Module
===========================================================

Defines the singular, authoritative municipal risk classification tiers,
thresholds, and color scales for CLIMASCOPE.

Established Thresholds:
- Score > 75.0:          CRITICAL (#DC3545)
- 60.0 <= Score <= 75.0: ELEVATED (#F59E0B)
- 40.0 <= Score < 60.0:  MODERATE (#0EA5E9)
- Score < 40.0:          STABLE   (#16A34A)

Boundary Test Cases:
- 39.9 -> STABLE
- 40.0 -> MODERATE
- 59.9 -> MODERATE
- 60.0 -> ELEVATED
- 75.0 -> ELEVATED
- 75.1 -> CRITICAL
"""

from typing import Dict, Any


def get_climate_risk_tier(score: float) -> str:
    """
    Classifies a Climate Debt Score into one of the four canonical tiers:
    CRITICAL, ELEVATED, MODERATE, STABLE.
    """
    if score > 75.0:
        return "CRITICAL"
    elif score >= 60.0:
        return "ELEVATED"
    elif score >= 40.0:
        return "MODERATE"
    else:
        return "STABLE"


RISK_COLORS: Dict[str, str] = {
    "CRITICAL": "#DC3545",
    "ELEVATED": "#F59E0B",
    "MODERATE": "#0EA5E9",
    "STABLE": "#16A34A",
}


def get_risk_color(score_or_badge: Any) -> str:
    """Returns the hex color code for a given score or badge."""
    if isinstance(score_or_badge, (int, float)):
        badge = get_climate_risk_tier(float(score_or_badge))
    else:
        badge = str(score_or_badge).upper()
    return RISK_COLORS.get(badge, "#16A34A")

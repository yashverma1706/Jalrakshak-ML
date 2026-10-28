
import math
from typing import Optional


VALID_NEEDS = {"Low", "Medium", "High"}


def recommend_action(
    irrigation_need: str,
    rainfall_next_24h_mm: Optional[float],
) -> dict:
    """Provide a review recommendation without automating irrigation."""

    if irrigation_need not in VALID_NEEDS:
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Invalid or unavailable irrigation-need prediction.",
        }

    if rainfall_next_24h_mm is None:
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Rainfall forecast is unavailable.",
        }

    try:
        rainfall = float(rainfall_next_24h_mm)
    except (TypeError, ValueError, OverflowError):
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Rainfall forecast must be numeric.",
        }

    if not math.isfinite(rainfall) or rainfall < 0:
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Rainfall forecast must be finite and non-negative.",
        }

    return {
        "action": "REVIEW_RECOMMENDED",
        "reason": (
            "Review the ML irrigation-need prediction alongside the "
            "24-hour rainfall forecast. Validated agronomic thresholds "
            "are not available, so no automatic irrigation command "
            "is issued."
        ),
        "irrigation_need": irrigation_need,
        "rainfall_next_24h_mm": round(rainfall, 2),
    }

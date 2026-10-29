import math
from typing import Optional


VALID_NEEDS = {"Low", "Medium", "High"}

# Rainfall thresholds (mm over the next 24 hours)
RAINFALL_HEAVY_MM = 10.0     # Overrides all need levels — skip irrigation
RAINFALL_MODERATE_MM = 4.0   # Sufficient for Low/Medium needs


def recommend_action(
    irrigation_need: str,
    rainfall_next_24h_mm: Optional[float],
) -> dict:
    """
    Return an actionable irrigation recommendation based on the ML prediction
    and the 24-hour rainfall forecast.

    Decision matrix:
    ┌──────────────┬──────────────────┬────────────────────┐
    │ Need         │ Rain (next 24 h) │ Action             │
    ├──────────────┼──────────────────┼────────────────────┤
    │ Any          │ >= 10 mm         │ SKIP_IRRIGATION    │
    │ Low          │ >= 4 mm          │ SKIP_IRRIGATION    │
    │ Low          │ < 4 mm           │ MONITOR            │
    │ Medium       │ >= 4 mm          │ SKIP_IRRIGATION    │
    │ Medium       │ < 4 mm           │ IRRIGATE_SOON      │
    │ High         │ >= 4 mm          │ MONITOR            │
    │ High         │ < 4 mm           │ IRRIGATE_NOW       │
    └──────────────┴──────────────────┴────────────────────┘
    """

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

    # Heavy rain overrides all need levels
    if rainfall >= RAINFALL_HEAVY_MM:
        return {
            "action": "SKIP_IRRIGATION",
            "reason": (
                f"Heavy rainfall expected ({rainfall:.1f} mm over next 24 h). "
                "Natural rainfall will meet crop water demand — no irrigation needed."
            ),
            "irrigation_need": irrigation_need,
            "rainfall_next_24h_mm": round(rainfall, 2),
        }

    if irrigation_need == "Low":
        if rainfall >= RAINFALL_MODERATE_MM:
            return {
                "action": "SKIP_IRRIGATION",
                "reason": (
                    f"Soil moisture need is Low and moderate rainfall is forecast "
                    f"({rainfall:.1f} mm). No irrigation required at this time."
                ),
                "irrigation_need": irrigation_need,
                "rainfall_next_24h_mm": round(rainfall, 2),
            }
        return {
            "action": "MONITOR",
            "reason": (
                f"Soil moisture need is Low and minimal rainfall is expected "
                f"({rainfall:.1f} mm). Monitor field conditions; irrigate only if "
                "moisture drops further."
            ),
            "irrigation_need": irrigation_need,
            "rainfall_next_24h_mm": round(rainfall, 2),
        }

    if irrigation_need == "Medium":
        if rainfall >= RAINFALL_MODERATE_MM:
            return {
                "action": "SKIP_IRRIGATION",
                "reason": (
                    f"Moderate rainfall forecast ({rainfall:.1f} mm) should offset "
                    "the medium water need. Re-check soil moisture after rainfall."
                ),
                "irrigation_need": irrigation_need,
                "rainfall_next_24h_mm": round(rainfall, 2),
            }
        return {
            "action": "IRRIGATE_SOON",
            "reason": (
                f"Medium water need detected with little rain expected "
                f"({rainfall:.1f} mm). Plan irrigation within the next 12–24 hours "
                "to avoid crop stress."
            ),
            "irrigation_need": irrigation_need,
            "rainfall_next_24h_mm": round(rainfall, 2),
        }

    # High need
    if rainfall >= RAINFALL_MODERATE_MM:
        return {
            "action": "MONITOR",
            "reason": (
                f"High water need detected but moderate rain is forecast "
                f"({rainfall:.1f} mm). Monitor after rainfall — irrigate immediately "
                "if soil moisture remains critically low."
            ),
            "irrigation_need": irrigation_need,
            "rainfall_next_24h_mm": round(rainfall, 2),
        }
    return {
        "action": "IRRIGATE_NOW",
        "reason": (
            f"High water need with negligible rainfall forecast ({rainfall:.1f} mm). "
            "Irrigate as soon as possible to prevent crop stress and yield loss."
        ),
        "irrigation_need": irrigation_need,
        "rainfall_next_24h_mm": round(rainfall, 2),
    }

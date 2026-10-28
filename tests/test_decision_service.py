
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.decision_service import recommend_action


def test_missing_rainfall_returns_insufficient_data():
    result = recommend_action("High", None)

    assert result["action"] == "INSUFFICIENT_DATA"


def test_negative_rainfall_returns_insufficient_data():
    result = recommend_action("Medium", -5)

    assert result["action"] == "INSUFFICIENT_DATA"


def test_invalid_prediction_returns_insufficient_data():
    result = recommend_action("Unknown", 5)

    assert result["action"] == "INSUFFICIENT_DATA"



def test_valid_inputs_return_review_without_automatic_command():
    result = recommend_action("High", 2.5)

    assert result["action"] == "REVIEW_RECOMMENDED"
    assert result["irrigation_need"] == "High"
    assert result["rainfall_next_24h_mm"] == 2.5
    assert "reason" in result


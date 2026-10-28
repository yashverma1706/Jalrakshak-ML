
from pathlib import Path
import math

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "irrigation_need_model.joblib"

FEATURES = [
    "Soil_Moisture",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
    "Temperature_C",
    "Humidity",
]

VALID_CROP_TYPES = {
    "Rice", "Maize", "Sugarcane", "Potato", "Wheat", "Cotton"
}

VALID_GROWTH_STAGES = {
    "Sowing", "Vegetative", "Flowering", "Harvest"
}

VALID_SOIL_TYPES = {
    "Sandy", "Silt", "Loamy", "Clay"
}

NUMERIC_FEATURES = [
    "Soil_Moisture",
    "Temperature_C",
    "Humidity",
]

model = joblib.load(MODEL_PATH)

# Fail early if the selected model does not match this feature schema.
if list(model.feature_names_in_) != FEATURES:
    raise RuntimeError(
        "Model feature mismatch. "
        f"Expected {FEATURES}, got {list(model.feature_names_in_)}"
    )


def predict_irrigation_need(property_data: dict) -> str:
    """Predict irrigation need using the original six-feature model."""

    if not isinstance(property_data, dict):
        raise TypeError("property_data must be a dictionary")

    missing_features = [
        feature for feature in FEATURES
        if feature not in property_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    input_df = pd.DataFrame([
        {feature: property_data[feature] for feature in FEATURES}
    ])

    categorical_checks = {
        "Crop_Type": VALID_CROP_TYPES,
        "Crop_Growth_Stage": VALID_GROWTH_STAGES,
        "Soil_Type": VALID_SOIL_TYPES,
    }

    for feature, allowed_values in categorical_checks.items():
        value = input_df.at[0, feature]

        if not isinstance(value, str) or value not in allowed_values:
            raise ValueError(
                f"Invalid {feature}: {value!r}. "
                f"Allowed values: {sorted(allowed_values)}"
            )

    for feature in NUMERIC_FEATURES:
        value = input_df.at[0, feature]

        if pd.isna(value):
            raise ValueError(f"{feature} cannot be missing")

        try:
            numeric_value = float(value)
        except (TypeError, ValueError, OverflowError):
            raise ValueError(f"{feature} must be numeric") from None

        if not math.isfinite(numeric_value):
            raise ValueError(f"{feature} must be finite")

        if feature in {"Soil_Moisture", "Humidity"}:
            if not 0 <= numeric_value <= 100:
                raise ValueError(
                    f"{feature} must be between 0 and 100"
                )

        input_df.at[0, feature] = numeric_value

    prediction = model.predict(input_df)[0]
    return str(prediction)

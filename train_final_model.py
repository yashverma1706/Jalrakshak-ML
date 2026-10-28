import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


DEFAULT_DATA_PATH = Path("data/raw/irrigation_prediction.csv")
DEFAULT_MODEL_PATH = Path("models/irrigation_need_model.joblib")

# Production 6-feature schema matching src/predict.py
PRODUCTION_FEATURES = [
    "Soil_Moisture",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
    "Temperature_C",
    "Humidity",
]

CATEGORICAL_FEATURES = [
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
]


def train(
    data_path: Path = DEFAULT_DATA_PATH,
    model_path: Path = DEFAULT_MODEL_PATH,
    include_rainfall: bool = False,
):
    df = pd.read_csv(data_path)

    if include_rainfall:
        features = PRODUCTION_FEATURES + ["Rainfall_mm"]
        numeric_features = ["Soil_Moisture", "Temperature_C", "Humidity", "Rainfall_mm"]
        print("[Mode] Training 7-feature experimental candidate (with Rainfall_mm)")
    else:
        features = list(PRODUCTION_FEATURES)
        numeric_features = ["Soil_Moisture", "Temperature_C", "Humidity"]
        print("[Mode] Training standard 6-feature production model (matching src/predict.py)")

    X = df[features]
    y = df["Irrigation_Need"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    preprocessor = ColumnTransformer(
        [
            (
                "num",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric_features,
            ),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    model = Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=300,
                    class_weight="balanced",
                    min_samples_leaf=3,
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )

    print("Fitting model...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("\nHeld-out test accuracy:", round(accuracy_score(y_test, predictions), 4))
    print("Held-out macro F1:", round(f1_score(y_test, predictions, average="macro"), 4))
    print("\nClassification report:\n")
    print(classification_report(y_test, predictions, zero_division=0))

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)

    print(f"Model saved to: {model_path}")
    print(f"Feature schema: {list(model.feature_names_in_)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train irrigation prediction model for Jalrakshak-ML"
    )
    parser.add_argument(
        "--data",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Path to input dataset CSV",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to save the trained joblib model",
    )
    parser.add_argument(
        "--include-rainfall",
        action="store_true",
        help="Include Rainfall_mm as an input feature (experimental)",
    )
    args = parser.parse_args()

    train(
        data_path=args.data,
        model_path=args.output,
        include_rainfall=args.include_rainfall,
    )

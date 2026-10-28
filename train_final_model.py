
import pandas as pd
import joblib

from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report


DATA_PATH = Path("data/raw/irrigation_prediction.csv")
MODEL_PATH = Path("models/irrigation_need_model_rainfall.joblib")

df = pd.read_csv(DATA_PATH)

features = [
    "Soil_Moisture",
    "Temperature_C",
    "Humidity",
    "Rainfall_mm",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
]

X = df[features]
y = df["Irrigation_Need"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

numeric_features = [
    "Soil_Moisture",
    "Temperature_C",
    "Humidity",
    "Rainfall_mm",
]

categorical_features = [
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
]

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
            categorical_features,
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

model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("Held-out test accuracy:", round(accuracy_score(y_test, predictions), 4))
print("Held-out macro F1:", round(f1_score(y_test, predictions, average="macro"), 4))
print("\nClassification report:\n")
print(classification_report(y_test, predictions, zero_division=0))

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(model, MODEL_PATH)

print(f"\nCandidate saved to: {MODEL_PATH}")
print("Features:", features)

import os
import logging
from contextlib import asynccontextmanager
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.backend_service import run_backend
from src.predict import load_model


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CropType = Literal["Rice", "Maize", "Sugarcane", "Potato", "Wheat", "Cotton"]
CropGrowthStage = Literal["Sowing", "Vegetative", "Flowering", "Harvest"]
SoilType = Literal["Sandy", "Silt", "Loamy", "Clay"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler to pre-load the ML model on startup."""
    try:
        logger.info("Pre-warming ML model...")
        load_model()
        logger.info("ML model loaded successfully.")
    except Exception as exc:
        logger.error("Failed to pre-load ML model during startup: %s", exc)
    yield


app = FastAPI(
    title="Jalrakshak-ML API",
    description="Irrigation prediction and live weather forecast API",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [
    origin.strip()
    for origin in cors_origins_env.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class IrrigationRequest(BaseModel):
    soil_moisture: float = Field(
        alias="Soil_Moisture",
        ge=0,
        le=100,
        description="Soil moisture percentage (0-100)",
    )
    crop_type: CropType = Field(
        alias="Crop_Type",
        description="Type of crop being cultivated",
    )
    crop_growth_stage: CropGrowthStage = Field(
        alias="Crop_Growth_Stage",
        description="Current crop growth stage",
    )
    soil_type: SoilType = Field(
        alias="Soil_Type",
        description="Type of soil",
    )
    latitude: float = Field(
        ge=-90,
        le=90,
        description="Latitude coordinate (-90 to 90)",
    )
    longitude: float = Field(
        ge=-180,
        le=180,
        description="Longitude coordinate (-180 to 180)",
    )

    model_config = {"populate_by_name": True}


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Jalrakshak-ML API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/predict")
def predict(request: IrrigationRequest) -> dict[str, Any]:
    try:
        property_data = {
            "Soil_Moisture": request.soil_moisture,
            "Crop_Type": request.crop_type,
            "Crop_Growth_Stage": request.crop_growth_stage,
            "Soil_Type": request.soil_type,
        }

        return run_backend(
            property_data=property_data,
            latitude=request.latitude,
            longitude=request.longitude,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        logger.warning(
            "Prediction or weather service unavailable: %s",
            exc,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "Prediction service or weather forecast is unavailable."
            ),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error while processing prediction")
        raise HTTPException(
            status_code=500,
            detail="An unexpected internal error occurred.",
        ) from exc

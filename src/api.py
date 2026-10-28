
import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.backend_service import run_backend


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Jalrakshak-ML API",
    description="Irrigation prediction and live weather forecast API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class IrrigationRequest(BaseModel):
    soil_moisture: float = Field(
        alias="Soil_Moisture",
        ge=0,
        le=100,
    )
    crop_type: str = Field(alias="Crop_Type")
    crop_growth_stage: str = Field(alias="Crop_Growth_Stage")
    soil_type: str = Field(alias="Soil_Type")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

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

from functools import lru_cache
from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from joblib import load
from pydantic import BaseModel, Field


MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "research_grade_type2_logistic_regression_model.pkl"
)

FEATURE_COLUMNS = [
    "age",
    "gender_encoded",
    "BMI",
    "fasting_glucose",
    "HbA1c",
    "insulin",
    "triglycerides",
    "blood_pressure",
    "physical_activity_encoded",
    "cholesterol_ratio",
]

GENDER_MAP = {"Female": 0, "Male": 1}
ACTIVITY_MAP = {"Low": 0, "Medium": 1, "High": 2}


class PredictionRequest(BaseModel):
    age: int = Field(..., ge=19, le=90)
    gender: Literal["Female", "Male"]
    bmi: float = Field(..., ge=10, le=55)
    fasting_glucose: float = Field(..., ge=60, le=260)
    hba1c: float = Field(..., ge=2.0, le=12.5)
    insulin: float = Field(..., ge=2, le=45)
    triglycerides: float = Field(..., ge=80, le=350)
    hdl: float = Field(..., gt=0, le=80)
    ldl: float = Field(..., ge=50, le=230)
    blood_pressure: float = Field(..., ge=80, le=210)
    physical_activity: Literal["Low", "Medium", "High"]


class PredictionResponse(BaseModel):
    prediction: int
    label: str
    probability: float
    confidence: float
    cholesterol_ratio: float
    probabilities: dict[str, float]
    model_input: dict[str, float]


app = FastAPI(
    title="Insulin Resistance Prediction API",
    version="1.0.0",
    description="FastAPI backend for the trained logistic regression model.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_model():
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file was not found at {MODEL_PATH}")

    model = load(MODEL_PATH)
    model_features = list(getattr(model, "feature_names_in_", FEATURE_COLUMNS))
    if model_features != FEATURE_COLUMNS:
        raise RuntimeError(f"Unexpected model features: {model_features}")
    return model


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Insulin Resistance Prediction API",
        "health_url": "/api/health",
        "predict_url": "/api/predict",
        "docs_url": "/docs",
    }


@app.get("/api")
def api_root():
    return root()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "model_loaded": MODEL_PATH.exists()}


@app.get("/health")
def plain_health_check():
    return health_check()


@app.post("/api/predict", response_model=PredictionResponse)
def predict_insulin_resistance(payload: PredictionRequest):
    try:
        model = get_model()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    cholesterol_ratio = payload.ldl / payload.hdl
    model_input = {
        "age": payload.age,
        "gender_encoded": GENDER_MAP[payload.gender],
        "BMI": payload.bmi,
        "fasting_glucose": payload.fasting_glucose,
        "HbA1c": payload.hba1c,
        "insulin": payload.insulin,
        "triglycerides": payload.triglycerides,
        "blood_pressure": payload.blood_pressure,
        "physical_activity_encoded": ACTIVITY_MAP[payload.physical_activity],
        "cholesterol_ratio": cholesterol_ratio,
    }

    sample = pd.DataFrame([[model_input[column] for column in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
    probability = float(model.predict_proba(sample)[0][1])
    prediction = int(probability >= 0.5)
    confidence = probability if prediction else 1 - probability

    return PredictionResponse(
        prediction=prediction,
        label="Insulin resistance likely" if prediction else "Insulin resistance unlikely",
        probability=probability,
        confidence=confidence,
        cholesterol_ratio=cholesterol_ratio,
        probabilities={
            "No insulin resistance": 1 - probability,
            "Insulin resistance": probability,
        },
        model_input={key: float(value) for key, value in model_input.items()},
    )
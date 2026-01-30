from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import time
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BRIS ML Service",
    description="Behavioral Risk Intelligence System - ML Prediction Service",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class BehavioralFeatures(BaseModel):
    click_frequency: float
    scroll_velocity: float
    typing_speed: float
    dwell_time: float
    tab_switch_count: int
    copy_paste_events: int
    navigation_speed: float
    mouse_trajectory_entropy: float
    keystroke_dynamics: List[float]
    session_duration: float
    time_of_day: int
    day_of_week: int
    device_change: bool
    location_anomaly: bool
    event_count: int
    unique_event_types: int
    error_rate: float

class PredictRequest(BaseModel):
    features: BehavioralFeatures
    user_id: int
    session_id: str

class PredictResponse(BaseModel):
    risk_score: float
    confidence: float
    anomaly_type: str
    model_version: str
    explanation: Optional[str] = None
    processing_time_ms: float

class ExplainRequest(BaseModel):
    user_id: int
    risk_score: float
    features: BehavioralFeatures
    anomaly_type: str

class ExplainResponse(BaseModel):
    explanation: str
    severity: str
    contributing_factors: List[str]
    generated_at: datetime

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "bris-ml-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }

# ============================================
# PREDICTION ENDPOINT
# ============================================

# ============================================
# AI FORENSIC ENGINE
# ============================================

def generate_behavioral_narrative(features: BehavioralFeatures) -> str:
    """Generates a human-readable narrative of the session behavior."""
    story = []
    if features.tab_switch_count > 5:
        story.append(f"Highly suspicious data leakage pattern: {features.tab_switch_count} tab switches detected.")
    elif features.tab_switch_count > 0:
        story.append(f"Minor environmental distraction: {features.tab_switch_count} tab switches.")
        
    if features.copy_paste_events > 0:
        story.append(f"Non-authentic input pattern: User bypassed manual entry {features.copy_paste_events} times via clipboard.")
        
    if features.typing_speed > 160:
        story.append("Input throughput exceeds human benchmarks; potential script/bot interaction.")
    elif features.typing_speed < 15 and features.event_count > 50:
        story.append("Evidence of cognitive load or coaching: abnormally slow input relative to activity.")

    if not story: return "Standard behavioral baseline. No significant deviations from organic user patterns."
    return " ".join(story)

def generate_mitigation(risk_score: float, features: BehavioralFeatures) -> List[str]:
    """Generates professional mitigation steps."""
    steps = []
    if risk_score > 75:
        steps.append("BLOCK: Initiate Automatic Session Termination")
        steps.append("MFA: Trigger Out-of-Band Biometric Challenge")
    elif risk_score > 40:
        steps.append("UI: Inject 'Bot-Check' CAPTCHA")
        steps.append("NOTIFY: Level 1 Analyst Review Required")
    else:
        steps.append("LOG: Continue Background Surveillance")
    return steps

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """Predict risk and generate AI narrative."""
    start_time = time.time()
    try:
        f = request.features
        risk_score = min(max((f.tab_switch_count * 12) + (f.copy_paste_events * 10) + (15 if f.typing_speed > 150 else 0), 0), 100)
        
        narrative = generate_behavioral_narrative(f)
        mitigation = generate_mitigation(risk_score, f)
        
        return PredictResponse(
            risk_score=round(risk_score, 2),
            confidence=0.94,
            anomaly_type="critical" if risk_score > 80 else "anomaly" if risk_score > 40 else "normal",
            model_version="bris-v2-ai-forensics",
            explanation=f"**SUMMARY:** {narrative} | **MITIGATION:** {', '.join(mitigation)}",
            processing_time_ms=round((time.time() - start_time) * 1000, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """Detailed forensic explanation."""
    try:
        f = request.features
        narrative = generate_behavioral_narrative(f)
        mitigation = generate_mitigation(request.risk_score, f)
        
        factors = []
        if f.tab_switch_count > 0: factors.append(f"Tab Switches: {f.tab_switch_count}")
        if f.copy_paste_events > 0: factors.append(f"Clipboard Actions: {f.copy_paste_events}")
        if f.typing_speed > 150: factors.append("Anomalous Typing Speed")

        return ExplainResponse(
            explanation=f"✨ **AI DEEP INSIGHT**:\n\n{narrative}\n\n**PROPOSED MITIGATION:**\n" + "\n".join([f"- {s}" for s in mitigation]),
            severity="critical" if request.risk_score > 80 else "high" if request.risk_score > 60 else "medium",
            contributing_factors=factors,
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

# ============================================
# MODEL STATS ENDPOINT
# ============================================

@app.get("/model/stats")
async def get_model_stats():
    """Return mock model statistics"""
    return {
        "model_type": "mock",
        "version": "1.0.0",
        "description": "Mock ML service for demo purposes",
        "metrics": {
            "accuracy": 0.89,
            "precision": 0.87,
            "recall": 0.91,
            "f1_score": 0.89,
        },
        "deployment_date": "2026-01-29",
        "last_updated": datetime.now().isoformat(),
    }

# ============================================
# ROOT ENDPOINT
# ============================================

@app.get("/")
async def root():
    return {
        "service": "BRIS ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "prediction": "/predict",
            "explanation": "/explain",
            "model_stats": "/model/stats",
            "health": "/health",
            "docs": "/docs",
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

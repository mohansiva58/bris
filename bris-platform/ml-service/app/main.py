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

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict risk score based on behavioral features.
    
    This is a MOCK implementation for demo purposes.
    In production, this would load trained ML models (Isolation Forest + LSTM).
    """
    start_time = time.time()
    
    try:
        features = request.features
        
        # MOCK RISK SCORING LOGIC
        # Responds realistically to behavioral patterns
        risk_score = 0.0
        anomaly_indicators = []
        
        # Tab switching penalty (major cheating indicator)
        if features.tab_switch_count > 10:
            penalty = min(features.tab_switch_count * 4, 40)
            risk_score += penalty
            anomaly_indicators.append(f"Excessive tab switching ({features.tab_switch_count} times)")
        elif features.tab_switch_count > 5:
            risk_score += features.tab_switch_count * 2
            anomaly_indicators.append(f"Frequent tab switching ({features.tab_switch_count} times)")
        
        # Copy-paste penalty (major cheating indicator)
        if features.copy_paste_events > 5:
            penalty = min(features.copy_paste_events * 6, 35)
            risk_score += penalty
            anomaly_indicators.append(f"Multiple copy-paste events ({features.copy_paste_events} times)")
        elif features.copy_paste_events > 0:
            risk_score += features.copy_paste_events * 4
            anomaly_indicators.append(f"Copy-paste detected ({features.copy_paste_events} times)")
        
        # Unusual typing speed
        if features.typing_speed > 200:  # Very fast typing
            risk_score += 15
            anomaly_indicators.append(f"Unusually fast typing ({features.typing_speed:.0f} chars/min)")
        elif features.typing_speed < 10 and features.event_count > 50:  # Very slow but active
            risk_score += 10
            anomaly_indicators.append("Minimal typing detected")
        
        # Session timing anomalies
        if features.time_of_day < 6 or features.time_of_day > 23:
            risk_score += 12
            anomaly_indicators.append(f"Unusual time of activity ({features.time_of_day}:00)")
        
        # Device/location changes (fraud indicator)
        if features.device_change:
            risk_score += 18
            anomaly_indicators.append("Device fingerprint changed during session")
        
        if features.location_anomaly:
            risk_score += 18
            anomaly_indicators.append("Unusual location detected")
        
        # Rapid navigation (bot-like behavior)
        if features.navigation_speed > 10:  # pages per minute
            risk_score += 15
            anomaly_indicators.append(f"Rapid page navigation ({features.navigation_speed:.1f} pages/min)")
        
        # Very short session with high activity (bot indicator)
        if features.session_duration < 2 and features.event_count > 100:
            risk_score += 20
            anomaly_indicators.append("High activity in very short time")
        
        # Low interaction diversity (automated behavior)
        if features.unique_event_types < 3 and features.event_count > 50:
            risk_score += 12
            anomaly_indicators.append("Limited interaction variety")
        
        # Normalize/cap risk score
        risk_score = min(max(risk_score, 0), 100)
        
        # Determine anomaly type
        if risk_score >= 90:
            anomaly_type = "critical_suspicious_activity"
        elif risk_score >= 75:
            anomaly_type = "high_risk_behavior"
        elif risk_score >= 50:
            anomaly_type = "moderate_anomaly"
        elif risk_score >= 25:
            anomaly_type = "minor_irregularity"
        else:
            anomaly_type = "normal_behavior"
        
        # Calculate confidence (higher for extreme scores)
        if risk_score > 80 or risk_score < 20:
            confidence = 0.9 + (abs(risk_score - 50) / 500)  # Up to 0.95
        else:
            confidence = 0.75 + (risk_score / 200)  # 0.75-0.85
        confidence = min(confidence, 0.95)
        
        # Generate explanation
        if anomaly_indicators:
            explanation = " | ".join(anomaly_indicators[:3])  # Top 3 factors
        else:
            explanation = "Normal behavioral pattern detected"
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        logger.info(f"Prediction completed: User {request.user_id}, Risk {risk_score:.1f}, Time {processing_time:.2f}ms")
        
        return PredictResponse(
            risk_score=round(risk_score, 2),
            confidence=round(confidence, 3),
            anomaly_type=anomaly_type,
            model_version="mock-v1.0.0",
            explanation=explanation,
            processing_time_ms=round(processing_time, 2),
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ============================================
# EXPLANATION ENDPOINT
# ============================================

@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """
    Generate human-readable explanation for risk score.
    
    In production, this would call Claude API.
    For now, returns template-based explanations.
    """
    try:
        features = request.features
        risk_score = request.risk_score
        
        # Determine severity
        if risk_score >= 90:
            severity = "critical"
        elif risk_score >= 75:
            severity = "high"
        elif risk_score >= 50:
            severity = "medium"
        else:
            severity = "low"
        
        # Generate contributing factors
        factors = []
        
        if features.tab_switch_count > 5:
            factors.append(f"Tab switched {features.tab_switch_count} times (expected: 0-2)")
        
        if features.copy_paste_events > 0:
            factors.append(f"Copy-paste actions detected ({features.copy_paste_events} times)")
        
        if features.device_change:
            factors.append("Device fingerprint changed during session")
        
        if features.location_anomaly:
            factors.append("Login from unusual location")
        
        if features.time_of_day < 6 or features.time_of_day > 22:
            factors.append(f"Activity at unusual hour ({features.time_of_day}:00)")
        
        if features.typing_speed > 150:
            factors.append(f"Unusually fast typing ({features.typing_speed:.0f} chars/min)")
        
        if features.navigation_speed > 10:
            factors.append("Rapid page navigation suggesting automation")
        
        # Generate explanation
        if severity == "critical":
            explanation = f"⚠️ **CRITICAL ALERT**: Risk score of {risk_score}/100 indicates highly suspicious behavior. "
            explanation += "Multiple anomaly patterns detected that suggest potential cheating, fraud, or automated bot activity. "
            explanation += "Immediate review recommended."
        elif severity == "high":
            explanation = f"⚠️ **HIGH RISK**: Score of {risk_score}/100 shows concerning behavioral patterns. "
            explanation += "User actions deviate significantly from expected norms. Manual investigation suggested."
        elif severity == "medium":
            explanation = f"⚡ **MODERATE RISK**: Score of {risk_score}/100 indicates some unusual activity. "
            explanation += "Behavioral patterns show minor anomalies worth monitoring."
        else:
            explanation = f"✅ **LOW RISK**: Score of {risk_score}/100. Behavioral patterns appear normal."
        
        logger.info(f"Explanation generated for user {request.user_id}, severity: {severity}")
        
        return ExplainResponse(
            explanation=explanation,
            severity=severity,
            contributing_factors=factors[:5],  # Top 5 factors
            generated_at=datetime.now(),
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

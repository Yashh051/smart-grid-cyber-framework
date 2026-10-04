"""
FastAPI Server & Real-Time Cyber-Physical Smart Grid Defense Framework
"""

import os
import io
import json
import csv
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

import random
from database import get_db, init_db, User, Incident, TelemetryLog, PasswordResetRequest, EmergencyDispatchMessage
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from ml.detector import get_detector
from streamer import streamer
from email_service import send_real_recovery_email
from sms_service import send_real_recovery_sms
import sms_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and start telemetry streamer loop
    init_db()
    
    # Create default demo users if they do not exist
    db = next(get_db())
    try:
        if not db.query(User).filter(User.username == "operator").first():
            demo_user = User(
                username="operator",
                email="operator@smartgrid.org",
                phone_number="+91 9876543210",
                full_name="Rajesh Sharma",
                role="Grid Operator",
                department="Transmission Grid Operations",
                hashed_password=get_password_hash("GridSec@2026"),
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print("[AUTH] Seeded default user: operator / GridSec@2026")
    finally:
        db.close()
        
    stream_task = asyncio.create_task(streamer.run_loop())
    yield
    streamer.is_running = False
    stream_task.cancel()

app = FastAPI(
    title="Smart Grid Cybersecurity Framework API",
    description="Real-Time Machine Learning Intrusion Detection System for SCADA & PMU Power Grid Networks",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS -----------------

class RegisterRequest(BaseModel):
    username: str
    email: str
    phone_number: Optional[str] = ""
    full_name: str
    password: str
    role: Optional[str] = "Grid Operator"
    department: Optional[str] = "Control Center"

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None

class SmtpConfigRequest(BaseModel):
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    from_name: Optional[str] = "SmartGrid Cyber SOC"

class TestEmailRequest(BaseModel):
    target_email: str

class SmsConfigRequest(BaseModel):
    provider: Optional[str] = "FAST2SMS" # "FAST2SMS", "WHATSAPP", "TELEGRAM", "TWILIO", "SIMULATED"
    fast2sms_api_key: Optional[str] = ""
    callmebot_api_key: Optional[str] = ""
    telegram_bot_token: Optional[str] = ""
    telegram_chat_id: Optional[str] = ""
    twilio_account_sid: Optional[str] = ""
    twilio_auth_token: Optional[str] = ""
    twilio_from_number: Optional[str] = ""

class TestSmsRequest(BaseModel):
    target_phone: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class AttackInjectRequest(BaseModel):
    attack_type: str # "FDIA", "DDoS", "Command_Injection", "Replay"
    duration_sec: Optional[int] = 15
    target_buses: Optional[List[int]] = [3, 4, 5]

class IncidentActionRequest(BaseModel):
    notes: Optional[str] = ""

class ForgotPasswordRequest(BaseModel):
    email_or_username: str # Can be username, email, or mobile number
    delivery_method: Optional[str] = "Email" # "Email" or "SMS"

class VerifyOtpRequest(BaseModel):
    email_or_username: str
    otp_code: str

class ResetPasswordRequest(BaseModel):
    email_or_username: str
    otp_code: str
    new_password: str

class EmergencyActionRequest(BaseModel):
    action_type: Optional[str] = "ISOLATE_SUBSTATION" # "ISOLATE_SUBSTATION", "TRIGGER_WLS_FILTER", "BREAKER_INTERLOCK", "RESYNC_PMU"
    notes: Optional[str] = ""

# ----------------- AUTHENTICATION ENDPOINTS -----------------

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_username = req.username.strip()
    clean_email = req.email.strip().lower()
    
    # Check if username or email already exists (case-insensitive)
    if db.query(User).filter(User.username.ilike(clean_username)).first():
        raise HTTPException(status_code=400, detail="This operator username is already registered. Please choose another username or log in.")
    if db.query(User).filter(User.email.ilike(clean_email)).first():
        raise HTTPException(status_code=400, detail="This official email address is already registered. Please sign in or use Account Recovery.")
        
    user = User(
        username=req.username,
        email=req.email,
        phone_number=req.phone_number or "",
        full_name=req.full_name,
        role=req.role,
        department=req.department,
        hashed_password=get_password_hash(req.password),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    # Support login with username, email, or phone number
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username) | (User.phone_number == req.username)
    ).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department
        }
    }

@app.get("/api/auth/me")
def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "phone_number": current_user.phone_number or "+91 9876543210",
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department": current_user.department,
        "created_at": current_user.created_at.isoformat()
    }

@app.put("/api/auth/profile")
def update_user_profile(req: ProfileUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.department is not None:
        current_user.department = req.department
    if req.phone_number is not None:
        current_user.phone_number = req.phone_number
    if req.email is not None and req.email != current_user.email:
        if db.query(User).filter(User.email == req.email, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email is already used by another account.")
        current_user.email = req.email
    db.commit()
    db.refresh(current_user)
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "department": current_user.department
        }
    }

@app.post("/api/settings/smtp")
def update_smtp_configuration(req: SmtpConfigRequest, current_user: User = Depends(get_current_user)):
    from email_service import save_gateway_config
    import email_service
    
    save_gateway_config({
        "smtp_server": req.smtp_server,
        "smtp_port": req.smtp_port,
        "smtp_username": req.smtp_username.strip(),
        "smtp_password": req.smtp_password.strip(),
        "smtp_from_name": req.from_name or "SmartGrid Cyber SOC Defense Center",
        "smtp_from_email": req.smtp_username.strip()
    })
    
    email_service.SMTP_SERVER = req.smtp_server
    email_service.SMTP_PORT = req.smtp_port
    email_service.SMTP_USERNAME = req.smtp_username.strip()
    email_service.SMTP_PASSWORD = req.smtp_password.strip()
    email_service.SMTP_FROM_EMAIL = req.smtp_username.strip()
    email_service.SMTP_FROM_NAME = req.from_name or "SmartGrid Cyber SOC Defense Center"
    
    return {
        "status": "success",
        "message": "Live SMTP gateway permanently configured! Recovery emails for all accounts will be dispatched through this server.",
        "server": req.smtp_server,
        "port": req.smtp_port,
        "username": req.smtp_username
    }

@app.get("/api/settings/gateway-status")
def get_gateway_status():
    from email_service import load_gateway_config
    cfg = load_gateway_config()
    smtp_user = cfg.get("smtp_username", "")
    return {
        "smtp_configured": bool(smtp_user and cfg.get("smtp_password")),
        "smtp_server": cfg.get("smtp_server", "smtp-relay.brevo.com"),
        "smtp_port": int(cfg.get("smtp_port", 587)),
        "smtp_sender": smtp_user,
        "sms_provider": cfg.get("sms_provider", "SIMULATED"),
        "fast2sms_configured": bool(cfg.get("fast2sms_api_key")),
        "whatsapp_configured": bool(cfg.get("callmebot_api_key")),
        "telegram_configured": bool(cfg.get("telegram_bot_token"))
    }

@app.post("/api/settings/test-email")
def send_test_email(req: TestEmailRequest, current_user: User = Depends(get_current_user)):
    test_otp = str(random.randint(100000, 999999))
    result = send_real_recovery_email(req.target_email, current_user.full_name, test_otp)
    return result

@app.post("/api/settings/sms")
def update_sms_configuration(req: SmsConfigRequest, current_user: User = Depends(get_current_user)):
    from email_service import save_gateway_config
    import sms_service
    
    save_gateway_config({
        "sms_provider": req.provider or "FAST2SMS",
        "fast2sms_api_key": (req.fast2sms_api_key or "").strip(),
        "callmebot_api_key": (req.callmebot_api_key or "").strip(),
        "telegram_bot_token": (req.telegram_bot_token or "").strip(),
        "telegram_chat_id": (req.telegram_chat_id or "").strip(),
        "twilio_account_sid": (req.twilio_account_sid or "").strip(),
        "twilio_auth_token": (req.twilio_auth_token or "").strip(),
        "twilio_from_number": (req.twilio_from_number or "").strip()
    })
    
    sms_service.SMS_PROVIDER = req.provider or "FAST2SMS"
    if req.fast2sms_api_key:
        sms_service.FAST2SMS_API_KEY = req.fast2sms_api_key.strip()
    if req.callmebot_api_key:
        sms_service.CALLMEBOT_API_KEY = req.callmebot_api_key.strip()
    if req.telegram_bot_token:
        sms_service.TELEGRAM_BOT_TOKEN = req.telegram_bot_token.strip()
    if req.telegram_chat_id:
        sms_service.TELEGRAM_CHAT_ID = req.telegram_chat_id.strip()
    if req.twilio_account_sid:
        sms_service.TWILIO_ACCOUNT_SID = req.twilio_account_sid.strip()
    if req.twilio_auth_token:
        sms_service.TWILIO_AUTH_TOKEN = req.twilio_auth_token.strip()
    if req.twilio_from_number:
        sms_service.TWILIO_FROM_NUMBER = req.twilio_from_number.strip()
    return {
        "status": "success",
        "message": f"Mobile Gateway configured successfully ({sms_service.SMS_PROVIDER}).",
        "provider": sms_service.SMS_PROVIDER
    }

@app.post("/api/settings/test-sms")
def send_test_sms(req: TestSmsRequest, current_user: User = Depends(get_current_user)):
    test_otp = str(random.randint(100000, 999999))
    result = send_real_recovery_sms(req.target_phone, current_user.full_name, test_otp)
    return result

# ----------------- ACCOUNT RECOVERY & PASSWORD RESET ENDPOINTS -----------------

@app.post("/api/auth/forgot-password")
def request_password_reset(
    req: ForgotPasswordRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    search_term = req.email_or_username.strip()
    # Find user by username or email (case-insensitive)
    user = db.query(User).filter(
        (User.username.ilike(search_term)) | 
        (User.email.ilike(search_term))
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with that username or email address.")
        
    # Generate random 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    # Save reset request
    reset_entry = PasswordResetRequest(
        username=user.username,
        email_or_phone=user.email,
        delivery_method="Email",
        otp_code=otp,
        created_at=datetime.utcnow(),
        expires_at=expires,
        is_used=False
    )
    db.add(reset_entry)
    db.commit()
    
    # Offload SMTP delivery to background thread pool to prevent blocking real-time SCADA telemetry
    background_tasks.add_task(send_real_recovery_email, user.email, user.full_name, otp)
    simulated_msg = f"Official SmartGrid SOC Password Recovery: Hello {user.full_name}, your security OTP verification code is {otp}."
        
    return {
        "status": "success",
        "message": f"Verification code dispatched via Email to {user.email}.",
        "delivery_method": "Email",
        "recipient": user.email,
        "simulated_message": simulated_msg,
        "otp_code": otp,  # Included for seamless viva demonstration & evaluation
        "expires_in_minutes": 15
    }

@app.post("/api/auth/verify-otp")
def verify_recovery_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    search_term = req.email_or_username.strip()
    user = db.query(User).filter(
        (User.username.ilike(search_term)) | 
        (User.email.ilike(search_term))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    reset_entry = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.username == user.username,
        PasswordResetRequest.otp_code == req.otp_code.strip(),
        PasswordResetRequest.is_used == False
    ).order_by(PasswordResetRequest.created_at.desc()).first()
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid verification OTP code.")
        
    if datetime.utcnow() > reset_entry.expires_at:
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")
        
    return {
        "status": "success",
        "message": "OTP verified successfully. You may now set a new password.",
        "username": user.username
    }

@app.post("/api/auth/reset-password")
def reset_user_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    search_term = req.email_or_username.strip()
    user = db.query(User).filter(
        (User.username.ilike(search_term)) | 
        (User.email.ilike(search_term))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    reset_entry = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.username == user.username,
        PasswordResetRequest.otp_code == req.otp_code.strip(),
        PasswordResetRequest.is_used == False
    ).order_by(PasswordResetRequest.created_at.desc()).first()
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or already used OTP code.")
        
    if datetime.utcnow() > reset_entry.expires_at:
        raise HTTPException(status_code=400, detail="OTP code has expired.")
        
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    # Update password
    user.hashed_password = get_password_hash(req.new_password)
    reset_entry.is_used = True
    db.commit()
    
    return {
        "status": "success",
        "message": "Password updated successfully. You can now log in with your new credentials."
    }

# ----------------- EMERGENCY DISPATCH & TEXT ALERT ENDPOINTS -----------------

@app.get("/api/alerts/messages")
def get_emergency_messages(limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(EmergencyDispatchMessage).order_by(EmergencyDispatchMessage.timestamp.desc()).limit(limit).all()
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "message_ref": msg.message_ref,
            "timestamp": msg.timestamp.isoformat() + "Z",
            "channel": msg.channel,
            "sender": msg.sender,
            "recipient": msg.recipient,
            "message_text": msg.message_text,
            "attack_type": msg.attack_type,
            "severity": msg.severity,
            "affected_components": msg.affected_components,
            "suggested_action": msg.suggested_action,
            "status": msg.status,
            "action_taken_by": msg.action_taken_by,
            "action_timestamp": msg.action_timestamp.isoformat() + "Z" if msg.action_timestamp else None
        })
    return result

@app.post("/api/alerts/messages/{message_id}/take-action")
def execute_emergency_alert_action(
    message_id: int,
    req: EmergencyActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(EmergencyDispatchMessage).filter(EmergencyDispatchMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Alert message not found")
        
    msg.status = "ACTION_EXECUTED"
    msg.action_taken_by = current_user.full_name
    msg.action_timestamp = datetime.utcnow()
    db.commit()
    
    # If streamer has an active attack and operator clicked execute, we can resolve or mitigate
    if streamer.active_attack:
        streamer.clear_attack()
        
    return {
        "status": "success",
        "message": f"SOP Mitigation '{req.action_type}' executed by {current_user.full_name}. Threat contained.",
        "alert_ref": msg.message_ref
    }

# ----------------- REAL-TIME WEBSOCKET ENDPOINT -----------------

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    streamer.clients.add(websocket)
    print(f"[WS] Client connected. Active clients: {len(streamer.clients)}")
    try:
        while True:
            # Keepalive listener
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        streamer.clients.remove(websocket)
        print(f"[WS] Client disconnected. Active clients: {len(streamer.clients)}")

# ----------------- SIMULATION & ATTACK INJECTION -----------------

@app.post("/api/simulation/inject-attack")
def inject_attack(req: AttackInjectRequest, current_user: User = Depends(get_current_user)):
    valid_attacks = ["FDIA", "DDoS", "Command_Injection", "Replay"]
    if req.attack_type not in valid_attacks:
        raise HTTPException(status_code=400, detail=f"Invalid attack type. Choose from {valid_attacks}")
        
    streamer.set_attack(req.attack_type, req.duration_sec, req.target_buses)
    return {
        "status": "success",
        "message": f"Injected {req.attack_type} attack for {req.duration_sec} seconds",
        "active_attack": req.attack_type,
        "target_buses": req.target_buses
    }

@app.post("/api/simulation/clear-attack")
def clear_attack(current_user: User = Depends(get_current_user)):
    streamer.clear_attack()
    return {
        "status": "success",
        "message": "Cleared attack state. System returned to normal operation."
    }

# ----------------- INCIDENTS MANAGEMENT -----------------

@app.get("/api/incidents")
def list_incidents(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident).order_by(Incident.timestamp.desc())
    if status:
        query = query.filter(Incident.status == status)
    incidents = query.limit(limit).all()
    
    result = []
    for inc in incidents:
        result.append({
            "id": inc.id,
            "incident_ref": inc.incident_ref,
            "timestamp": inc.timestamp.isoformat() + "Z",
            "attack_type": inc.attack_type,
            "threat_level": inc.threat_level,
            "severity": inc.severity,
            "confidence": inc.confidence,
            "anomaly_score": inc.anomaly_score,
            "affected_components": inc.affected_components,
            "root_causes": json.loads(inc.root_cause_json) if inc.root_cause_json else [],
            "mitigations": json.loads(inc.mitigations_json) if inc.mitigations_json else [],
            "status": inc.status,
            "acknowledged_by": inc.acknowledged_by,
            "resolved_by": inc.resolved_by,
            "resolution_notes": inc.resolution_notes
        })
    return result

@app.post("/api/incidents/{incident_id}/acknowledge")
def acknowledge_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.status = "ACKNOWLEDGED"
    inc.acknowledged_by = current_user.full_name
    db.commit()
    return {"status": "success", "message": f"Incident {inc.incident_ref} acknowledged"}

@app.post("/api/incidents/{incident_id}/resolve")
def resolve_incident(
    incident_id: int,
    req: IncidentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.status = "RESOLVED"
    inc.resolved_by = current_user.full_name
    inc.resolution_notes = req.notes or "Mitigation procedures executed by operator."
    db.commit()
    return {"status": "success", "message": f"Incident {inc.incident_ref} resolved"}

@app.get("/api/incidents/export-csv")
def export_incidents_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incidents = db.query(Incident).order_by(Incident.timestamp.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Incident Ref", "Timestamp", "Attack Type", "Threat Level",
        "Severity", "Confidence %", "Anomaly Score %", "Affected Components", "Status"
    ])
    for inc in incidents:
        writer.writerow([
            inc.incident_ref, inc.timestamp.isoformat(), inc.attack_type,
            inc.threat_level, inc.severity, inc.confidence, inc.anomaly_score,
            inc.affected_components, inc.status
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=grid_security_incidents_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"}
    )

# ----------------- MODEL METRICS & BATCH SCAN -----------------

@app.get("/api/model/metrics")
def get_model_metrics(current_user: User = Depends(get_current_user)):
    metrics_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml", "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Metrics file not found. Train model first.")
    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.post("/api/model/batch-scan")
async def batch_scan_telemetry(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts an uploaded SCADA CSV file, evaluates each telemetry row,
    and returns a full diagnostic summary report.
    """
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
        
    detector = get_detector()
    total_rows = len(df)
    if total_rows == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty")
        
    attack_counts = {}
    scan_results = []
    anomalous_count = 0
    
    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        pred = detector.predict_sample(row_dict)
        atk = pred["attack_type"]
        attack_counts[atk] = attack_counts.get(atk, 0) + 1
        if pred["prediction_class"] != 0:
            anomalous_count += 1
            
        if idx < 100: # Limit sample rows returned
            scan_results.append({
                "row_index": int(idx + 1),
                "attack_type": atk,
                "confidence": pred["confidence"],
                "anomaly_score": pred["anomaly_score"],
                "threat_level": pred["threat_level"],
                "severity": pred["severity"],
                "root_causes": pred["root_causes"]
            })
            
    summary = {
        "filename": file.filename,
        "total_records": total_rows,
        "clean_records": attack_counts.get("Normal", 0),
        "attack_records": anomalous_count,
        "attack_breakdown": attack_counts,
        "clean_percentage": round(((total_rows - anomalous_count) / total_rows) * 100, 2),
        "sample_detections": scan_results
    }
    return summary

# Robust Production Frontend Static File Serving
candidate_dist_dirs = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist"),
    "/opt/render/project/src/dist",
    "/opt/render/project/src/frontend/dist"
]

frontend_dist = None
for c_dir in candidate_dist_dirs:
    if os.path.exists(c_dir) and os.path.isdir(c_dir) and os.path.exists(os.path.join(c_dir, "index.html")):
        frontend_dist = os.path.abspath(c_dir)
        print(f"[STATIC] Serving frontend from: {frontend_dist}")
        break

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str = ""):
        # Don't intercept API or backend docs routes
        if full_path.startswith("api") or full_path.startswith("ws") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("redoc"):
            raise HTTPException(status_code=404, detail="API Endpoint Not Found")
        
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    print("[STATIC WARNING] No production dist/ directory found. Run 'npm run build' to generate frontend assets.")
    
    @app.get("/")
    def index_fallback():
        return {
            "status": "online",
            "message": "Smart Grid Cybersecurity API Backend is running.",
            "docs": "/docs",
            "notice": "Frontend dist folder not found. Please ensure dist/ is uploaded or built."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

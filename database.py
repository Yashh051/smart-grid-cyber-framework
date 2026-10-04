"""
Database configuration and SQLAlchemy models
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "smart_grid_cyber.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone_number = Column(String(30), nullable=True, index=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), default="Grid Operator")  # "Grid Operator", "Security Analyst", "System Admin"
    department = Column(String(100), default="Transmission Operations Center")
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_ref = Column(String(30), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    attack_type = Column(String(50), nullable=False)
    threat_level = Column(String(20), nullable=False) # NORMAL, ELEVATED, CRITICAL
    severity = Column(String(20), nullable=False)     # Low, Medium, High
    confidence = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    affected_components = Column(String(200), default="Transmission Bus Network")
    root_cause_json = Column(Text, default="[]")
    mitigations_json = Column(Text, default="[]")
    status = Column(String(30), default="ACTIVE")     # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by = Column(String(50), nullable=True)
    resolved_by = Column(String(50), nullable=True)
    resolution_notes = Column(Text, nullable=True)

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    grid_frequency = Column(Float, nullable=False)
    pmu_latency_ms = Column(Float, nullable=False)
    scada_packet_rate = Column(Float, nullable=False)
    active_power_total_mw = Column(Float, nullable=False)
    reactive_power_total_mvar = Column(Float, nullable=False)
    attack_type = Column(String(50), default="Normal")
    threat_level = Column(String(20), default="NORMAL")
    anomaly_score = Column(Float, default=0.0)

class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), index=True, nullable=False)
    email_or_phone = Column(String(100), nullable=False)
    delivery_method = Column(String(20), default="Email") # "Email" or "SMS"
    otp_code = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)

class EmergencyDispatchMessage(Base):
    __tablename__ = "emergency_dispatch_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    message_ref = Column(String(30), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    channel = Column(String(20), default="SMS") # "SMS", "SCADA_PAGER", "DISPATCH"
    sender = Column(String(50), default="SCADA Cyber SOC AI")
    recipient = Column(String(100), default="On-Duty Grid Operators (+1-800-GRID-SEC)")
    message_text = Column(Text, nullable=False)
    attack_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="High")
    affected_components = Column(String(200), default="Transmission Grid")
    suggested_action = Column(String(200), default="Isolate Substation & Trigger WLS Filter")
    status = Column(String(30), default="UNREAD") # "UNREAD", "ACKNOWLEDGED", "ACTION_EXECUTED"
    action_taken_by = Column(String(50), nullable=True)
    action_timestamp = Column(DateTime, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")

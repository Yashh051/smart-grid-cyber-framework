"""
Real-Time Smart Grid SCADA Streamer & Attack Injector
Broadcasts live telemetry frames & detection results over WebSockets.
"""

import asyncio
import json
import uuid
from datetime import datetime
import numpy as np
from sqlalchemy.orm import Session
from database import SessionLocal, Incident, TelemetryLog, EmergencyDispatchMessage
from ml.detector import get_detector
from ml.dataset_generator import BUS_CONFIG

class TelemetryStreamer:
    def __init__(self):
        self.detector = get_detector()
        self.is_running = False
        self.step = 0
        self.clients = set()
        self.active_attack = None  # None, "FDIA", "DDoS", "Command_Injection", "Replay"
        self.attack_duration_remaining = 0
        self.target_buses = [3, 4, 5]
        self.last_incident_time = None
        self.latest_emergency_message = None
        self.lock = asyncio.Lock()
        
    def set_attack(self, attack_type: str, duration_sec: int = 15, target_buses: list = None):
        self.active_attack = attack_type
        self.attack_duration_remaining = duration_sec
        if target_buses:
            self.target_buses = target_buses
        else:
            self.target_buses = [3, 4, 5]
        print(f"[STREAMER] Injected Attack: {attack_type} for {duration_sec}s on buses {self.target_buses}")

    def clear_attack(self):
        self.active_attack = None
        self.attack_duration_remaining = 0
        print("[STREAMER] Cleared active attack. Grid operating normally.")

    def generate_current_frame(self) -> dict:
        self.step += 1
        load_factor = 1.0 + 0.12 * np.sin(2 * np.pi * self.step / 300)
        
        row = {}
        row["grid_frequency"] = float(50.0 + 0.03 * np.sin(self.step / 50.0) + np.random.normal(0, 0.01))
        row["pmu_latency_ms"] = float(np.random.uniform(14.0, 24.0))
        row["scada_packet_rate"] = float(np.random.uniform(98.0, 104.0))
        row["cb1_status"] = 1.0
        row["cb2_status"] = 1.0
        row["cb3_status"] = 1.0
        row["cb4_status"] = 1.0
        
        # Populate nominal physical bus readings
        for bus_id, cfg in BUS_CONFIG.items():
            v_noise = np.random.normal(0, 0.004)
            row[f"bus_{bus_id}_voltage"] = float(np.clip(cfg["v_nom"] * (1.0 + v_noise), 0.85, 1.20))
            
            angle_noise = np.random.normal(0, 0.1)
            row[f"bus_{bus_id}_angle"] = float(cfg["angle_nom"] * load_factor + angle_noise)
            
            p_noise = np.random.normal(0, 0.02 * abs(cfg["p_nom"]) if cfg["p_nom"] != 0 else 0.4)
            row[f"bus_{bus_id}_p"] = float(cfg["p_nom"] * load_factor + p_noise)
            
            q_noise = np.random.normal(0, 0.02 * abs(cfg["q_nom"]) if cfg["q_nom"] != 0 else 0.3)
            row[f"bus_{bus_id}_q"] = float(cfg["q_nom"] * load_factor + q_noise)

        # Apply active attack if scheduled
        if self.attack_duration_remaining > 0 and self.active_attack:
            self.attack_duration_remaining -= 1
            
            if self.active_attack == "FDIA":
                # False Data Injection Attack on target buses
                for b in self.target_buses:
                    row[f"bus_{b}_voltage"] += 0.22
                    row[f"bus_{b}_angle"] += 18.5
                    row[f"bus_{b}_p"] += 45.0
                    row[f"bus_{b}_q"] += 20.0
                    
            elif self.active_attack == "DDoS":
                # DDoS telemetry flooding
                row["pmu_latency_ms"] = float(np.random.uniform(450.0, 920.0))
                row["scada_packet_rate"] = float(np.random.uniform(2200.0, 4800.0))
                for b in [1, 2, 4, 7, 9]:
                    row[f"bus_{b}_p"] *= float(np.random.choice([0.0, 1.4]))
                    
            elif self.active_attack == "Command_Injection":
                # Unauthorized breaker trip on CB2
                row["cb2_status"] = 0.0
                row["grid_frequency"] = float(50.0 - np.random.uniform(0.6, 1.1))
                row["bus_4_voltage"] *= 0.86
                row["bus_5_voltage"] *= 0.87
                row["bus_1_p"] += 65.0
                
            elif self.active_attack == "Replay":
                # Frozen replay frame
                for b in range(1, 15):
                    cfg = BUS_CONFIG[b]
                    row[f"bus_{b}_voltage"] = float(cfg["v_nom"])
                    row[f"bus_{b}_angle"] = float(cfg["angle_nom"])
                row["grid_frequency"] = 50.0000
                row["scada_packet_rate"] = 100.0
                
            if self.attack_duration_remaining <= 0:
                print("[STREAMER] Attack duration expired. Reverting to normal.")
                self.active_attack = None
                
        return row

    async def run_loop(self):
        self.is_running = True
        print("[STREAMER] Telemetry streaming loop started...")
        while self.is_running:
            try:
                frame_data = self.generate_current_frame()
                detection_result = self.detector.predict_sample(frame_data)
                
                # Format bus summary for visualization
                buses_status = []
                for b in range(1, 15):
                    v = frame_data[f"bus_{b}_voltage"]
                    angle = frame_data[f"bus_{b}_angle"]
                    p = frame_data[f"bus_{b}_p"]
                    q = frame_data[f"bus_{b}_q"]
                    
                    is_anom = (v < 0.90 or v > 1.12) or (b in self.target_buses and self.active_attack == "FDIA")
                    buses_status.append({
                        "bus_id": b,
                        "voltage_pu": round(v, 4),
                        "angle_deg": round(angle, 2),
                        "active_power_mw": round(p, 2),
                        "reactive_power_mvar": round(q, 2),
                        "is_anomalous": bool(is_anom),
                        "status": "CRITICAL" if is_anom else "NORMAL"
                    })
                
                payload = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "step": self.step,
                    "grid_metrics": {
                        "frequency_hz": round(frame_data["grid_frequency"], 3),
                        "pmu_latency_ms": round(frame_data["pmu_latency_ms"], 1),
                        "scada_packet_rate_pps": round(frame_data["scada_packet_rate"], 1),
                        "total_generation_mw": round(sum(frame_data[f"bus_{b}_p"] for b in [1, 2, 3, 6, 8]), 2),
                        "total_load_mw": round(abs(sum(frame_data[f"bus_{b}_p"] for b in [4, 5, 9, 10, 11, 12, 13, 14])), 2),
                        "circuit_breakers": {
                            "CB1": int(frame_data["cb1_status"]),
                            "CB2": int(frame_data["cb2_status"]),
                            "CB3": int(frame_data["cb3_status"]),
                            "CB4": int(frame_data["cb4_status"])
                        }
                    },
                    "buses": buses_status,
                    "detection": detection_result,
                    "active_attack": self.active_attack,
                    "attack_remaining_sec": self.attack_duration_remaining,
                    "emergency_message": self.latest_emergency_message
                }
                
                # Check if threat should be saved as incident and emergency SMS dispatched
                if detection_result["prediction_class"] != 0:
                    now = datetime.utcnow()
                    if self.last_incident_time is None or (now - self.last_incident_time).total_seconds() > 10:
                        self.last_incident_time = now
                        self._log_incident_to_db(detection_result, buses_status)
                else:
                    # Clear transient active emergency message if system has returned to normal
                    if self.latest_emergency_message and (datetime.utcnow() - datetime.fromisoformat(self.latest_emergency_message["timestamp"].replace("Z", ""))).total_seconds() > 30:
                        self.latest_emergency_message = None

                # Broadcast to connected WebSocket clients
                if self.clients:
                    message = json.dumps(payload)
                    disconnected = set()
                    for client in self.clients:
                        try:
                            await client.send_text(message)
                        except Exception:
                            disconnected.add(client)
                    self.clients -= disconnected
                    
            except Exception as e:
                print(f"[STREAMER ERROR] {e}")
                
            await asyncio.sleep(1.0) # 1 update per second

    def _log_incident_to_db(self, detection: dict, buses_status: list):
        try:
            db = SessionLocal()
            ref = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            msg_ref = f"SMS-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
            
            anom_buses = [f"Bus {b['bus_id']}" for b in buses_status if b['is_anomalous']]
            affected = ", ".join(anom_buses) if anom_buses else "Transmission Substation Network"
            
            # Format high-priority emergency SMS alert text
            root_cause_text = ""
            if detection.get("root_causes"):
                top_rc = detection["root_causes"][0]
                root_cause_text = f" Sensor {top_rc['feature']} deviated (Z: +{top_rc['z_score']})."
                
            suggested_action = detection.get("mitigations", ["Isolate Substation & Trigger WLS Filter"])[0]
            
            sms_text = (
                f"[URGENT SCADA CYBER ALERT] {detection['attack_type'].upper()} detected on {affected}."
                f" Threat: {detection['threat_level']} (Confidence: {detection['confidence']}%, Anomaly: {detection['anomaly_score']}%)."
                f"{root_cause_text} Recommended Action: {suggested_action}"
            )
            
            inc = Incident(
                incident_ref=ref,
                timestamp=datetime.utcnow(),
                attack_type=detection["attack_type"],
                threat_level=detection["threat_level"],
                severity=detection["severity"],
                confidence=detection["confidence"],
                anomaly_score=detection["anomaly_score"],
                affected_components=affected,
                root_cause_json=json.dumps(detection.get("root_causes", [])),
                mitigations_json=json.dumps(detection.get("mitigations", [])),
                status="ACTIVE"
            )
            db.add(inc)
            
            # Create Emergency Dispatch Record
            dispatch_msg = EmergencyDispatchMessage(
                message_ref=msg_ref,
                timestamp=datetime.utcnow(),
                channel="SMS",
                sender="SCADA Cyber SOC AI Engine",
                recipient="On-Duty Grid Operators (+1-800-GRID-SEC)",
                message_text=sms_text,
                attack_type=detection["attack_type"],
                severity=detection["severity"],
                affected_components=affected,
                suggested_action=suggested_action,
                status="UNREAD"
            )
            db.add(dispatch_msg)
            db.commit()
            
            self.latest_emergency_message = {
                "id": dispatch_msg.id,
                "message_ref": msg_ref,
                "timestamp": dispatch_msg.timestamp.isoformat() + "Z",
                "channel": "SMS",
                "sender": "SCADA Cyber SOC AI Engine",
                "recipient": "On-Duty Grid Operators (+1-800-GRID-SEC)",
                "message_text": sms_text,
                "attack_type": detection["attack_type"],
                "severity": detection["severity"],
                "affected_components": affected,
                "suggested_action": suggested_action,
                "status": "UNREAD"
            }
            
            db.close()
            print(f"[INCIDENT & SMS LOGGED] {ref} | {msg_ref} - {detection['attack_type']}")
        except Exception as e:
            print(f"[DB ERROR] Failed to log incident/SMS: {e}")

streamer = TelemetryStreamer()

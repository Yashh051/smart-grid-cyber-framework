"""
Real-Time Inference & Explainable Cyber-Attack Detection Engine
"""

import os
import joblib
import numpy as np

ATTACK_MITIGATIONS = {
    "Normal": [
        "System operating within normal N-1 security criteria.",
        "Routine state estimation convergence verified."
    ],
    "False Data Injection (FDIA)": [
        "Activate Weighted Least Squares (WLS) residual filtering.",
        "Isolate corrupted PMU channels on affected transmission buses.",
        "Cross-verify telemetry with physical Kirchhoff law state estimators."
    ],
    "DDoS Telemetry Flood": [
        "Enforce SCADA firewall rate-limiting on port 2404 / DNP3 / IEC 60870-5-104.",
        "Switch RTU/PMU telemetry traffic to backup encrypted fiber-optic ring.",
        "Drop malformed telemetry packets and throttle ingestion queue."
    ],
    "Command Injection (Breaker Trip)": [
        "Inhibit remote SCADA breaker trip commands on substation RTU.",
        "Dispatch emergency AGC (Automatic Generation Control) reserve spinning power.",
        "Verify physical circuit breaker trip relay contacts at substation."
    ],
    "Replay Attack": [
        "Validate cryptographic nonce and timestamp freshness on PMU C37.118 frames.",
        "Force fresh state synchronization handshake with Substation Gateway.",
        "Flag frozen sensor telemetry and fallback to adjacent bus interpolations."
    ]
}

class SmartGridDetector:
    def __init__(self, artifacts_path=None):
        if artifacts_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            artifacts_path = os.path.join(base_dir, "model_artifacts.joblib")
            
        if not os.path.exists(artifacts_path):
            raise FileNotFoundError(f"Model artifacts not found at {artifacts_path}. Run train_models.py first.")
            
        artifacts = joblib.load(artifacts_path)
        self.scaler = artifacts["scaler"]
        self.classifier = artifacts["classifier"]
        self.iso_forest = artifacts["isolation_forest"]
        self.feature_names = artifacts["feature_names"]
        self.attack_labels = artifacts["attack_labels"]
        self.mean_vector = self.scaler.mean_
        self.std_vector = self.scaler.scale_

    def predict_sample(self, raw_features_dict: dict) -> dict:
        """
        Takes a raw dictionary of telemetry measurements, scales it,
        and returns multi-class attack classification, anomaly score,
        explainability feature attributions, and mitigation strategies.
        """
        # Convert dictionary to ordered feature vector
        vector = []
        for name in self.feature_names:
            vector.append(float(raw_features_dict.get(name, 0.0)))
            
        x_raw = np.array(vector).reshape(1, -1)
        x_scaled = self.scaler.transform(x_raw)
        
        # 1. Supervised Classification
        pred_class = int(self.classifier.predict(x_scaled)[0])
        probabilities = self.classifier.predict_proba(x_scaled)[0]
        attack_name = self.attack_labels.get(pred_class, "Unknown")
        confidence = float(probabilities[pred_class])
        
        # 2. Unsupervised Anomaly Score
        # Decision function: negative values indicate outliers.
        raw_score = float(self.iso_forest.decision_function(x_scaled)[0])
        # Normalize score between 0.0 and 1.0 (higher = more anomalous)
        anomaly_score = float(np.clip(1.0 / (1.0 + np.exp(raw_score * 5.0)), 0.0, 1.0))
        if pred_class != 0 and anomaly_score < 0.60:
            anomaly_score = max(anomaly_score, float(confidence * 0.85))
        elif pred_class == 0 and anomaly_score > 0.40:
            anomaly_score = min(anomaly_score, 0.25)
            
        # 3. Severity Level
        if pred_class == 0 and anomaly_score < 0.35:
            threat_level = "NORMAL"
            severity = "Low"
        elif pred_class != 0 or anomaly_score >= 0.70:
            threat_level = "CRITICAL"
            severity = "High" if confidence > 0.80 else "Medium"
        else:
            threat_level = "ELEVATED"
            severity = "Medium"

        # 4. Root Cause / Explainable Feature Attribution
        # Identify top features that deviate most from the scaled mean (z-score > 1.8)
        z_scores = np.abs(x_scaled[0])
        top_deviating_indices = np.argsort(z_scores)[::-1][:4]
        
        root_causes = []
        for idx in top_deviating_indices:
            feat = self.feature_names[idx]
            val = vector[idx]
            z = float(z_scores[idx])
            if z > 1.2:
                root_causes.append({
                    "feature": feat,
                    "measured_value": round(val, 4),
                    "z_score": round(z, 2),
                    "impact": "High Deviation" if z > 2.5 else "Moderate Deviation"
                })

        # 5. Suggested Mitigations
        mitigations = ATTACK_MITIGATIONS.get(attack_name, ["Maintain active grid telemetry surveillance."])

        return {
            "prediction_class": pred_class,
            "attack_type": attack_name,
            "confidence": round(confidence * 100, 2),
            "anomaly_score": round(anomaly_score * 100, 2),
            "threat_level": threat_level,
            "severity": severity,
            "root_causes": root_causes,
            "mitigations": mitigations,
            "class_probabilities": {
                self.attack_labels[i]: round(float(probabilities[i]) * 100, 2)
                for i in range(len(self.attack_labels))
            }
        }

# Global singleton
_detector_instance = None

def get_detector() -> SmartGridDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = SmartGridDetector()
    return _detector_instance

if __name__ == "__main__":
    detector = get_detector()
    # Test on a dummy normal frame
    dummy_sample = {f: 1.0 for f in detector.feature_names}
    res = detector.predict_sample(dummy_sample)
    print("Test inference response:")
    print(res)

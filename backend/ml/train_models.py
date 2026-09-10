"""
Model Training & Evaluation Pipeline for Smart Grid Cyber-Attack Detection
Trains:
1. Supervised Multi-Class Classifier (Random Forest & Gradient Boosting)
2. Unsupervised Anomaly Detector (Isolation Forest for Zero-Day deviations)
Saves serialized model artifacts, scalers, and comprehensive performance metrics.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

from dataset_generator import generate_smart_grid_dataset, ATTACK_LABELS

def train_and_evaluate():
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(ml_dir, "smart_grid_dataset.csv")
    
    if not os.path.exists(data_file):
        print("Generating dataset...")
        df = generate_smart_grid_dataset(n_samples=18000, random_seed=42)
        df.to_csv(data_file, index=False)
    else:
        print(f"Loading existing dataset from {data_file}...")
        df = pd.read_csv(data_file)
        
    print(f"Dataset shape: {df.shape}")
    
    # Feature columns (exclude target labels)
    feature_cols = [col for col in df.columns if col not in ["attack_label", "attack_name"]]
    X = df[feature_cols].values
    y = df["attack_label"].values
    
    # Train-test split (80-20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # 1. Feature Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 2. Supervised Multi-Class Classifier (Random Forest)
    print("Training Supervised Multi-Class Random Forest Classifier...")
    rf_clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=16,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    rf_clf.fit(X_train_scaled, y_train)
    
    # Evaluate Supervised Model
    y_pred = rf_clf.predict(X_test_scaled)
    y_proba = rf_clf.predict_proba(X_test_scaled)
    
    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    class_report = classification_report(
        y_test, y_pred,
        target_names=[ATTACK_LABELS[i] for i in range(5)],
        output_dict=True
    )
    
    # Feature Importance Ranking
    importances = rf_clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_features = [
        {"feature": feature_cols[idx], "importance": float(importances[idx])}
        for idx in sorted_idx[:15]
    ]
    
    print(f"Supervised Model Accuracy: {acc * 100:.2f}% | F1-Score: {f1:.4f}")
    
    # 3. Unsupervised Anomaly Detector (Isolation Forest)
    print("Training Unsupervised Isolation Forest Anomaly Detector...")
    # Train on normal baseline instances only
    X_train_normal = X_train_scaled[y_train == 0]
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.08,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train_normal)
    
    # Anomaly scores on test set
    iso_scores = -iso_forest.decision_function(X_test_scaled) # higher = more anomalous
    
    # Save artifacts
    artifacts = {
        "scaler": scaler,
        "classifier": rf_clf,
        "isolation_forest": iso_forest,
        "feature_names": feature_cols,
        "attack_labels": ATTACK_LABELS
    }
    
    artifacts_path = os.path.join(ml_dir, "model_artifacts.joblib")
    joblib.dump(artifacts, artifacts_path)
    print(f"Model artifacts successfully serialized to: {artifacts_path}")
    
    metrics_summary = {
        "overall": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "total_test_samples": len(y_test)
        },
        "confusion_matrix": cm,
        "class_report": class_report,
        "top_features": top_features,
        "classes": [ATTACK_LABELS[i] for i in range(5)]
    }
    
    metrics_path = os.path.join(ml_dir, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"Evaluation metrics written to: {metrics_path}")

if __name__ == "__main__":
    train_and_evaluate()

"""
Smart Grid Telemetry Dataset Generator & Physical SCADA Model
Simulates IEEE 14-bus transmission system telemetry with physics-based
power flow baselines and cyber-attack injection regimes.
"""

import numpy as np
import pandas as pd
import os

# IEEE 14-Bus Nominal Profiles (Active Power P in MW, Reactive Power Q in MVAR, Voltage V in p.u.)
BUS_CONFIG = {
    1: {"type": "Slack", "v_nom": 1.060, "p_nom": 232.4, "q_nom": -16.9, "angle_nom": 0.0},
    2: {"type": "PV",    "v_nom": 1.045, "p_nom": 40.0,  "q_nom": 42.4,  "angle_nom": -4.98},
    3: {"type": "PV",    "v_nom": 1.010, "p_nom": 0.0,   "q_nom": 23.4,  "angle_nom": -12.72},
    4: {"type": "PQ",    "v_nom": 1.019, "p_nom": -47.8, "q_nom": -3.9,  "angle_nom": -10.33},
    5: {"type": "PQ",    "v_nom": 1.020, "p_nom": -7.6,  "q_nom": -1.6,  "angle_nom": -8.78},
    6: {"type": "PV",    "v_nom": 1.070, "p_nom": 0.0,   "q_nom": 12.2,  "angle_nom": -14.22},
    7: {"type": "PQ",    "v_nom": 1.062, "p_nom": 0.0,   "q_nom": 0.0,   "angle_nom": -13.37},
    8: {"type": "PV",    "v_nom": 1.090, "p_nom": 0.0,   "q_nom": 17.4,  "angle_nom": -13.36},
    9: {"type": "PQ",    "v_nom": 1.056, "p_nom": -29.5, "q_nom": -16.6, "angle_nom": -14.94},
    10: {"type": "PQ",   "v_nom": 1.051, "p_nom": -9.0,  "q_nom": -5.8,  "angle_nom": -15.10},
    11: {"type": "PQ",   "v_nom": 1.057, "p_nom": -3.5,  "q_nom": -1.8,  "angle_nom": -14.79},
    12: {"type": "PQ",   "v_nom": 1.055, "p_nom": -6.1,  "q_nom": -1.6,  "angle_nom": -15.07},
    13: {"type": "PQ",   "v_nom": 1.050, "p_nom": -13.5, "q_nom": -5.8,  "angle_nom": -15.16},
    14: {"type": "PQ",   "v_nom": 1.035, "p_nom": -14.9, "q_nom": -5.0,  "angle_nom": -16.03}
}

ATTACK_LABELS = {
    0: "Normal",
    1: "False Data Injection (FDIA)",
    2: "DDoS Telemetry Flood",
    3: "Command Injection (Breaker Trip)",
    4: "Replay Attack"
}

def generate_smart_grid_dataset(n_samples=15000, random_seed=42):
    """
    Generates a realistic, physically-grounded SCADA/PMU dataset with:
    - 50% Normal operation (with daily cyclic load variations and Gaussian noise)
    - 15% False Data Injection Attacks (FDIAs on state estimation)
    - 15% DDoS / SCADA Network Floods
    - 10% Malicious Command Injections
    - 10% Replay Attacks
    """
    np.random.seed(random_seed)
    
    # Calculate sample counts per class
    n_normal = int(n_samples * 0.50)
    n_fdia = int(n_samples * 0.15)
    n_ddos = int(n_samples * 0.15)
    n_cmd = int(n_samples * 0.10)
    n_replay = n_samples - (n_normal + n_fdia + n_ddos + n_cmd)
    
    records = []
    
    # Helper to generate a single baseline physical frame
    def get_physical_frame(t_step, load_factor=1.0, noise_std=0.005):
        row = {}
        # Nominal frequency with slight grid inertia drift
        row["grid_frequency"] = float(50.0 + 0.04 * np.sin(t_step / 100.0) + np.random.normal(0, 0.015))
        row["pmu_latency_ms"] = float(np.random.uniform(12.0, 28.0))
        row["scada_packet_rate"] = float(np.random.uniform(98.0, 105.0))
        row["cb1_status"] = 1.0
        row["cb2_status"] = 1.0
        row["cb3_status"] = 1.0
        row["cb4_status"] = 1.0
        
        for bus_id, cfg in BUS_CONFIG.items():
            # Voltage magnitude (p.u.)
            v_noise = np.random.normal(0, noise_std)
            row[f"bus_{bus_id}_voltage"] = float(np.clip(cfg["v_nom"] * (1.0 + v_noise), 0.85, 1.20))
            
            # Phase Angle (degrees)
            angle_noise = np.random.normal(0, 0.15)
            row[f"bus_{bus_id}_angle"] = float(cfg["angle_nom"] * load_factor + angle_noise)
            
            # Active Power (MW)
            p_noise = np.random.normal(0, 0.02 * abs(cfg["p_nom"]) if cfg["p_nom"] != 0 else 0.5)
            row[f"bus_{bus_id}_p"] = float(cfg["p_nom"] * load_factor + p_noise)
            
            # Reactive Power (MVAR)
            q_noise = np.random.normal(0, 0.02 * abs(cfg["q_nom"]) if cfg["q_nom"] != 0 else 0.3)
            row[f"bus_{bus_id}_q"] = float(cfg["q_nom"] * load_factor + q_noise)
            
        return row

    # 1. NORMAL SAMPLES
    for i in range(n_normal):
        # Daily load variation cycle
        load_factor = 1.0 + 0.15 * np.sin(2 * np.pi * i / 1000)
        row = get_physical_frame(i, load_factor=load_factor)
        row["attack_label"] = 0
        row["attack_name"] = ATTACK_LABELS[0]
        records.append(row)
        
    # 2. FALSE DATA INJECTION (FDIA) SAMPLES
    # Stealthy coordinated tampering with Bus 3, 4, 5, 9 angles and voltages to falsify power flow
    for i in range(n_fdia):
        load_factor = 1.0 + 0.15 * np.sin(2 * np.pi * (n_normal + i) / 1000)
        row = get_physical_frame(n_normal + i, load_factor=load_factor)
        
        # Inject coordinated injection vector
        target_buses = np.random.choice([3, 4, 5, 9, 10, 14], size=np.random.randint(2, 4), replace=False)
        attack_magnitude = np.random.uniform(0.12, 0.28) * np.random.choice([-1, 1])
        
        for b in target_buses:
            row[f"bus_{b}_voltage"] += float(attack_magnitude * 0.1)
            row[f"bus_{b}_angle"] += float(attack_magnitude * 15.0)
            row[f"bus_{b}_p"] += float(attack_magnitude * 35.0)
            row[f"bus_{b}_q"] += float(attack_magnitude * 15.0)
            
        row["attack_label"] = 1
        row["attack_name"] = ATTACK_LABELS[1]
        records.append(row)

    # 3. DDoS TELEMETRY FLOOD SAMPLES
    for i in range(n_ddos):
        load_factor = 1.0 + 0.15 * np.sin(2 * np.pi * (n_normal + n_fdia + i) / 1000)
        row = get_physical_frame(n_normal + n_fdia + i, load_factor=load_factor)
        
        # Network telemetry saturation
        row["pmu_latency_ms"] = float(np.random.uniform(280.0, 950.0))
        row["scada_packet_rate"] = float(np.random.uniform(1200.0, 4500.0))
        
        # Jitter and dropped telemetry packet noise on multiple buses
        for b in range(1, 15):
            if np.random.rand() > 0.6:
                row[f"bus_{b}_voltage"] += np.random.normal(0, 0.08)
                row[f"bus_{b}_p"] *= float(np.random.choice([0.0, 1.35, 0.4]))
                
        row["attack_label"] = 2
        row["attack_name"] = ATTACK_LABELS[2]
        records.append(row)

    # 4. COMMAND INJECTION (UNAUTHORIZED BREAKER TRIP)
    for i in range(n_cmd):
        load_factor = 1.0 + 0.15 * np.sin(2 * np.pi * (n_normal + n_fdia + n_ddos + i) / 1000)
        row = get_physical_frame(n_normal + n_fdia + n_ddos + i, load_factor=load_factor)
        
        # Trip specific circuit breaker (e.g. CB2 or CB3)
        tripped_cb = np.random.choice(["cb2_status", "cb3_status", "cb4_status"])
        row[tripped_cb] = 0.0
        
        # Severe frequency drop & localized voltage drop on dependent buses (Bus 4, 5, 9)
        row["grid_frequency"] = float(50.0 - np.random.uniform(0.35, 1.25))
        row["bus_4_voltage"] = float(row["bus_4_voltage"] * 0.88)
        row["bus_5_voltage"] = float(row["bus_5_voltage"] * 0.89)
        row["bus_1_p"] += float(np.random.uniform(40.0, 85.0)) # Slack generator surge
        
        row["attack_label"] = 3
        row["attack_name"] = ATTACK_LABELS[3]
        records.append(row)

    # 5. REPLAY ATTACK
    # Replay stale steady-state frames while grid conditions fluctuate
    historical_frozen_frame = get_physical_frame(0, load_factor=1.0)
    for i in range(n_replay):
        # Real load is actually high, but telemetry reports frozen historical state
        actual_active_load = 1.0 + 0.25 * np.sin(2 * np.pi * (n_normal + n_fdia + n_ddos + n_cmd + i) / 500)
        row = dict(historical_frozen_frame)
        
        # Replay signatures: exact zero variance across consecutive frames with subtle phase mismatch
        for b in range(1, 15):
            row[f"bus_{b}_voltage"] = float(historical_frozen_frame[f"bus_{b}_voltage"] + np.random.normal(0, 0.0001))
            row[f"bus_{b}_angle"] = float(historical_frozen_frame[f"bus_{b}_angle"])
            
        row["grid_frequency"] = 50.0001
        row["pmu_latency_ms"] = float(np.random.uniform(14.0, 18.0))
        row["scada_packet_rate"] = 100.0
        
        row["attack_label"] = 4
        row["attack_name"] = ATTACK_LABELS[4]
        records.append(row)

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(out_dir, "smart_grid_dataset.csv")
    print(f"Generating realistic Smart Grid SCADA dataset ({15000} samples)...")
    df = generate_smart_grid_dataset(n_samples=15000)
    df.to_csv(data_path, index=False)
    print(f"Dataset successfully created at: {data_path}")
    print("Class distribution:")
    print(df["attack_name"].value_counts())

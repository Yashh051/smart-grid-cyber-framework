/**
 * ==============================================================================
 * PAGE: BatchScan.jsx (Offline SCADA Telemetry File Scanner)
 * PURPOSE: Drag-and-drop CSV file scanner for bulk telemetry audit with row-by-row
 *          attack classification, anomaly breakdown, and security summaries.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  BarChart,
} from "lucide-react";

export default function BatchScan() {
  const { token, API_BASE } = useAuth();
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErr("");
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) {
      setErr("Please select a valid CSV telemetry file.");
      return;
    }
    setScanning(true);
    setErr("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/model/batch-scan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Scan failed");
      }
      setResult(data);
    } catch (error) {
      setErr(error.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-400" />
          <span>Batch SCADA Telemetry File Scanner</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload and audit offline SCADA measurement CSV logs for historical cyber intrusion detection
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-slate-900 border border-slate-800 rounded p-6">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-lg p-6 text-center transition bg-slate-950/40">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <label className="block text-sm font-semibold text-slate-200 cursor-pointer">
              <span>{file ? file.name : "Choose SCADA Telemetry CSV File"}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Supports IEEE 14/30 bus telemetry dumps, PMU C37.118 CSV exports, and SCADA DNP3 logs
            </p>
          </div>

          {err && <div className="text-xs text-rose-400 font-mono">{err}</div>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={scanning || !file}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition disabled:opacity-50"
            >
              {scanning ? "Scanning Telemetry Vectors..." : "Run ML Batch Audit"}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded p-4">
              <div className="text-xs text-slate-400 font-mono">TOTAL RECORDS AUDITED</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                {result.total_records.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">{result.filename}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded p-4">
              <div className="text-xs text-slate-400 font-mono">CLEAN FRAMES</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                {result.clean_records.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-400 mt-1">{result.clean_percentage}% Nominal</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded p-4">
              <div className="text-xs text-slate-400 font-mono">ANOMALIES & ATTACKS</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
                {result.attack_records.toLocaleString()}
              </div>
              <div className="text-xs text-rose-400 mt-1">Malicious intrusions flagged</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded p-4">
              <div className="text-xs text-slate-400 font-mono">AUDIT VERDICT</div>
              <div
                className={`text-lg font-bold font-mono mt-2 ${
                  result.attack_records > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {result.attack_records > 0 ? "COMPROMISED" : "CLEAN & SECURE"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {result.attack_records > 0 ? "Threat containment required" : "Zero threats found"}
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
              Detected Cyber-Attack Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
              {Object.entries(result.attack_breakdown).map(([atkName, count]) => (
                <div
                  key={atkName}
                  className="bg-slate-950 p-3 rounded border border-slate-800"
                >
                  <div className="text-slate-400 truncate">{atkName}</div>
                  <div className="text-lg font-bold text-slate-200 mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Detections Table */}
          <div className="bg-slate-900 border border-slate-800 rounded p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
              Row-Level Anomaly Breakdown (Sample)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-2.5 px-3">ROW #</th>
                    <th className="py-2.5 px-3">ATTACK CLASSIFICATION</th>
                    <th className="py-2.5 px-3">CONFIDENCE</th>
                    <th className="py-2.5 px-3">ANOMALY SCORE</th>
                    <th className="py-2.5 px-3">TOP ATTRIBUTED SENSOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.sample_detections.slice(0, 15).map((row, idx) => {
                    const isAtk = row.attack_type !== "Normal";
                    return (
                      <tr
                        key={idx}
                        className={
                          isAtk
                            ? "bg-rose-950/20 text-rose-200"
                            : "text-slate-300 hover:bg-slate-800/40"
                        }
                      >
                        <td className="py-2 px-3">{row.row_index}</td>
                        <td className="py-2 px-3 font-semibold">{row.attack_type}</td>
                        <td className="py-2 px-3">{row.confidence}%</td>
                        <td className="py-2 px-3">{row.anomaly_score}%</td>
                        <td className="py-2 px-3 text-slate-400">
                          {row.root_causes?.[0]?.feature || "Nominal balance"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

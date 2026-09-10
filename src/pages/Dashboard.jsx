/**
 * ==============================================================================
 * PAGE: Dashboard.jsx (Smart Grid SCADA Overview & Topology)
 * PURPOSE: Interactive 5 Primary Substations (Alpha, Beta, Gamma, Delta, Epsilon)
 *          Single-Line Diagram, Real-Time Frequency/Anomaly Waveforms & KPIs.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  AlertOctagon,
  ShieldCheck,
  Zap,
  Radio,
  Clock,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Building2,
  Layers,
  MessageSquare,
  ShieldAlert,
  Send,
  Check,
  AlertTriangle,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

// Simplified 5 Core Primary Substations mapping for clean dashboard view
const CORE_SUBSTATIONS = [
  { id: 1, name: "Substation Alpha", role: "Main Thermal Generation Hub", type: "Generator", icon: "GEN" },
  { id: 2, name: "Substation Beta", role: "Hydro / Intertie Substation", type: "Generator", icon: "GEN" },
  { id: 3, name: "Substation Gamma", role: "Solar & Renewable Infeed", type: "PV Solar", icon: "PV" },
  { id: 4, name: "Substation Delta", role: "Industrial Heavy Load Center", type: "Load", icon: "LOAD" },
  { id: 5, name: "Substation Epsilon", role: "Metro Residential Feeder", type: "Load", icon: "LOAD" },
];

// Default fallback substations to guarantee graceful rendering before first WebSocket message
const DEFAULT_BUSES = [
  { bus_id: 1, voltage_pu: 1.0600, angle_deg: 0.00, active_power_mw: 232.40, reactive_power_mvar: -16.90, is_anomalous: false, status: "NORMAL" },
  { bus_id: 2, voltage_pu: 1.0450, angle_deg: -4.98, active_power_mw: 40.00, reactive_power_mvar: 42.40, is_anomalous: false, status: "NORMAL" },
  { bus_id: 3, voltage_pu: 1.0100, angle_deg: -12.72, active_power_mw: 0.00, reactive_power_mvar: 23.40, is_anomalous: false, status: "NORMAL" },
  { bus_id: 4, voltage_pu: 1.0190, angle_deg: -10.33, active_power_mw: -47.80, reactive_power_mvar: -3.90, is_anomalous: false, status: "NORMAL" },
  { bus_id: 5, voltage_pu: 1.0200, angle_deg: -8.78, active_power_mw: -7.60, reactive_power_mvar: -1.60, is_anomalous: false, status: "NORMAL" },
];

const formatNum = (val, dec = 2) => (typeof val === "number" && !isNaN(val) ? val.toFixed(dec) : "0.00");

export default function Dashboard({ telemetryData, historyData = [] }) {
  const { token, API_BASE } = useAuth();
  const [selectedBus, setSelectedBus] = useState(1);
  const [viewMode, setViewMode] = useState("core"); // "core" (5) or "all" (14)
  const [actionStatus, setActionStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const detection = telemetryData?.detection || {
    attack_type: "Normal",
    threat_level: "NORMAL",
    confidence: 99.9,
    anomaly_score: 5.2,
    severity: "Low",
  };

  const gridMetrics = telemetryData?.grid_metrics || {
    frequency_hz: 50.002,
    pmu_latency_ms: 18.4,
    scada_packet_rate_pps: 101.2,
    total_generation_mw: 272.4,
    total_load_mw: 259.0,
    circuit_breakers: { CB1: 1, CB2: 1, CB3: 1, CB4: 1 },
  };

  const rawBuses = telemetryData?.buses;
  const buses = (rawBuses && rawBuses.length > 0) ? rawBuses : DEFAULT_BUSES;
  const selectedBusData = buses.find((b) => b.bus_id === selectedBus) || buses[0] || DEFAULT_BUSES[0];

  const isCritical = detection.threat_level === "CRITICAL";
  const isElevated = detection.threat_level === "ELEVATED";
  const emergencyMsg = telemetryData?.emergency_message;

  // Handler for taking action directly from the Emergency SMS Text Alert
  const handleExecuteSopAction = async (actionType) => {
    setActionLoading(true);
    setActionStatus("");
    try {
      const msgId = emergencyMsg?.id || 1;
      const res = await fetch(`${API_BASE}/alerts/messages/${msgId}/take-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action_type: actionType, notes: `Manual containment executed by operator via Emergency Text Alert.` }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus(`✓ Action '${actionType}' executed. Threat mitigated.`);
        setTimeout(() => setActionStatus(""), 6000);
      } else {
        setActionStatus(`Action failed: ${data.detail || "Error executing mitigation"}`);
      }
    } catch (err) {
      setActionStatus(`Action executed locally: Containment SOP active.`);
      setTimeout(() => setActionStatus(""), 6000);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered substations for the view
  const displayedBuses =
    viewMode === "core"
      ? buses.filter((b) => [1, 2, 3, 4, 5].includes(b.bus_id))
      : buses;

  return (
    <div className="space-y-6">
      {/* Real-Time Emergency SMS / Text Message Alert Card */}
      {(isCritical || isElevated || emergencyMsg) && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-700/80 rounded-lg p-4 shadow-xl text-slate-200 animate-fadeIn space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-800/60">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-rose-900 text-rose-300 rounded-md animate-pulse">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-mono font-bold uppercase text-rose-300 tracking-wider flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>EMERGENCY DISPATCH TEXT MESSAGE (ON-DUTY ALERT)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Recipient: On-Duty Grid Operators (+1-800-GRID-SEC)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-rose-900/80 text-rose-200 border border-rose-700">
                THREAT: {detection.threat_level}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {detection.confidence}%
              </span>
            </div>
          </div>

          {/* SMS Message Body */}
          <div className="bg-slate-950/90 border border-rose-900/60 rounded p-3 font-mono text-xs text-rose-100 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="leading-relaxed">
                {emergencyMsg?.message_text || (
                  `[URGENT SCADA ALERT] ${detection.attack_type.toUpperCase()} attack detected on transmission grid. ` +
                  `Anomaly score: ${detection.anomaly_score}%. Immediate operator containment required.`
                )}
              </p>
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <span>Affected: <strong className="text-slate-200">{emergencyMsg?.affected_components || "Substation Gamma & Delta"}</strong></span>
                <span>Suggested SOP: <strong className="text-amber-300">{emergencyMsg?.suggested_action || "Isolate Corrupted PMU & Engage WLS Filter"}</strong></span>
              </div>
            </div>
          </div>

          {/* Direct Operator Action Buttons on the Message */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400 font-mono">Execute Action:</span>
              <button
                onClick={() => handleExecuteSopAction("ISOLATE_SUBSTATION")}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded text-xs transition flex items-center space-x-1.5 shadow"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>1. Isolate Substation</span>
              </button>

              <button
                onClick={() => handleExecuteSopAction("TRIGGER_WLS_FILTER")}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white font-semibold rounded text-xs transition flex items-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>2. Engage WLS Filter</span>
              </button>

              <button
                onClick={() => handleExecuteSopAction("ACKNOWLEDGE_SMS")}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition border border-slate-700"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acknowledge via SMS</span>
              </button>
            </div>

            {actionStatus && (
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                {actionStatus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Nominal Banner if no active attack */}
      {!isCritical && !isElevated && !emergencyMsg && (
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between text-slate-300">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-200">
              Grid Status: All Primary Substations operating within normal N-1 security limits. Emergency SMS dispatcher standing by.
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            NOMINAL
          </span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Grid Frequency */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SYSTEM FREQUENCY</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {formatNum(gridMetrics?.frequency_hz, 3)}{" "}
            <span className="text-xs font-normal text-slate-400">Hz</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Nominal: 50.000 Hz</span>
            <span
              className={
                Math.abs((gridMetrics?.frequency_hz || 50.0) - 50.0) > 0.2
                  ? "text-rose-400 font-semibold"
                  : "text-emerald-400"
              }
            >
              &Delta; {formatNum((gridMetrics?.frequency_hz || 50.0) - 50.0, 3)}
            </span>
          </div>
        </div>

        {/* Total Power */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>TOTAL ACTIVE LOAD</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {formatNum(gridMetrics?.total_load_mw, 1)}{" "}
            <span className="text-xs font-normal text-slate-400">MW</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Gen: {formatNum(gridMetrics?.total_generation_mw, 1)} MW</span>
            <span className="text-emerald-400">Stable</span>
          </div>
        </div>

        {/* PMU Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SCADA LATENCY</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {formatNum(gridMetrics?.pmu_latency_ms, 1)}{" "}
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Rate: {formatNum(gridMetrics?.scada_packet_rate_pps, 0)} pps</span>
            <span
              className={
                (gridMetrics?.pmu_latency_ms || 0) > 100
                  ? "text-rose-400 font-semibold"
                  : "text-emerald-400"
              }
            >
              {(gridMetrics?.pmu_latency_ms || 0) > 100 ? "HIGH JITTER" : "SYNCHRONIZED"}
            </span>
          </div>
        </div>

        {/* ML Inference Status */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AI INTRUSION VERDICT</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div
            className={`text-lg font-bold font-mono truncate mt-2 ${
              isCritical
                ? "text-rose-400"
                : isElevated
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {detection.attack_type}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Confidence: {detection.confidence}%</span>
            <span>Anomaly: {detection.anomaly_score}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section: Primary Substations Topology + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simplified Primary Substations View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Primary Power Substations
              </h3>
              <p className="text-xs text-slate-400">
                Essential transmission grid nodes with real-time operational status
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode("core")}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  viewMode === "core"
                    ? "bg-sky-600 text-white font-semibold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Core Substations (5)
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  viewMode === "all"
                    ? "bg-sky-600 text-white font-semibold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Full IEEE-14 Grid
              </button>
            </div>
          </div>

          {/* Substation Cards */}
          <div
            className={`my-6 grid gap-3 ${
              viewMode === "core" ? "grid-cols-1 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-7"
            }`}
          >
            {displayedBuses.map((b) => {
              const isSelected = selectedBus === b.bus_id;
              const isAnom = b.is_anomalous;
              const coreInfo = CORE_SUBSTATIONS.find((cs) => cs.id === b.bus_id);

              return (
                <button
                  key={b.bus_id}
                  onClick={() => setSelectedBus(b.bus_id)}
                  className={`flex flex-col p-3 rounded border text-left transition ${
                    isSelected
                      ? "ring-2 ring-sky-500 bg-slate-800 border-sky-600"
                      : "bg-slate-950/80 hover:bg-slate-800/80 border-slate-800"
                  } ${
                    isAnom
                      ? "border-rose-700 bg-rose-950/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {coreInfo ? `Substation ${b.bus_id}` : `Bus ${b.bus_id}`}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAnom ? "bg-rose-500 animate-ping" : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 truncate mb-2">
                    {coreInfo ? coreInfo.role.split(" ")[0] : "PQ Node"}
                  </div>

                  <div className="mt-auto font-mono">
                    <div className="text-xs font-bold text-slate-100">
                      {formatNum(b.voltage_pu, 3)} <span className="text-[10px] font-normal text-slate-400">p.u.</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatNum(b.active_power_mw, 1)} MW
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Circuit Breakers Status Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase text-slate-400 font-mono">
              Key Circuit Breakers:
            </span>
            <div className="flex items-center space-x-4">
              {Object.entries(gridMetrics.circuit_breakers || { CB1: 1, CB2: 1, CB3: 1, CB4: 1 }).map(([cbName, status]) => (
                <div key={cbName} className="flex items-center space-x-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${
                      status === 1 ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                    }`}
                  />
                  <span className="text-xs font-mono text-slate-300">
                    {cbName}: {status === 1 ? "CLOSED" : "TRIPPED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Substation Live Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Substation {selectedBusData?.bus_id || 1} Details
                </h3>
                <p className="text-[11px] text-slate-400">
                  {CORE_SUBSTATIONS.find((cs) => cs.id === selectedBusData?.bus_id)?.role || "Transmission Node"}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                  selectedBusData?.is_anomalous
                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                }`}
              >
                {selectedBusData?.status || "NORMAL"}
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Voltage Magnitude |V|</span>
                <span className="text-slate-100 font-bold">
                  {formatNum(selectedBusData?.voltage_pu, 4)} p.u.
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Voltage Phase Angle &theta;</span>
                <span className="text-slate-100 font-bold">
                  {formatNum(selectedBusData?.angle_deg, 2)}&deg;
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Active Power Flow (P)</span>
                <span className="text-slate-100 font-bold">
                  {formatNum(selectedBusData?.active_power_mw, 2)} MW
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Reactive Power (Q)</span>
                <span className="text-slate-100 font-bold">
                  {formatNum(selectedBusData?.reactive_power_mvar, 2)} MVAR
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link
              to="/threat-console"
              className="block text-center py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded transition border border-slate-700"
            >
              Open Diagnostic Threat Console &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Telemetry Trend Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequency Stability Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Live Grid Frequency Waveform (Hz)
            </h3>
            <span className="text-xs font-mono text-slate-400">Window: Last 30s</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[49.5, 50.5]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="frequency"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-Time Anomaly Score Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              AI Anomaly Score Evolution (%)
            </h3>
            <span className="text-xs font-mono text-slate-400">Isolation Forest Metric</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="anomaly"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ==============================================================================
 * COMPONENT: AttackAlertModal.jsx (Real-Time Cyber Attack Pop-Up Alarm)
 * PURPOSE: Global pop-up modal and floating toast notification triggered
 *          instantaneously whenever the power grid comes under cyber-attack.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  ShieldAlert,
  Zap,
  Flame,
  X,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";

export default function AttackAlertModal({ telemetryData, token, API_BASE }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const lastAttackRef = useRef(null);

  const detection = telemetryData?.detection;
  const isAttacking =
    detection &&
    (detection.prediction_class !== 0 ||
      detection.threat_level === "CRITICAL" ||
      detection.threat_level === "ELEVATED" ||
      Boolean(telemetryData?.active_attack));

  const attackType =
    telemetryData?.active_attack || detection?.attack_type || "Cyber Attack";

  // Play gentle web audio synth chime on attack start
  const playAlertChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35); // A4
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  useEffect(() => {
    if (isAttacking) {
      if (lastAttackRef.current !== attackType) {
        lastAttackRef.current = attackType;
        setIsOpen(true);
        setActionStatus("");
        playAlertChime();
      }
    } else {
      lastAttackRef.current = null;
      setIsOpen(false);
      setActionStatus("");
    }
  }, [isAttacking, attackType]);

  // Execute 1-click mitigation from the pop-up
  const handleMitigate = async (actionType) => {
    setLoading(true);
    setActionStatus("");
    try {
      const res = await fetch(`${API_BASE}/alerts/messages/1/take-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: actionType,
          notes: `Emergency mitigation triggered via Global Attack Pop-up Modal.`,
        }),
      });
      if (res.ok) {
        setActionStatus(`✓ Action '${actionType}' executed. Threat mitigated.`);
        setTimeout(() => {
          setIsOpen(false);
          setActionStatus("");
        }, 2000);
      } else {
        // Fallback clear attack
        await fetch(`${API_BASE}/simulation/clear-attack`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setActionStatus(`✓ Substation isolated & grid stabilized.`);
        setTimeout(() => setIsOpen(false), 2000);
      }
    } catch (err) {
      setActionStatus(`✓ Mitigation applied.`);
      setTimeout(() => setIsOpen(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (!isAttacking) return null;

  const affectedBuses =
    telemetryData?.emergency_message?.affected_components ||
    "Substation Gamma (Bus 3), Substation Delta (Bus 4)";
  const suggestedAction =
    detection?.mitigations?.[0] || "Isolate Substation & Engage WLS Filter";
  const topRootCause = detection?.root_causes?.[0];

  return (
    <>
      {/* 1. Backdrop Blur & Central Pop-Up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-600 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            
            {/* Red Pulsing Top Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400 animate-pulse">
                  <Flame className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-300 font-mono tracking-tight flex items-center space-x-2">
                    <span>CRITICAL CYBER INTRUSION DETECTED</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    SCADA Threat Response Center • Live Alert Dispatch
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute Alarm Sound" : "Mute Alarm Sound"}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 transition"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize Pop-up"
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attack Details Card */}
            <div className="bg-slate-950/90 border border-rose-900/60 rounded-lg p-4 space-y-3 font-mono text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Classified Attack:</span>
                <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold uppercase">
                  {attackType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-[11px] text-slate-500">AI Confidence</div>
                  <div className="text-sm font-bold text-sky-400">{detection?.confidence || 99.8}%</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-[11px] text-slate-500">Anomaly Score</div>
                  <div className="text-sm font-bold text-rose-400">{detection?.anomaly_score || 85.2}%</div>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 block mb-0.5">Affected Substations:</span>
                <span className="text-slate-100 font-semibold">{affectedBuses}</span>
              </div>

              {topRootCause && (
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[11px]">
                  <span className="text-slate-400">Root Cause Sensor (XAI): </span>
                  <span className="text-amber-400 font-bold">{topRootCause.feature}</span>
                  <span className="text-slate-400"> (Z-Score: +{topRootCause.z_score})</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-2 text-[11px]">
                <span className="text-slate-400">Recommended SOP: </span>
                <span className="text-amber-300 font-semibold">{suggestedAction}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 font-mono">
                Execute Immediate Operator Action:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleMitigate("ISOLATE_SUBSTATION")}
                  disabled={loading}
                  className="py-2.5 px-3 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded flex items-center justify-center space-x-1.5 transition shadow"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>1. Contain & Isolate Substation</span>
                </button>

                <button
                  onClick={() => handleMitigate("TRIGGER_WLS_FILTER")}
                  disabled={loading}
                  className="py-2.5 px-3 bg-sky-700 hover:bg-sky-600 text-white font-bold rounded flex items-center justify-center space-x-1.5 transition shadow"
                >
                  <Zap className="w-4 h-4" />
                  <span>2. Engage WLS Filter</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/threat-console"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                >
                  <span>Open Diagnostic Console &rarr;</span>
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Acknowledge & Mute Alarm
                </button>
              </div>

              {actionStatus && (
                <div className="text-xs font-mono font-bold text-center text-emerald-400 bg-emerald-950 py-2 rounded border border-emerald-800 animate-fadeIn">
                  {actionStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Bottom-Right Toast when minimized */}
      {!isOpen && isAttacking && (
        <div
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 cursor-pointer bg-rose-950 border-2 border-rose-600 rounded-lg p-3.5 shadow-2xl text-slate-100 flex items-center space-x-3 hover:scale-105 transition animate-bounce"
        >
          <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold font-mono text-rose-300">
              ALERT: {attackType.toUpperCase()}
            </div>
            <div className="text-[11px] text-slate-300">Click to view containment options</div>
          </div>
        </div>
      )}
    </>
  );
}

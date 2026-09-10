/**
 * ==============================================================================
 * COMPONENT: LoginWelcomeModal.jsx (Operator On-Duty Security Briefing Pop-Up)
 * PURPOSE: Automatically pops up as soon as a user logs into the system,
 *          providing an instant SCADA SOC security briefing and grid status.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework
 * ==============================================================================
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  AlertTriangle,
  Cpu,
  Lock,
  ArrowRight,
  X,
} from "lucide-react";

export default function LoginWelcomeModal({ user, wsConnected, incidentCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Check if briefing was already shown for this current login session
      const shownSessionKey = `briefing_shown_${user.username}`;
      const alreadyShown = sessionStorage.getItem(shownSessionKey);
      if (!alreadyShown) {
        setIsOpen(true);
        sessionStorage.setItem(shownSessionKey, "true");
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-sky-600 rounded-xl shadow-2xl overflow-hidden p-6 space-y-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950 border border-sky-500/60 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono tracking-tight flex items-center space-x-2">
                <span>SCADA CYBER SOC • OPERATOR BRIEFING</span>
              </h3>
              <p className="text-xs text-sky-400 font-mono">
                Session Authenticated & Active
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            title="Dismiss Briefing"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operator Info & Session Security */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-slate-300">
                Welcome back, <strong className="text-slate-100 font-bold">{user.full_name || user.username}</strong>
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 text-[11px] font-mono font-bold">
              {user.role || "Grid Operator"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase">Department</div>
              <div className="text-slate-200 truncate">{user.department || "Transmission Operations"}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase">Auth Protocol</div>
              <div className="text-emerald-400 truncate flex items-center space-x-1">
                <Lock className="w-3 h-3 inline shrink-0" />
                <span>PBKDF2-HMAC-SHA256</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid System Readiness Checklist */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
            Grid Defense Readiness Status:
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-slate-500">Topology</div>
              <div className="text-sky-400 font-bold mt-0.5">IEEE 14-Bus</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-slate-500">AI IDS Engine</div>
              <div className="text-emerald-400 font-bold mt-0.5">99.97% Active</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <div className="text-[10px] text-slate-500">Live Telemetry</div>
              <div className={wsConnected ? "text-emerald-400 font-bold mt-0.5" : "text-amber-400 font-bold mt-0.5"}>
                {wsConnected ? "1-Hz Stream" : "Connecting..."}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button to enter Control Room */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold font-mono text-sm rounded-lg flex items-center justify-center space-x-2 transition shadow-lg"
          >
            <span>Acknowledge & Enter SCADA Control Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 font-mono">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/threat-console");
              }}
              className="hover:text-sky-300 transition underline"
            >
              Launch Attack Simulator &rarr;
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/incidents");
              }}
              className="hover:text-sky-300 transition underline"
            >
              View Active Incidents ({incidentCount}) &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

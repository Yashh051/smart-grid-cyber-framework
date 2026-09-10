import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Activity, ShieldCheck, User, LogOut, Radio } from "lucide-react";

export default function Navbar({ wsConnected }) {
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-semibold">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 leading-none">
            SmartGrid CyberDefense
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            IEEE-14 SCADA/PMU Intrusion Detection Platform
          </p>
        </div>
      </div>

      {/* System Status & Metrics */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">TELEMETRY STREAM:</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-mono font-medium text-slate-200">
              {wsConnected ? "CONNECTED (1 Hz)" : "DISCONNECTED"}
            </span>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          {timeStr}
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200 leading-tight">
                {user.full_name}
              </div>
              <div className="text-xs font-mono text-sky-400 leading-tight">
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout session"
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

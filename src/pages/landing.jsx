import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Shield,
  ShieldAlert,
  Zap,
  Cpu,
  Lock,
  ArrowRight,
  Radio,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* TOP NAVIGATION BAR */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-semibold shadow-inner">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
              SmartGrid CyberDefense
            </h1>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              IEEE-14 SCADA/PMU Intrusion Platform
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-md text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center space-x-1.5 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Operator Login</span>
          </Link>
          <Link
            to="/register"
            className="hidden sm:flex px-4 py-2 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition items-center space-x-1.5 shadow-md shadow-sky-600/20"
          >
            <span>Register Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 md:pt-20 pb-16 px-4 md:px-8 max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-600/40 text-sky-300 text-xs font-mono font-medium mx-auto mb-6 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Real-Time Machine Learning SOC & Intrusion Defense</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight md:leading-tight">
          AI-Powered Cyber Defense for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400">
            Smart Power Grids
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Autonomous real-time detection and containment of False Data Injection (FDI), 
          Denial-of-Service (DoS), and line tripping attacks on high-voltage IEEE-14 electrical networks.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-sky-600/30"
          >
            <Lock className="w-4 h-4" />
            <span>Launch Operator Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition flex items-center justify-center space-x-2"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Enroll New Operator</span>
          </Link>
        </div>

        {/* Live Grid Metrics Preview Cards */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-left">
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono uppercase mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Grid Topology</span>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">IEEE 14-Bus</div>
            <div className="text-[11px] text-slate-500 mt-0.5">5 Gen, 9 PQ Loads</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono uppercase mb-1">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>ML Classifier</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">98.4% Acc</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Random Forest / XAI</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono uppercase mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>PMU Sampling</span>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">1.0 Hz (Live)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Synchronous telemetry</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono uppercase mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Mitigation</span>
            </div>
            <div className="text-xl font-bold text-sky-400 font-mono">&lt; 500 ms</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Automated containment</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-6 px-4 md:px-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 SmartGrid CyberDefense Platform • IEEE-14 SCADA Protection Framework
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-slate-400 hover:text-sky-400 transition">
              Operator Login
            </Link>
            <span>•</span>
            <Link to="/register" className="text-slate-400 hover:text-sky-400 transition">
              Register Account
            </Link>
            <span>•</span>
            <Link to="/forgot-password" className="text-slate-400 hover:text-sky-400 transition">
              Account Recovery
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

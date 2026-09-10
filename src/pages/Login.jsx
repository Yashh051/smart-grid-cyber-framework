/**
 * ==============================================================================
 * PAGE: Login.jsx (Operator Authentication Portal)
 * PURPOSE: Secure JWT login with credential validation and demo quick-fill helper.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, Phone } from "lucide-react";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr("");
    if (!username || !password) {
      setLocalErr("Please enter both username/mobile and password");
      return;
    }
    const res = await login(username, password);
    if (res.success) {
      navigate("/");
    }
  };

  const handleDemoFill = () => {
    setUsername("operator");
    setPassword("GridSec@2026");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded bg-sky-950 border border-sky-600/40 text-sky-400 mx-auto flex items-center justify-center mb-3">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            SmartGrid CyberDefense Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            IEEE-14 SCADA Intrusion Detection System
          </p>
        </div>

        {/* Auth Navigation Tabs (Register / Login) */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-md border border-slate-800 mb-6 text-xs font-semibold">
          <Link
            to="/register"
            className="text-center py-2 rounded text-slate-400 hover:text-slate-200 transition"
          >
            1. Register Account
          </Link>
          <Link
            to="/login"
            className="text-center py-2 rounded bg-sky-600 text-white shadow"
          >
            2. Operator Login
          </Link>
        </div>

        {/* Error Alert */}
        {(error || localErr) && (
          <div className="mb-6 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm px-4 py-3 rounded flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{localErr || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Username or Official Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                placeholder="example@gmail.com or username"
                className="w-full bg-slate-950 border border-slate-800 rounded pl-10 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Enter your password"
                className="w-full bg-slate-950 border border-slate-800 rounded pl-10 pr-10 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center space-x-1"
            >
              <span>Forgot Password?</span>
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded text-sm transition focus:outline-none disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Authenticating Operator..." : "Authenticate & Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDemoFill}
            className="w-full text-xs text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-900 py-1.5 rounded transition"
          >
            Quick Fill Demo Operator Account (operator / GridSec@2026)
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Need a new operator account?{" "}
          <Link to="/register" className="text-sky-400 hover:underline font-semibold">
            Register new account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

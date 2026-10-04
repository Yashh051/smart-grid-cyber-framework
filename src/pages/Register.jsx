/**
 * ==============================================================================
 * PAGE: Register.jsx (Operator & Analyst Registration)
 * PURPOSE: Secure enrollment portal with role-based access (Grid Operator / 
 *          Security Analyst / Admin) and seamless tab navigation to Login.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, Lock, User, Mail, Shield, AlertCircle, ArrowRight, Phone, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    full_name: "",
    password: "",
    role: "Grid Operator",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr("");
    
    // 1. Required field checks
    if (!formData.full_name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setLocalErr("Please fill in all required fields (Full Name, Operator Username, Official Email, Password).");
      return;
    }

    // 2. Strict standard email syntax validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setLocalErr("Please enter a valid official email address format (e.g. operator@smartgrid.org or yourname@gmail.com).");
      return;
    }

    // 3. Minimum password length check
    if (formData.password.length < 6) {
      setLocalErr("Security Policy: Password must be at least 6 characters long.");
      return;
    }

    const res = await register({
      ...formData,
      email: formData.email.trim().toLowerCase(),
      username: formData.username.trim(),
    });
    if (res.success) {
      navigate("/");
    }
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
            className="text-center py-2 rounded bg-sky-600 text-white shadow"
          >
            1. Register Account
          </Link>
          <Link
            to="/login"
            className="text-center py-2 rounded text-slate-400 hover:text-slate-200 transition"
          >
            2. Operator Login
          </Link>
        </div>

        {(error || localErr) && (
          <div className="mb-6 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm px-4 py-3 rounded flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{localErr || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              autoComplete="off"
              placeholder="e.g. Vikram Verma"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Operator Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="off"
              placeholder="e.g. v_verma"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
              <Mail className="w-3 h-3 text-sky-400" />
              <span>Official Email *</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              placeholder="example@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Password *</span>
              <span className="text-[10px] text-slate-500 normal-case">Min 6 characters</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Enter your password"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Mobile Number *</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              autoComplete="off"
              placeholder="+91 9876543210"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
              >
                <option value="Grid Operator">Grid Operator</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="System Admin">System Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                autoComplete="off"
                placeholder="e.g. Transmission Grid Operations"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded text-sm transition focus:outline-none disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>{loading ? "Registering Account..." : "Create Account & Enter Portal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-sky-400 hover:underline font-semibold">
            Sign in to existing account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * ==============================================================================
 * PAGE: ForgotPassword.jsx (Account Recovery & Emergency OTP Dispatch)
 * PURPOSE: Allows operators to recover locked accounts or reset forgotten passwords
 *          via Email or SMS Text Message with automated OTP verification.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ForgotPassword() {
  const { API_BASE } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password, 3: Success
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [dispatchedData, setDispatchedData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Step 1: Request OTP via Official Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErr("");
    if (!identifier.trim()) {
      setErr("Please enter your registered username or official email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_username: identifier.trim(),
          delivery_method: "Email",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Account recovery request failed.");
      }
      setDispatchedData(data);
      // Keep OTP code empty so user must check their real Gmail inbox
      setOtpCode("");
      setStep(2);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErr("");
    if (!otpCode.trim()) {
      setErr("Please enter the 6-digit OTP verification code received in your email.");
      return;
    }
    if (newPassword.length < 6) {
      setErr("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_username: identifier.trim(),
          otp_code: otpCode.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password. Please check your OTP code.");
      }
      setStep(3);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded bg-sky-950 border border-sky-600/40 text-sky-400 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Account Recovery & Security Verification
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            SmartGrid Security Operations Center (SOC)
          </p>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-6 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm px-4 py-3 rounded flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* STEP 1: Request Verification Code via Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Username or Official Email Address
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="off"
                placeholder="example@gmail.com or username"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded flex items-center space-x-3 text-sky-300">
              <Mail className="w-5 h-5 text-sky-400 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-slate-200">Email Verification Protocol</div>
                <div className="text-[11px] text-slate-400">A 6-digit security OTP will be dispatched to your registered email inbox.</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded text-sm transition focus:outline-none disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>{loading ? "Sending Security Code..." : "Send Recovery Code to Email"}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Instruction Card (Check Gmail) + Enter OTP & New Password */}
        {step === 2 && dispatchedData && (
          <form onSubmit={handleResetPassword} autoComplete="off" className="space-y-4">
            
            {/* Dispatched Security Notification Card */}
            <div className="bg-slate-950 border border-sky-600/60 rounded-lg p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Security OTP Dispatched via Email (Gmail)
                </span>
              </div>
              
              <p className="text-xs text-slate-200">
                A 6-digit one-time verification code has been dispatched to:
              </p>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded text-center text-xs font-mono font-bold text-sky-300">
                {dispatchedData.recipient}
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                {dispatchedData.email_delivery?.sent ? (
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px]">
                    ✓ Live email dispatched to <strong>{dispatchedData.recipient}</strong>! Please check your <strong>Gmail Inbox</strong> (and Spam/Junk folder).
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px]">
                    ✓ Verification OTP code generated for <strong>{dispatchedData.recipient}</strong>. Check your email inbox.
                  </div>
                )}
                <p>• Enter the 6-digit code below to set your new password.</p>
                <p className="text-amber-400/90 text-[10px]">• Token expires in 15 minutes.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Enter 6-Digit OTP Code</span>
                <span className="text-[10px] text-sky-400">
                  Check Gmail Inbox
                </span>
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                autoComplete="off"
                placeholder="Enter 6-digit OTP code"
                maxLength={6}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2.5 text-base font-mono text-center tracking-widest text-sky-300 font-bold focus:outline-none focus:border-sky-500 placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-xs placeholder:font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[10px] text-slate-500">Min 6 characters</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded text-sm transition focus:outline-none disabled:opacity-50"
            >
              {loading ? "Updating Credentials..." : "Verify OTP & Update Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1"
            >
              &larr; Re-enter email address or request new OTP
            </button>
          </form>
        )}

        {/* STEP 3: Password Updated Success */}
        {step === 3 && (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Account Successfully Recovered!
            </h3>
            <p className="text-xs text-slate-400">
              Your password has been updated securely with PBKDF2 hashing. You can now log into the Smart Grid Defense Portal.
            </p>
            <Link
              to="/login"
              className="block w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded text-sm transition text-center"
            >
              Proceed to Operator Login &rarr;
            </Link>
          </div>
        )}

        {/* Back Link */}
        {step !== 3 && (
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
            Remember your credentials?{" "}
            <Link to="/login" className="text-sky-400 hover:underline font-semibold">
              Sign In &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

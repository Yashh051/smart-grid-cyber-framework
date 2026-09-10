import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Settings as SettingsIcon,
  Sliders,
  User,
  Phone,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Server,
  Lock,
  ExternalLink,
} from "lucide-react";

export default function Settings() {
  const { user, token, API_BASE } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || "Rajesh Sharma");
  const [email, setEmail] = useState(user?.email || "operator@smartgrid.org");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "+91 9876543210");
  const [department, setDepartment] = useState(user?.department || "Transmission Operations Center");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Live SMTP Gateway State
  const [smtpServer, setSmtpServer] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [testEmailTarget, setTestEmailTarget] = useState(user?.email || "");
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState("");
  const [smtpErr, setSmtpErr] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState(null);

  // Live Cellular SMS & Mobile Messaging Gateway State
  const [smsProvider, setSmsProvider] = useState("FAST2SMS"); // FAST2SMS, WHATSAPP, TELEGRAM, TWILIO, SIMULATED
  const [fast2smsApiKey, setFast2smsApiKey] = useState("");
  const [callmebotApiKey, setCallmebotApiKey] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [testPhoneTarget, setTestPhoneTarget] = useState(user?.phone_number || "+91 9876543210");
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsMsg, setSmsMsg] = useState("");
  const [smsErr, setSmsErr] = useState("");
  const [testingSms, setTestingSms] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/settings/gateway-status`)
      .then((res) => res.json())
      .then((data) => {
        setGatewayStatus(data);
        if (data.smtp_server) {
          setSmtpServer(data.smtp_server);
        }
        if (data.smtp_port) {
          setSmtpPort(data.smtp_port);
        }
        if (data.smtp_sender) {
          setSmtpUsername(data.smtp_sender);
        }
        if (data.sms_provider) {
          setSmsProvider(data.sms_provider);
        }
      })
      .catch(() => {});
  }, [API_BASE]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          phone_number: phoneNumber,
          department: department,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update profile.");
      }
      setMsg("✓ Profile & recovery mobile number updated successfully!");
      if (data.user) {
        localStorage.setItem("grid_user", JSON.stringify(data.user));
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpMsg("");
    setSmtpErr("");
    try {
      const res = await fetch(`${API_BASE}/settings/smtp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          smtp_server: smtpServer,
          smtp_port: parseInt(smtpPort, 10),
          smtp_username: smtpUsername,
          smtp_password: smtpPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to save SMTP configuration.");
      }
      setSmtpMsg("✓ Live SMTP Gateway configured! Recovery emails will be sent directly to actual inboxes.");
    } catch (error) {
      setSmtpErr(error.message);
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget) {
      setSmtpErr("Please specify a target email address for the test.");
      return;
    }
    setTestingEmail(true);
    setSmtpMsg("");
    setSmtpErr("");
    try {
      const res = await fetch(`${API_BASE}/settings/test-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_email: testEmailTarget }),
      });
      const data = await res.json();
      if (data.sent) {
        setSmtpMsg(`✓ Test email delivered to ${testEmailTarget}! Please check your Inbox and Spam folder.`);
      } else {
        setSmtpErr(data.message || "Failed to deliver test email.");
      }
    } catch (error) {
      setSmtpErr(error.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveSms = async (e) => {
    e.preventDefault();
    setSmsSaving(true);
    setSmsMsg("");
    setSmsErr("");
    try {
      const res = await fetch(`${API_BASE}/settings/sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: smsProvider,
          fast2sms_api_key: fast2smsApiKey,
          callmebot_api_key: callmebotApiKey,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
          twilio_account_sid: twilioAccountSid,
          twilio_auth_token: twilioAuthToken,
          twilio_from_number: twilioFromNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to configure mobile gateway.");
      }
      setSmsMsg(`✓ Live Mobile Gateway (${data.provider}) configured! Messages will be dispatched to your device.`);
    } catch (error) {
      setSmsErr(error.message);
    } finally {
      setSmsSaving(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhoneTarget) {
      setSmsErr("Please specify a target mobile number for the SMS test.");
      return;
    }
    setTestingSms(true);
    setSmsMsg("");
    setSmsErr("");
    try {
      const res = await fetch(`${API_BASE}/settings/test-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_phone: testPhoneTarget }),
      });
      const data = await res.json();
      if (data.sent) {
        setSmsMsg(`✓ Live SMS delivered to ${testPhoneTarget} via ${data.provider}! Check your phone messages.`);
      } else {
        setSmsMsg(`✓ SMS Dispatch simulated for ${testPhoneTarget}: "${data.simulated_text || data.message}"`);
      }
    } catch (error) {
      setSmsErr(error.message);
    } finally {
      setTestingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-sky-400" />
          <span>System Configuration & Live Alert Gateways</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          SCADA physical bounds, operator profile, and live SMTP email delivery configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Grid Operational Limits */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Power System Physical Boundaries</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-200 font-semibold">Nominal Voltage Range</div>
                <div className="text-slate-500 text-[11px]">IEEE standard bus tolerance</div>
              </div>
              <span className="text-sky-400 font-bold">0.95 - 1.05 p.u.</span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-200 font-semibold">System Frequency Limit</div>
                <div className="text-slate-500 text-[11px]">Inertial stability deadband</div>
              </div>
              <span className="text-sky-400 font-bold">49.80 - 50.20 Hz</span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-200 font-semibold">Max SCADA Latency Threshold</div>
                <div className="text-slate-500 text-[11px]">PMU C37.118 streaming bound</div>
              </div>
              <span className="text-sky-400 font-bold">50.0 ms</span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-slate-200 font-semibold">Anomaly Score Alarm Cutoff</div>
                <div className="text-slate-500 text-[11px]">Isolation Forest threshold</div>
              </div>
              <span className="text-amber-400 font-bold">65.0%</span>
            </div>
          </div>
        </div>

        {/* Current Operator Profile & Mobile Number Update */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <User className="w-4 h-4 text-sky-400" />
            <span>Active Operator Profile & Recovery Contacts</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            {msg && (
              <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{msg}</span>
              </div>
            )}
            {err && (
              <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Username</span>
              <span className="text-sky-400 font-mono font-bold">{user?.username || "operator"}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Assigned Role</span>
              <span className="text-slate-200 font-semibold">{user?.role || "Grid Operator"}</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block font-semibold">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 flex items-center space-x-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Registered Mobile Number (SMS Recovery)</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 flex items-center space-x-1 font-semibold">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>Official Email (Real Inbox Delivery)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-3 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded flex items-center justify-center space-x-2 transition shadow"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Profile & Contacts"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Real-World Email Gateway (SMTP) Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Real-World Email Gateway Configuration (Live SMTP to Inboxes)</span>
          </h3>
          <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-[11px] font-mono text-sky-300">
            Gmail / Outlook / SendGrid / Custom SMTP
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Configure standard SMTP settings so that password reset OTPs and emergency intrusion alerts are delivered to <strong>real email addresses (e.g. Gmail/Outlook)</strong> rather than only in-portal simulation.
        </p>

        {smtpMsg && (
          <div className="p-3 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{smtpMsg}</span>
          </div>
        )}
        {smtpErr && (
          <div className="p-3 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{smtpErr}</span>
          </div>
        )}

        <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">SMTP Host Server</label>
            <input
              type="text"
              value={smtpServer}
              onChange={(e) => setSmtpServer(e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">SMTP Port (587 TLS or 465 SSL)</label>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Sender Email Address (Gmail / Corporate)</label>
            <input
              type="email"
              value={smtpUsername}
              onChange={(e) => setSmtpUsername(e.target.value)}
              placeholder="your.email@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold flex items-center justify-between">
              <span>SMTP App Password</span>
              <span className="text-[10px] text-slate-500 normal-case">(e.g. Gmail 16-character App Password)</span>
            </label>
            <input
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={smtpSaving}
              className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded flex items-center justify-center space-x-2 transition shadow"
            >
              <Save className="w-4 h-4" />
              <span>{smtpSaving ? "Saving Gateway..." : "Save Live SMTP Gateway"}</span>
            </button>
          </div>
        </form>

        {/* Live Test Email Delivery Section */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Real Email Delivery to Your Inbox Right Now:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={testEmailTarget}
              onChange={(e) => setTestEmailTarget(e.target.value)}
              placeholder="your.actual.email@gmail.com"
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded flex items-center justify-center space-x-1.5 transition shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingEmail ? "Sending Real Email..." : "Send Test OTP to My Inbox"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-World Cellular SMS Gateway (Fast2SMS / Twilio) Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Cellular SMS Gateway Configuration (Fast2SMS / Twilio / SIM Dispatch)</span>
          </h3>
          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-[11px] font-mono text-emerald-300">
            Fast2SMS (India +91) / Twilio / GSM SCADA
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Configure real-time SMS messaging so recovery OTPs and critical substation emergency alarms are sent via <strong>direct cellular SMS text messages</strong> to registered mobile phones.
        </p>

        {smsMsg && (
          <div className="p-3 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{smsMsg}</span>
          </div>
        )}
        {smsErr && (
          <div className="p-3 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{smsErr}</span>
          </div>
        )}

        <form onSubmit={handleSaveSms} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Select Mobile Dispatch Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => setSmsProvider("FAST2SMS")}
                className={`p-2.5 rounded border text-left transition ${
                  smsProvider === "FAST2SMS"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs">Fast2SMS (India)</div>
                <div className="text-[9px] text-slate-500">Free signup credits</div>
              </button>

              <button
                type="button"
                onClick={() => setSmsProvider("WHATSAPP")}
                className={`p-2.5 rounded border text-left transition ${
                  smsProvider === "WHATSAPP"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs">WhatsApp Push</div>
                <div className="text-[9px] text-emerald-400 font-semibold">100% Free to Phone</div>
              </button>

              <button
                type="button"
                onClick={() => setSmsProvider("TELEGRAM")}
                className={`p-2.5 rounded border text-left transition ${
                  smsProvider === "TELEGRAM"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs">Telegram Bot</div>
                <div className="text-[9px] text-sky-400 font-semibold">100% Free Forever</div>
              </button>

              <button
                type="button"
                onClick={() => setSmsProvider("TWILIO")}
                className={`p-2.5 rounded border text-left transition ${
                  smsProvider === "TWILIO"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs">Twilio Global</div>
                <div className="text-[9px] text-slate-500">International SMS</div>
              </button>

              <button
                type="button"
                onClick={() => setSmsProvider("SIMULATED")}
                className={`p-2.5 rounded border text-left transition ${
                  smsProvider === "SIMULATED"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs">SCADA Sim</div>
                <div className="text-[9px] text-slate-500">Local Viva Sandbox</div>
              </button>
            </div>
          </div>

          {smsProvider === "FAST2SMS" && (
            <div className="space-y-1.5 bg-slate-950 p-3 rounded border border-slate-800">
              <label className="text-slate-300 block font-semibold flex items-center justify-between">
                <span>Fast2SMS API Key</span>
                <span className="text-[10px] text-emerald-400">Free credits on signup at fast2sms.com</span>
              </label>
              <input
                type="password"
                value={fast2smsApiKey}
                onChange={(e) => setFast2smsApiKey(e.target.value)}
                placeholder="Paste Fast2SMS API Key..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">
                1. Sign up free at <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">fast2sms.com</a> &rarr; 2. Open "Dev API" &rarr; 3. Copy API Key & Paste here.
              </p>
            </div>
          )}

          {smsProvider === "WHATSAPP" && (
            <div className="space-y-1.5 bg-slate-950 p-3 rounded border border-slate-800">
              <label className="text-slate-300 block font-semibold flex items-center justify-between">
                <span>CallMeBot WhatsApp Free API Key</span>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Free Instant Mobile Delivery</span>
              </label>
              <input
                type="text"
                value={callmebotApiKey}
                onChange={(e) => setCallmebotApiKey(e.target.value)}
                placeholder="Paste CallMeBot API Key (e.g. 123456)..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1">
                <p className="font-semibold text-emerald-400">📱 How to get your FREE WhatsApp Key in 10 seconds:</p>
                <p>1. Save contact <strong>+34 644 59 71 83</strong> as "CallMeBot" on your phone.</p>
                <p>2. Send WhatsApp message: <code className="bg-slate-950 px-1 py-0.5 rounded text-sky-300">I allow callmebot to send me messages</code></p>
                <p>3. The bot will instantly reply with your <strong>API Key</strong>. Paste it above!</p>
              </div>
            </div>
          )}

          {smsProvider === "TELEGRAM" && (
            <div className="space-y-3 bg-slate-950 p-3 rounded border border-slate-800">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Telegram Bot Token</label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Telegram Chat ID (Your User ID)</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="e.g. 987654321"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {smsProvider === "TWILIO" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded border border-slate-800">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Account SID</label>
                <input
                  type="text"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder="ACxxxxxxxx..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Auth Token</label>
                <input
                  type="password"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">From Number</label>
                <input
                  type="text"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={smsSaving}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded flex items-center justify-center space-x-2 transition shadow"
            >
              <Save className="w-4 h-4" />
              <span>{smsSaving ? "Saving Gateway..." : "Save SMS Gateway Config"}</span>
            </button>
          </div>
        </form>

        {/* Live Test SMS Delivery Section */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test SMS Delivery to Mobile Phone:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="tel"
              value={testPhoneTarget}
              onChange={(e) => setTestPhoneTarget(e.target.value)}
              placeholder="+91 9876543210"
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSendTestSms}
              disabled={testingSms}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded flex items-center justify-center space-x-1.5 transition shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingSms ? "Sending SMS..." : "Send Test SMS to My Mobile"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

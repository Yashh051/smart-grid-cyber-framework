import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ThreatConsole from "./pages/ThreatConsole";
import Incidents from "./pages/Incidents";
import Analytics from "./pages/Analytics";
import BatchScan from "./pages/BatchScan";
import Settings from "./pages/Settings";
import AttackAlertModal from "./components/AttackAlertModal";
import LoginWelcomeModal from "./components/LoginWelcomeModal";

function ProtectedLayout({ children, telemetryData, historyData, streamLogs, wsConnected, incidentCount }) {
  const { user, token, API_BASE } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative">
      {/* 1. Operator Login & SCADA Security Briefing Pop-Up */}
      <LoginWelcomeModal user={user} wsConnected={wsConnected} incidentCount={incidentCount} />

      {/* 2. Global Cyber-Attack Pop-Up Alarm & Containment Modal */}
      <AttackAlertModal telemetryData={telemetryData} token={token} API_BASE={API_BASE} />
      
      <Navbar 
        wsConnected={wsConnected} 
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        mobileMenuOpen={mobileMenuOpen} 
      />
      <div className="flex flex-1">
        <Sidebar 
          incidentCount={incidentCount} 
          mobileOpen={mobileMenuOpen} 
          onCloseMobile={() => setMobileMenuOpen(false)} 
        />
        <main className="flex-1 p-3 md:p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, token, API_BASE } = useAuth();
  const [telemetryData, setTelemetryData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [streamLogs, setStreamLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [incidentCount, setIncidentCount] = useState(0);
  const wsRef = useRef(null);

  // Fetch active incidents count periodically
  useEffect(() => {
    if (!token) return;
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/incidents?status=ACTIVE`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIncidentCount(data.length);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Connect to WebSocket when logged in
  useEffect(() => {
    if (!user) {
      if (wsRef.current) wsRef.current.close();
      return;
    }

    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = isLocal ? "localhost:8000" : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/telemetry`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Real-Time SCADA Telemetry Stream");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setTelemetryData(payload);

        const timeStr = payload.timestamp.split("T")[1]?.slice(0, 8) || "";
        const freq = payload.grid_metrics?.frequency_hz || 50.0;
        const anom = payload.detection?.anomaly_score || 0.0;

        setHistoryData((prev) => {
          const next = [...prev, { time: timeStr, frequency: freq, anomaly: anom }];
          return next.slice(-30); // Keep last 30 points
        });

        setStreamLogs((prev) => [payload, ...prev.slice(0, 49)]);
      } catch (err) {
        console.error("Failed to parse telemetry frame:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  return (
    <Routes>
      {/* Public Landing & Authentication Routes */}
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/"
        element={
          user ? (
            <ProtectedLayout
              telemetryData={telemetryData}
              historyData={historyData}
              streamLogs={streamLogs}
              wsConnected={wsConnected}
              incidentCount={incidentCount}
            >
              <Dashboard telemetryData={telemetryData} historyData={historyData} />
            </ProtectedLayout>
          ) : (
            <Landing />
          )
        }
      />

      <Route
        path="/threat-console"
        element={
          <ProtectedLayout
            telemetryData={telemetryData}
            historyData={historyData}
            streamLogs={streamLogs}
            wsConnected={wsConnected}
            incidentCount={incidentCount}
          >
            <ThreatConsole telemetryData={telemetryData} streamLogs={streamLogs} />
          </ProtectedLayout>
        }
      />

      <Route
        path="/incidents"
        element={
          <ProtectedLayout
            telemetryData={telemetryData}
            historyData={historyData}
            streamLogs={streamLogs}
            wsConnected={wsConnected}
            incidentCount={incidentCount}
          >
            <Incidents />
          </ProtectedLayout>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedLayout
            telemetryData={telemetryData}
            historyData={historyData}
            streamLogs={streamLogs}
            wsConnected={wsConnected}
            incidentCount={incidentCount}
          >
            <Analytics />
          </ProtectedLayout>
        }
      />

      <Route
        path="/batch-scan"
        element={
          <ProtectedLayout
            telemetryData={telemetryData}
            historyData={historyData}
            streamLogs={streamLogs}
            wsConnected={wsConnected}
            incidentCount={incidentCount}
          >
            <BatchScan />
          </ProtectedLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedLayout
            telemetryData={telemetryData}
            historyData={historyData}
            streamLogs={streamLogs}
            wsConnected={wsConnected}
            incidentCount={incidentCount}
          >
            <Settings />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = "/register";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-950 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-800">
              <span className="text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold">Smart Grid Portal Initializing</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || "Cached browser state reset required."}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded transition"
            >
              Reset Session & Open Portal &rarr;
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

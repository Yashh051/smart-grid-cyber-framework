import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Zap,
} from "lucide-react";

export default function Sidebar({ incidentCount = 0, mobileOpen = false, onCloseMobile }) {
  const navItems = [
    { to: "/", label: "Grid Overview", icon: LayoutDashboard },
    { to: "/threat-console", label: "Real-Time Threat Console", icon: ShieldAlert },
    { to: "/incidents", label: "Security Incidents", icon: AlertTriangle, badge: incidentCount },
    { to: "/analytics", label: "Model Analytics & XAI", icon: BarChart3 },
    { to: "/batch-scan", label: "Batch CSV Scanner", icon: FileSpreadsheet },
    { to: "/settings", label: "System Config", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`
          fixed md:static top-16 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none overflow-y-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
            Operations & Detection
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-950 text-sky-400 border border-sky-800/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </div>

      {/* Grid Specification Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">Topology:</span> IEEE 14-Bus
        </div>
        <div className="text-xs text-slate-500 font-mono space-y-0.5">
          <div>Substations: 5 Generators, 9 PQ</div>
          <div>Protocols: DNP3 / IEC 61850</div>
        </div>
      </div>
    </aside>
    </>
  );
}

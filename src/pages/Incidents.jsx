/**
 * ==============================================================================
 * PAGE: Incidents.jsx (Cyber-Physical Security Incident Log)
 * PURPOSE: Filterable security incident audit log, operator acknowledgement,
 *          mitigation action notes, and CSV export.
 * PROJECT: AI-Based Smart Grid Cybersecurity Framework (TYCS Final Year Project)
 * ==============================================================================
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AlertTriangle,
  Download,
  CheckCircle2,
  Clock,
  Shield,
  Filter,
  Check,
  X,
} from "lucide-react";

export default function Incidents() {
  const { token, API_BASE } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const url =
        filterStatus === "ALL"
          ? `${API_BASE}/incidents`
          : `${API_BASE}/incidents?status=${filterStatus}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filterStatus]);

  const handleAcknowledge = async (id) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/incidents/${id}/acknowledge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/incidents/${selectedIncident.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: resolveNotes }),
      });
      setSelectedIncident(null);
      setResolveNotes("");
      fetchIncidents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE}/incidents/export-csv`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Cyber-Physical Incident Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit record of all detected grid cyber intrusions and operator response actions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  filterStatus === st
                    ? "bg-slate-800 text-sky-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs font-semibold text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                <th className="py-3 px-4">INCIDENT REF</th>
                <th className="py-3 px-4">TIMESTAMP (UTC)</th>
                <th className="py-3 px-4">ATTACK TYPE</th>
                <th className="py-3 px-4">SEVERITY</th>
                <th className="py-3 px-4">CONFIDENCE</th>
                <th className="py-3 px-4">AFFECTED ASSETS</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Loading incident log from database...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No security incidents recorded matching filter.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => {
                  const isAct = inc.status === "ACTIVE";
                  const isAck = inc.status === "ACKNOWLEDGED";
                  return (
                    <tr key={inc.id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-3 px-4 font-bold text-sky-400">{inc.incident_ref}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {inc.timestamp.replace("T", " ").replace("Z", "")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {inc.attack_type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            inc.severity === "High"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">{inc.confidence}%</td>
                      <td className="py-3 px-4 truncate max-w-[180px] text-slate-400">
                        {inc.affected_components}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isAct
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : isAck
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2 font-sans">
                          {isAct && (
                            <button
                              onClick={() => handleAcknowledge(inc.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs transition border border-slate-700"
                            >
                              Acknowledge
                            </button>
                          )}
                          {isAct || isAck ? (
                            <button
                              onClick={() => setSelectedIncident(inc)}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-xs transition border border-emerald-800"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs">Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Incident Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">
                Resolve Incident {selectedIncident.incident_ref}
              </h3>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Attack Type:{" "}
                <span className="font-bold text-slate-200">
                  {selectedIncident.attack_type}
                </span>{" "}
                | Affected:{" "}
                <span className="font-bold text-slate-200">
                  {selectedIncident.affected_components}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Resolution / Mitigation Notes
                </label>
                <textarea
                  rows={4}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="e.g. Isolated corrupted Bus 4 PMU channel. Re-synchronized SCADA state estimator. Physical breakers inspected."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-500 transition"
                >
                  Confirm & Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

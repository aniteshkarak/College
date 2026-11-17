import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Ban,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const AdminDashboard = () => {
  const {
    adminMetrics,
    adminReports,
    setAdminReports,
    adminAuditLogs,
    setAdminAuditLogs,
    currentUser,
    navigateTo,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reports' | 'users' | 'logs'
  const [reportFilter, setReportFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [investigationNotes, setInvestigationNotes] = useState('');

  // Handle Admin Report Actions
  const handleReportAction = (reportId, actionType) => {
    let newStatus = 'Action taken';
    if (actionType === 'dismiss') newStatus = 'Rejected';
    if (actionType === 'under_review') newStatus = 'Under review';

    setAdminReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    // Add Audit Log (PRD Table 24)
    const newLog = {
      id: 'log_' + Date.now(),
      admin: `Super Admin (${currentUser.display_name})`,
      action: `${actionType.toUpperCase()} on Report ${reportId}`,
      reason: investigationNotes || 'Routine moderation protocol enforcement',
      timestamp: new Date().toISOString()
    };
    setAdminAuditLogs((prev) => [newLog, ...prev]);

    addToast(`Report updated: ${newStatus}`, 'info');
    setSelectedReport(null);
    setInvestigationNotes('');
  };

  const filteredReports = adminReports.filter((r) =>
    reportFilter === 'All' ? true : r.status === reportFilter
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('discover')}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                Admin & Trust Moderation
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Super Admin Role
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Audit-logged moderation portal compliant with India DPDP Act 2023.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'reports', label: `Reports (${adminReports.length})` },
            { id: 'logs', label: 'Audit Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Registered</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {adminMetrics.total_users.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-500 font-bold">+{adminMetrics.new_registrations_today} today</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Active Campus Matches</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {adminMetrics.total_matches.toLocaleString()}
              </p>
              <span className="text-[10px] text-rose-500 font-bold">Mutual Likes</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Messages & Voice Notes</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {adminMetrics.total_messages.toLocaleString()}
              </p>
              <span className="text-[10px] text-purple-500 font-bold">Encrypted Endpoints</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Safety Reports</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {adminReports.length}
              </p>
              <span className="text-[10px] text-amber-500 font-bold">2 Pending Reviews</span>
            </div>
          </div>

          {/* Privacy Notice regarding Chat inspection */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-3xl text-xs text-purple-900 dark:text-purple-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-purple-600 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Admin Privacy Boundary (PRD Section 6.2):</p>
              <p className="leading-relaxed">
                "Admin must not have unrestricted access to private conversations. Access to message content is strictly restricted to necessary, documented safety investigations with appropriate authorization and tamper-evident audit logging."
              </p>
            </div>
          </div>

        </div>
      )}

      {/* REPORTS MANAGEMENT TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Reported Profiles & Safety Incidents
            </h3>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Pending', 'Under review', 'Action taken'].map((status) => (
                <button
                  key={status}
                  onClick={() => setReportFilter(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    reportFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">ID / Time</th>
                  <th className="pb-3">Reported User</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      {report.id}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {report.reported_user}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                        {report.category}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {report.description}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          report.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : report.status === 'Action taken'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-100"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            Immutable Administrative Audit Trail (PRD Table 24)
          </h3>
          <div className="space-y-3">
            {adminAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                    <span className="text-[10px] px-2 py-0.2 bg-slate-200 dark:bg-slate-700 rounded-full font-mono">
                      {log.admin}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Reason: {log.reason}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investigation Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-200 dark:border-purple-900 animate-slide-up">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Investigate Report {selectedReport.id}
            </h3>

            <div className="space-y-3 my-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px]">REPORTED PARTY</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedReport.reported_user}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px]">CATEGORY & STATEMENT</span>
                <span className="font-bold text-rose-600 block mb-1">{selectedReport.category}</span>
                <p className="text-slate-700 dark:text-slate-300">{selectedReport.description}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px]">SUBMITTED EVIDENCE NOTE</span>
                <p className="text-slate-600 dark:text-slate-300">{selectedReport.evidence}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Investigation Audit Notes (Mandatory for Action)
                </label>
                <textarea
                  rows={2}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Record formal justification for user warning, suspension, or rejection..."
                  className="w-full text-xs p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReportAction(selectedReport.id, 'dismiss')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Dismiss / Reject
                </button>
                <button
                  onClick={() => handleReportAction(selectedReport.id, 'warn')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700"
                >
                  Warn User
                </button>
                <button
                  onClick={() => handleReportAction(selectedReport.id, 'suspend')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
                >
                  Suspend Account
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

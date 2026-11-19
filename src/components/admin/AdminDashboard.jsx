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
  ArrowLeft,
  FileCheck2,
  Image as ImageIcon,
  Check,
  X,
  Building,
  Mail,
  Phone
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
    addToast,
    pendingVerifications,
    approveStudentVerification,
    rejectStudentVerification
  } = useApp();

  const [activeTab, setActiveTab] = useState('verifications'); // Default to 'verifications' to easily review new registrations
  const [reportFilter, setReportFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [investigationNotes, setInvestigationNotes] = useState('');

  // Verification review states
  const [verificationFilter, setVerificationFilter] = useState('PENDING_APPROVAL'); // 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'All'
  const [selectedStudentForDecline, setSelectedStudentForDecline] = useState(null);
  const [declineReasonText, setDeclineReasonText] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, title }

  // Handle Admin Report Actions
  const handleReportAction = (reportId, actionType) => {
    let newStatus = 'Action taken';
    if (actionType === 'dismiss') newStatus = 'Rejected';
    if (actionType === 'under_review') newStatus = 'Under review';

    setAdminReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    // Add Audit Log
    const newLog = {
      id: 'log_' + Date.now(),
      admin: `Super Admin (${currentUser?.display_name || 'Admin'})`,
      action: `${actionType.toUpperCase()} on Report ${reportId}`,
      reason: investigationNotes || 'Routine moderation protocol enforcement',
      timestamp: new Date().toISOString()
    };
    setAdminAuditLogs((prev) => [newLog, ...prev]);

    addToast(`Report updated: ${newStatus}`, 'info');
    setSelectedReport(null);
    setInvestigationNotes('');
  };

  // Submit Decline with reason
  const handleConfirmDecline = (e) => {
    e.preventDefault();
    if (!declineReasonText.trim()) {
      addToast('Please provide an explanation for declining.', 'warning');
      return;
    }

    rejectStudentVerification(selectedStudentForDecline.id, declineReasonText.trim());
    setSelectedStudentForDecline(null);
    setDeclineReasonText('');
  };

  const pendingCount = pendingVerifications.filter((v) => v.status === 'PENDING_APPROVAL').length;

  const filteredVerifications = pendingVerifications.filter((v) => {
    if (verificationFilter === 'All') return true;
    return v.status === verificationFilter;
  });

  const filteredReports = adminReports.filter((r) =>
    reportFilter === 'All' ? true : r.status === reportFilter
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('matches')}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                Campus Admin & Verification Portal
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Super Admin Role
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Audit-logged moderation portal. Verify student ID documents & photos before account activation.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
          {[
            { id: 'verifications', label: `Student ID Verifications (${pendingCount})` },
            { id: 'overview', label: 'Overview' },
            { id: 'reports', label: `Safety Reports (${adminReports.length})` },
            { id: 'logs', label: 'Audit Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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

      {/* -------------------- 1. STUDENT ID VERIFICATIONS TAB -------------------- */}
      {activeTab === 'verifications' && (
        <div className="space-y-5">
          
          {/* Header & Sub-filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-rose-500" />
                Student Account Applications
              </h2>
              <p className="text-[11px] text-slate-500">
                Review applicant College / Govt ID and 2 photos. Accept to create account, or decline with feedback.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setVerificationFilter('PENDING_APPROVAL')}
                className={`px-2.5 py-1 rounded-lg ${
                  verificationFilter === 'PENDING_APPROVAL'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Pending Review ({pendingCount})
              </button>
              <button
                onClick={() => setVerificationFilter('APPROVED')}
                className={`px-2.5 py-1 rounded-lg ${
                  verificationFilter === 'APPROVED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => setVerificationFilter('REJECTED')}
                className={`px-2.5 py-1 rounded-lg ${
                  verificationFilter === 'REJECTED'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Declined
              </button>
              <button
                onClick={() => setVerificationFilter('All')}
                className={`px-2.5 py-1 rounded-lg ${
                  verificationFilter === 'All'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Cards List of Applicants */}
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No Applications in this Queue
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All student registrations in this category have been processed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredVerifications.map((student) => (
                <div
                  key={student.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row gap-5 items-start justify-between animate-fade-in"
                >
                  
                  {/* Left: Student Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {student.full_name}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        (Display: "{student.display_name}")
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          student.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : student.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {student.status === 'PENDING_APPROVAL' ? 'Pending Review' : student.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold">{student.college_name}</span>
                        {student.course && <span className="text-slate-400">({student.course})</span>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500">DOB:</span>
                        <span>{student.date_of_birth}</span>
                        <span className="text-emerald-600 font-extrabold">({student.age} yrs • 18+ Verified)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{student.email}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>+91 {student.mobile}</span>
                      </div>
                    </div>

                    {student.rejection_reason && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200">
                        <span className="font-bold">Decline Reason Given:</span> "{student.rejection_reason}"
                      </div>
                    )}
                  </div>

                  {/* Middle: Mandatory 2 Photos & Verification ID Preview */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                    
                    {/* Photo 1 */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Photo 1 (Avatar)</span>
                      <img
                        src={student.photo_1}
                        alt="Photo 1"
                        onClick={() => setPreviewImageModal({ url: student.photo_1, title: `${student.full_name} - Photo 1` })}
                        className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
                      />
                    </div>

                    {/* Photo 2 */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Photo 2 (Campus)</span>
                      <img
                        src={student.photo_2}
                        alt="Photo 2"
                        onClick={() => setPreviewImageModal({ url: student.photo_2, title: `${student.full_name} - Photo 2` })}
                        className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
                      />
                    </div>

                    {/* Verification ID Card */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] text-rose-500 font-bold block truncate max-w-[100px]">
                        {student.verification_id_type || 'ID Card'}
                      </span>
                      <div className="relative group">
                        <img
                          src={student.verification_id_url}
                          alt="Verification ID Document"
                          onClick={() => setPreviewImageModal({ url: student.verification_id_url, title: `${student.full_name} - ${student.verification_id_type}` })}
                          className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-xl border-2 border-rose-400 shadow-xs cursor-pointer hover:opacity-90"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded-sm font-mono">
                          Zoom ID
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {student.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => approveStudentVerification(student.id)}
                          className="flex-1 sm:flex-none w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept & Create Account</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStudentForDecline(student);
                            setDeclineReasonText('');
                          }}
                          className="flex-1 sm:flex-none w-full px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline (Reason)</span>
                        </button>
                      </>
                    )}

                    {student.status === 'APPROVED' && (
                      <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1">
                        <Check className="w-4 h-4" /> Account Verified
                      </span>
                    )}

                    {student.status === 'REJECTED' && (
                      <button
                        onClick={() => approveStudentVerification(student.id)}
                        className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        Re-evaluate & Accept
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* -------------------- 2. OVERVIEW TAB -------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Pending ID Verifications Spotlight */}
            <div
              onClick={() => setActiveTab('verifications')}
              className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-sm cursor-pointer hover:brightness-105 transition-all"
            >
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Pending ID Verifications
              </span>
              <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">
                {pendingCount}
              </p>
              <span className="text-[10px] text-amber-600 font-bold">Needs Admin Approval →</span>
            </div>

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
              <span className="text-xs font-semibold text-slate-500">Safety Reports</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {adminReports.length}
              </p>
              <span className="text-[10px] text-amber-500 font-bold">Active Flags</span>
            </div>
          </div>

          {/* Privacy Notice regarding Chat inspection */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-3xl text-xs text-purple-900 dark:text-purple-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-purple-600 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Admin Trust & Privacy Boundary (PRD Section 6.2):</p>
              <p className="leading-relaxed">
                "Admin must not have unrestricted access to private conversations. Access to message content is strictly restricted to necessary, documented safety investigations with appropriate authorization and tamper-evident audit logging."
              </p>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 3. SAFETY REPORTS TAB -------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              User Safety & Moderation Reports
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
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

      {/* -------------------- 4. AUDIT LOGS TAB -------------------- */}
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

      {/* Decline Reason Modal */}
      {selectedStudentForDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900 animate-slide-up">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Decline Student Verification
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the reason for declining <strong>{selectedStudentForDecline.full_name}</strong>. The student will see this note to correct their details and re-upload valid ID.
            </p>

            <form onSubmit={handleConfirmDecline} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Decline (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={declineReasonText}
                  onChange={(e) => setDeclineReasonText(e.target.value)}
                  placeholder="e.g. Uploaded college ID is blurry and text cannot be read. Please upload a clear photo of your student ID card."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDecline(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal (For ID Card / Photos inspection) */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div className="max-w-2xl w-full bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3 text-center">
            <div className="flex items-center justify-between text-white text-xs font-semibold px-2">
              <span>{previewImageModal.title}</span>
              <X className="w-5 h-5 cursor-pointer text-slate-400 hover:text-white" />
            </div>
            <img
              src={previewImageModal.url}
              alt="Verification Inspection"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

export const ReportModal = () => {
  const { reportTarget, setReportTarget, handleReportUser } = useApp();
  const [category, setCategory] = useState('Abusive messages');
  const [description, setDescription] = useState('');

  if (!reportTarget) return null;

  const categories = [
    'Fake profile',
    'Harassment',
    'Abusive messages',
    'Impersonation',
    'Spam',
    'Threats',
    'Inappropriate content',
    'Underage user',
    'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    handleReportUser(reportTarget.user, category, description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Report {reportTarget.user.display_name}
            </h3>
          </div>
          <button
            onClick={() => setReportTarget(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for reporting
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional details (Confidential)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Explain what happened so our trust & safety moderation team can investigate promptly..."
              required
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your report is completely anonymous. The reported user will not be informed who submitted the report.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReportTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
            >
              Submit Report
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReportModal;

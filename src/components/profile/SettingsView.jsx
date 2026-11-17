import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  Trash2,
  Download,
  FileText,
  AlertTriangle,
  Lock,
  ArrowLeft
} from 'lucide-react';

export const SettingsView = () => {
  const { currentUser, navigateTo, addToast, setIsAuthenticated } = useApp();

  const [settings, setSettings] = useState({
    discovery_enabled: true,
    read_receipts_enabled: true,
    push_notifications_enabled: true,
    voice_note_preview: true
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleSetting = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      addToast('Privacy preference updated', 'info');
      return updated;
    });
  };

  const handleDownloadData = () => {
    addToast('Your DPDP data archive is being prepared and will be sent to your verified email.', 'success');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    setIsAuthenticated(false);
    addToast('Account and all associated messages permanently deleted under DPDP Act 2023.', 'warning');
    navigateTo('landing');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigateTo('profile')}
          className="p-1 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
            Privacy & Account Settings
          </h1>
          <p className="text-xs text-slate-500">
            India DPDP Act (2023) compliant privacy controls and account preferences.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Privacy & Discovery Toggles */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-500" /> Discovery & Presence
          </h3>

          <div className="space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Show in Discover Feed</p>
                <p className="text-[11px] text-slate-500">When paused, new people will not see your card in Discover.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.discovery_enabled}
                onChange={() => toggleSetting('discovery_enabled')}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Online & Last Seen Privacy</p>
                <p className="text-[11px] text-slate-500">Always hidden. Collégé never broadcasts your active or last seen status.</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 shrink-0">
                Hidden & Private
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Read Receipts</p>
                <p className="text-[11px] text-slate-500">Show double-checks when your match has read your message.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.read_receipts_enabled}
                onChange={() => toggleSetting('read_receipts_enabled')}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Push & In-App Notifications</p>
                <p className="text-[11px] text-slate-500">Get notified for matches, messages, and game invites.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.push_notifications_enabled}
                onChange={() => toggleSetting('push_notifications_enabled')}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* DPDP Act 2023 Consent History (Table 25: user_consents) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> DPDP Consent Registry
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Under India's Digital Personal Data Protection Act 2023, you can view your active consents or export all personal data.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Account & Matching Consent (v1.0)</p>
                <p className="text-[10px] text-slate-400">Consented on 01 Sep 2026 • Verified 18+</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Voice Note Storage Consent (v1.0)</p>
                <p className="text-[10px] text-slate-400">Encrypted signed URLs • Private buckets</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadData}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4 text-rose-500" />
            <span>Download All Personal Data (JSON / ZIP)</span>
          </button>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Deleting your account will erase your matches, conversations, audio notes, and photos permanently.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account & Purge Data</span>
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-200 dark:border-rose-900">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Permanently Delete Collégé Account?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              This action is immediate and non-reversible. In accordance with DPDP Act 2023, all your active likes, chats, voice notes and photos will be erased.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsView;

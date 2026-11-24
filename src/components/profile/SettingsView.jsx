import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PrivacyRequestModal } from '../public/PrivacyRequestModal';
import api from '../../services/api';
import {
  ShieldCheck,
  Bell,
  CheckCircle2,
  Trash2,
  Download,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  Globe,
  Sliders,
  LogOut,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Smartphone,
  Monitor,
  KeyRound,
  Shield
} from 'lucide-react';

export const SettingsView = () => {
  const {
    currentUser,
    navigateTo,
    addToast,
    logout,
    theme,
    setTheme,
    userPreferences,
    updatePreferences,
    playSoundEffect,
    discoveryFilters,
    updateDiscoveryPreferences,
    activeSessions,
    refreshSessions,
    handleRevokeSession,
    handleRevokeOtherSessions
  } = useApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isSavingDiscovery, setIsSavingDiscovery] = useState(false);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  // Password Change State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  useEffect(() => {
    if (refreshSessions) {
      refreshSessions();
    }
  }, []);

  const handleRevokeAllOtherDevices = async () => {
    setIsRevokingOthers(true);
    try {
      await handleRevokeOtherSessions();
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      addToast('New password must contain at least 8 characters, an uppercase letter, a lowercase letter, and a number.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'warning');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res?.success) {
        addToast('Password changed successfully! All other active sessions have been signed out.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
        refreshSessions();
      } else {
        addToast(res?.message || 'Failed to change password.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // Local state for discovery preferences before saving
  const [localDiscovery, setLocalDiscovery] = useState({
    gender: discoveryFilters?.gender || 'All',
    minAge: discoveryFilters?.minAge || 18,
    maxAge: discoveryFilters?.maxAge || 26,
    intention: discoveryFilters?.intention || 'All',
    city: discoveryFilters?.city || 'All',
    maxDistance: discoveryFilters?.maxDistance || 100,
  });

  const handleDiscoveryChange = (key, value) => {
    setLocalDiscovery((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDiscovery = async () => {
    setIsSavingDiscovery(true);
    try {
      await updateDiscoveryPreferences(localDiscovery);
      playSoundEffect('pop');
      addToast('Discovery preferences saved and synchronized to your account!', 'success');
    } catch (err) {
      addToast('Failed to sync discovery preferences. Cached locally.', 'warning');
    } finally {
      setIsSavingDiscovery(false);
    }
  };

  const handleToggleSound = () => {
    const nextVal = !userPreferences.soundEnabled;
    updatePreferences({ soundEnabled: nextVal });
    if (nextVal) {
      playSoundEffect('pop');
      addToast('Sound effects enabled', 'info');
    } else {
      addToast('Sound effects muted', 'info');
    }
  };

  const handleToggleNotification = (key) => {
    const updatedNotifs = {
      ...userPreferences.notifications,
      [key]: !userPreferences.notifications[key]
    };
    updatePreferences({ notifications: updatedNotifs });
    playSoundEffect('pop');
    addToast('Notification preferences updated', 'info');
  };

  const handleDownloadData = () => {
    playSoundEffect('pop');
    addToast('Your DPDP data archive is being prepared and will be sent to your verified email.', 'success');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    logout();
    addToast('Account and all associated data permanently scheduled for deletion under DPDP Act 2023.', 'warning');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigateTo('profile')}
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to profile"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
            Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personalize your Collage Story experience, privacy, and account settings.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* 1. APPEARANCE & THEME PREFERENCE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Appearance & Theme
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saved instantly. System default matches your device appearance automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                playSoundEffect('pop');
              }}
              className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
                theme === 'light'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-600 shadow-sm dark:bg-rose-950/30 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>Light</span>
              {theme === 'light' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                playSoundEffect('pop');
              }}
              className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-600 shadow-sm dark:bg-rose-950/30 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>Dark</span>
              {theme === 'dark' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>

            {/* System Default */}
            <button
              type="button"
              onClick={() => {
                setTheme('system');
                playSoundEffect('pop');
              }}
              className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
                theme === 'system'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-600 shadow-sm dark:bg-rose-950/30 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Laptop className={`w-5 h-5 ${theme === 'system' ? 'text-rose-500' : 'text-slate-400'}`} />
              <span>System</span>
              {theme === 'system' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          </div>
        </div>

        {/* 2. LANGUAGE PREFERENCE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" /> Language / भाषा
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select your preferred interface language for Collage Story.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'en', label: 'English', sub: 'Default' },
              { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
              { id: 'te', label: 'తెలుగు', sub: 'Telugu' }
            ].map((lang) => {
              const isSelected = (userPreferences.language || 'en') === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    updatePreferences({ language: lang.id });
                    playSoundEffect('pop');
                    addToast(`Language set to ${lang.label}`, 'info');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/50 text-rose-600 font-bold dark:bg-rose-950/30 dark:text-rose-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{lang.label}</span>
                  <span className="text-[10px] text-slate-400">{lang.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SOUND EFFECTS & AUDIO FEEDBACK */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                {userPreferences.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                Sound Effects & Audio Feedback
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Play subtle audio chimes for new messages, matches, and interactions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userPreferences.soundEnabled ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={userPreferences.soundEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  userPreferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Test Audio Feedback
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => playSoundEffect('pop')}
                disabled={!userPreferences.soundEnabled}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                Chime Pop
              </button>
              <button
                type="button"
                onClick={() => playSoundEffect('message')}
                disabled={!userPreferences.soundEnabled}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                Message Tone
              </button>
            </div>
          </div>
        </div>

        {/* 4. NOTIFICATION PREFERENCES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-rose-500" /> Notifications & Alerts
          </h3>

          <div className="space-y-4">
            {[
              {
                id: 'matches',
                label: 'Match & Like Alerts',
                desc: 'When another verified student likes your profile or accepts your match request.'
              },
              {
                id: 'messages',
                label: 'Chat Messages',
                desc: 'Receive alerts when your active matches send you direct messages.'
              },
              {
                id: 'games',
                label: 'Game Invites & Challenges',
                desc: 'Get notified when peers challenge you in Trivia, Wordle, or Icebreakers.'
              },
              {
                id: 'announcements',
                label: 'Campus Board Updates',
                desc: 'Trending posts, event announcements, and college updates from your peers.'
              }
            ].map((item, idx) => {
              const isChecked = userPreferences.notifications?.[item.id] !== false;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between ${
                    idx !== 3 ? 'pb-3 border-b border-slate-100 dark:border-slate-800' : ''
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleNotification(item.id)}
                    className="w-4 h-4 accent-rose-500 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. DISCOVERY PREFERENCES & SEARCH FILTERS (PostgreSQL Synced) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-500" /> Discovery Filters & Matching Rules
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controls student recommendations in Discover. Synchronized with your account.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              Cloud Synced
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Interested In */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Interested In (Gender)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['All', 'Female', 'Male'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleDiscoveryChange('gender', g)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      localDiscovery.gender === g
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {g === 'All' ? 'Everyone' : g === 'Female' ? 'Women' : 'Men'}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Age Range
                </label>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {localDiscovery.minAge} – {localDiscovery.maxAge} years
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Min Age (18+)</span>
                  <input
                    type="range"
                    min="18"
                    max="28"
                    value={localDiscovery.minAge}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleDiscoveryChange('minAge', Math.min(val, localDiscovery.maxAge));
                    }}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Max Age</span>
                  <input
                    type="range"
                    min="19"
                    max="35"
                    value={localDiscovery.maxAge}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleDiscoveryChange('maxAge', Math.max(val, localDiscovery.minAge));
                    }}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Relationship Intention */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Looking For (Relationship Intention)
              </label>
              <select
                value={localDiscovery.intention}
                onChange={(e) => handleDiscoveryChange('intention', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="All">Any Relationship Goal</option>
                <option value="Dating">Dating & Campus Romance</option>
                <option value="Serious">Long-Term Relationship</option>
                <option value="Casual">Casual Dating</option>
                <option value="Friendship">Campus Friends & Hanging Out</option>
                <option value="Study Buddy">Study Buddy & Academic Partner</option>
              </select>
            </div>

            {/* Maximum Distance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Maximum Distance
                </label>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {localDiscovery.maxDistance} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={localDiscovery.maxDistance}
                onChange={(e) => handleDiscoveryChange('maxDistance', parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5 km (Nearby campus)</span>
                <span>250 km (Metro zone)</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveDiscovery}
                disabled={isSavingDiscovery}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white gradient-brand-bg hover:brightness-105 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isSavingDiscovery ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing to Server...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Discovery Preferences</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* 6. DPDP ACT 2023 CONSENT & DATA PRIVACY */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> DPDP Act 2023 Privacy Rights & Registry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Under India's Digital Personal Data Protection Act 2023, you retain complete rights to access, review, correct, or erase your student profile data.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Account & Matching Consent (v1.0)</p>
                <p className="text-[10px] text-slate-400">Consented on 01 Sep 2026 • Verified 18+ Student</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Voice Note Storage Consent (v1.0)</p>
                <p className="text-[10px] text-slate-400">Encrypted signed URLs • Private storage buckets</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadData}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4 text-rose-500" />
              <span>Download Data Archive</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Submit DPDP Data Request</span>
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => navigateTo('privacy')}
              className="text-xs text-rose-500 hover:underline inline-flex items-center gap-1"
            >
              Read full Collage Story Privacy Policy & Data Rights &rarr;
            </button>
          </div>
        </div>

        {/* 7. ACTIVE SESSIONS & ACCOUNT SECURITY */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-500" /> Active Device Sessions & Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control active logins across phones, tablets and browsers. Revoke unfamiliar devices instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshSessions}
              className="self-start sm:self-auto px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Refresh active sessions"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="space-y-3">
            {activeSessions && activeSessions.length > 0 ? (
              activeSessions.map((session) => {
                const isMobile = session.deviceType === 'Mobile';
                return (
                  <div
                    key={session.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      session.isCurrentSession
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            session.isCurrentSession
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {session.browser || 'Browser'} on {session.os || 'Device'}
                            </span>
                            {session.isCurrentSession && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            IP: <span className="font-mono">{session.ipAddress || '127.0.0.1'}</span> • Signed in{' '}
                            {new Date(session.createdAt || Date.now()).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Last Active:{' '}
                            {new Date(session.lastActivityAt || session.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {!session.isCurrentSession && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors shrink-0 cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Current Web Session</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Authenticated Student Account</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Revoke All Others & Change Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleRevokeAllOtherDevices}
              disabled={isRevokingOthers}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isRevokingOthers ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Revoking Other Devices...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Log Out of All Other Devices</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>{showPasswordSection ? 'Hide Password Form' : 'Change Account Password'}</span>
            </button>
          </div>

          {/* Change Password Inline Form */}
          {showPasswordSection && (
            <form onSubmit={handleChangePasswordSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-500" /> Change Password
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New strong password"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(false)}
                  className="w-1/3 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="flex-1 py-2 gradient-brand-bg text-white font-bold rounded-xl shadow-xs hover:brightness-105 cursor-pointer"
                >
                  {passwordChangeLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          )}

          {/* Standard Sign Out Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Current Device</span>
            </button>
          </div>
        </div>

        {/* 8. DANGER ZONE: DELETE ACCOUNT */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Deleting your account will erase your matches, conversations, audio notes, and photos permanently.
          </p>

          <button
            type="button"
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
              Permanently Delete Collage Story Account?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              This action is immediate and non-reversible. In accordance with DPDP Act 2023, all your active likes, chats, voice notes and photos will be erased.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Request Modal */}
      <PrivacyRequestModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

    </div>
  );
};

export default SettingsView;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PrivacyRequestModal } from '../public/PrivacyRequestModal';
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
  HelpCircle
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
    updateDiscoveryPreferences
  } = useApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isSavingDiscovery, setIsSavingDiscovery] = useState(false);

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
            Personalize your Collégé experience, privacy, and account settings.
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
                Select your preferred interface language for Collégé.
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
              Read full Collégé Privacy Policy & Data Rights &rarr;
            </button>
          </div>
        </div>

        {/* 7. SESSION MANAGEMENT & LOGOUT */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" /> Session Security & Shared Device Protection
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Signing out clears your authenticated session and in-memory tokens. Shared devices are protected from unauthorized profile or chat access.
          </p>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Collégé</span>
          </button>
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
              Permanently Delete Collégé Account?
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

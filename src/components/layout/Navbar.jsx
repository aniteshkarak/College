import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Heart,
  MessageCircle,
  Gamepad2,
  Users2,
  Bell,
  Sparkles,
  ShieldAlert,
  Sliders,
  LogOut,
  User,
  Check,
  Moon,
  Sun,
  Crown
} from 'lucide-react';

export const Navbar = ({ onOpenMoodModal }) => {
  const {
    currentUser,
    currentView,
    navigateTo,
    matches,
    notifications,
    markAllNotificationsRead,
    currentMood,
    setIsPremiumModalOpen,
    isAuthenticated,
    setIsAuthenticated
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = matches.reduce((sum, m) => sum + (m.unread_count || 0), 0);

  const navLinks = [
    { id: 'discover', label: 'Discover', icon: <Flame className="w-4 h-4" /> },
    {
      id: 'matches',
      label: 'Matches',
      icon: <Heart className="w-4 h-4" />,
      badge: matches.length > 0 ? matches.length : null
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageCircle className="w-4 h-4" />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
    },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'relationship', label: 'Relationship', icon: <Users2 className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-rose-100 dark:border-rose-950/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo(isAuthenticated ? 'discover' : 'landing')}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-orange-500 p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <span className="font-display font-bold text-xl gradient-brand-text">C</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                  Collégé
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full tracking-wider">
                  India
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                Meet. Chat. Connect.
              </p>
            </div>
          </button>
        </div>

        {/* Center Navigation Links (Desktop) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id)}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mood status pill */}
          {isAuthenticated && (
            <button
              onClick={onOpenMoodModal}
              title="Update your current campus mood"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-slate-700/80 border border-rose-200/60 dark:border-rose-900/40 rounded-full text-xs font-medium text-rose-700 dark:text-rose-300 transition-colors"
            >
              <span>{currentMood?.emoji || '✨'}</span>
              <span className="max-w-[110px] truncate">{currentMood?.label || 'Mood'}</span>
            </button>
          )}

          {/* Collégé Premium Button */}
          {isAuthenticated && (
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-semibold shadow-sm hover:shadow-md hover:brightness-105 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Premium</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 animate-slide-up z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-rose-500" /> Notifications
                    </h3>
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-3 px-2 flex items-start gap-3 rounded-xl transition-colors ${
                          n.read ? 'opacity-70' : 'bg-rose-50/50 dark:bg-rose-950/20'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0 text-rose-600">
                          {n.type === 'match' ? <Heart className="w-4 h-4 fill-rose-500" /> : <MessageCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">{n.body}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Avatar Dropdown */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.display_name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/30"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
                  {currentUser.display_name}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-slide-up z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.college_name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">
                      {currentUser.verification_status}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigateTo('profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <User className="w-4 h-4 text-slate-500" /> View Profile
                    </button>
                    <button
                      onClick={() => {
                        navigateTo('edit-profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <Sliders className="w-4 h-4 text-slate-500" /> Edit Profile & Preferences
                    </button>
                    <button
                      onClick={() => {
                        navigateTo('settings');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <ShieldAlert className="w-4 h-4 text-slate-500" /> Privacy & DPDP Consent
                    </button>
                    <button
                      onClick={() => {
                        navigateTo('admin');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" /> Admin Dashboard (Role)
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        navigateTo('landing');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" /> Guest Mode / Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAuthenticated(true);
                  navigateTo('discover');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setIsAuthenticated(true);
                  navigateTo('discover');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white gradient-brand-bg rounded-full shadow-sm hover:shadow-md transition-all"
              >
                Join Collégé
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;

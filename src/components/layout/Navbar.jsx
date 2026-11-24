import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resolvePhotoUrl } from '../../services/api';
import {
  Flame,
  Heart,
  MessageCircle,
  Gamepad2,
  Megaphone,
  Bell,
  Sparkles,
  ShieldAlert,
  Sliders,
  LogOut,
  User,
  Smile,
  Check,
  Moon,
  Sun,
  Crown,
  Trash2,
  Mic,
  AlertCircle
} from 'lucide-react';

export const Navbar = ({ onOpenMoodModal }) => {
  const {
    currentUser,
    currentView,
    navigateTo,
    matches,
    incomingLikes,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    markNotificationRead,
    deleteNotification,
    currentMood,
    currentPlanConfig,
    setIsPremiumModalOpen,
    isAuthenticated,
    setIsAuthenticated,
    logout,
    setIsAuthModalOpen,
    setAuthModalMode,
    theme,
    isDarkMode,
    toggleTheme
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const effectiveUnreadCount = typeof unreadNotificationsCount === 'number'
    ? unreadNotificationsCount
    : notifications.filter((n) => !n.read && !n.isRead).length;
  const unreadMessagesCount = matches.reduce((sum, m) => sum + (m.unread_count || 0), 0);

  const renderNotificationIcon = (type) => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'NEW_LIKE':
      case 'LIKE':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0 text-rose-600">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
        );
      case 'LIKE_ACCEPTED':
      case 'MATCH':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 text-emerald-600">
            <Sparkles className="w-4 h-4 fill-emerald-500" />
          </div>
        );
      case 'NEW_MESSAGE':
      case 'TEXT_MESSAGE':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0 text-blue-600">
            <MessageCircle className="w-4 h-4" />
          </div>
        );
      case 'NEW_VOICE_MESSAGE':
      case 'VOICE_MESSAGE':
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600">
            <Mic className="w-4 h-4" />
          </div>
        );
      case 'CAMPUS_ANNOUNCEMENT':
      case 'ANNOUNCEMENT':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0 text-amber-600">
            <Megaphone className="w-4 h-4" />
          </div>
        );
      case 'ADMIN_NOTICE':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0 text-purple-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
      case 'REPORT_UPDATE':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center shrink-0 text-orange-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read && !notif.isRead && markNotificationRead) {
      markNotificationRead(notif.id);
    }
    setIsNotifOpen(false);

    const t = (notif.type || notif.rawType || '').toUpperCase();
    switch (t) {
      case 'NEW_LIKE':
      case 'LIKE':
        navigateTo('matches');
        break;
      case 'LIKE_ACCEPTED':
      case 'MATCH':
      case 'NEW_MESSAGE':
      case 'NEW_VOICE_MESSAGE':
      case 'TEXT_MESSAGE':
      case 'VOICE_MESSAGE':
        navigateTo('chats');
        break;
      case 'CAMPUS_ANNOUNCEMENT':
      case 'ANNOUNCEMENT':
        navigateTo('campus-board');
        break;
      case 'REPORT_UPDATE':
        navigateTo('settings');
        break;
      default:
        break;
    }
  };

  const navLinks = [
    { id: 'discover', label: 'Discover', icon: <Flame className="w-4 h-4" /> },
    {
      id: 'matches',
      label: 'Matches',
      icon: <Heart className="w-4 h-4" />,
      badge: incomingLikes.length > 0 ? incomingLikes.length : null
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageCircle className="w-4 h-4" />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
    },
    { id: 'campus-board', label: 'Campus Board', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-rose-100 dark:border-rose-950/40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => navigateTo(isAuthenticated ? 'matches' : 'landing')}
            className="flex items-center gap-1.5 sm:gap-2 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-orange-500 p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] sm:rounded-[14px] p-0.5 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Collage Story Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                  Collage Story
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full tracking-wider">
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
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Mood status pill */}
          {isAuthenticated && (
            <button
              onClick={onOpenMoodModal}
              title="Update your current campus mood"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-rose-50 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-slate-700/80 border border-rose-200/60 dark:border-rose-900/40 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-300 transition-all shadow-2xs hover:scale-102 cursor-pointer"
            >
              <span className="text-sm">{currentMood?.emoji || '✨'}</span>
              <span className="hidden sm:inline max-w-[110px] truncate">{currentMood?.label || 'Mood'}</span>
            </button>
          )}

          {/* Collage Story Membership Plan Button (₹49 / ₹99 / Free) */}
          {isAuthenticated && (
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-md hover:brightness-105 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{currentUser?.subscription_plan === 'free' || !currentUser?.subscription_plan ? '₹49/mo' : (currentPlanConfig?.name || 'Pro Plan')}</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Current theme: ${theme} (Click to toggle)`}
            aria-label={`Current theme: ${theme}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          {isAuthenticated && (
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                {effectiveUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                    {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 animate-slide-up z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-rose-500" /> Notifications
                      </h3>
                      {effectiveUnreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full">
                          {effectiveUnreadCount} new
                        </span>
                      )}
                    </div>
                    {effectiveUnreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-semibold">No notifications yet</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          You're all caught up with your college activity.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isRead = Boolean(n.read || n.isRead);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`group py-3 px-2.5 flex items-start gap-3 rounded-xl cursor-pointer transition-colors ${
                              isRead
                                ? 'opacity-75 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                : 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                          >
                            {renderNotificationIcon(n.type || n.rawType)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs ${isRead ? 'font-medium text-slate-800 dark:text-slate-200' : 'font-bold text-slate-900 dark:text-white'}`}>
                                  {n.title}
                                </p>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                {n.message || n.body}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.time}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!isRead && markNotificationRead && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationRead(n.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                                      title="Mark as read"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {deleteNotification && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(n.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                                      title="Delete notification"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Avatar Dropdown */}
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <img
                  src={resolvePhotoUrl(currentUser?.avatar_url || currentUser?.avatarUrl || currentUser?.photos?.[0]?.url)}
                  alt={currentUser?.display_name || currentUser?.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/30"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
                  {currentUser?.display_name || currentUser?.displayName || 'User'}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-slide-up z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.full_name || currentUser?.fullName || 'Student'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.college_name || currentUser?.collegeName || 'Premier College'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">
                      {currentUser?.verification_status || currentUser?.verificationStatus || 'APPROVED'}
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
                        onOpenMoodModal();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <Smile className="w-4 h-4 text-rose-500" /> Change Campus Mood
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
                        navigateTo('campus-board');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                    >
                      <Megaphone className="w-4 h-4 text-rose-500" /> Campus Board (Exclusive)
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
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-2.5 sm:px-4 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
                className="px-2.5 sm:px-4 py-1.5 text-xs font-semibold text-white gradient-brand-bg rounded-full shadow-sm hover:shadow-md hover:brightness-105 transition-all whitespace-nowrap"
              >
                <span className="hidden xs:inline">Create </span>Account
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;

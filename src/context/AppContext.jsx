import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { api, setStoredToken, clearStoredToken, getStoredToken, hasActiveSessionIndicator, getStoredUser, setStoredUser } from '../services/api';
import {
  INITIAL_USER,
  DISCOVER_PROFILES,
  INITIAL_INCOMING_LIKES,
  INITIAL_MUTUAL_FRIENDS,
  INITIAL_CONVERSATIONS,
  INITIAL_CAMPUS_ANNOUNCEMENTS,
  SUBSCRIPTION_PLANS,
  MOOD_OPTIONS,
  ADMIN_METRICS,
  ADMIN_REPORTS,
  ADMIN_AUDIT_LOGS,
  INITIAL_PENDING_VERIFICATIONS,
  PREMIER_COLLEGES
} from '../services/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- 1. THEME PREFERENCE (college_theme) ---
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('college_theme') || 'system';
    } catch (e) {
      return 'system';
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('college_theme') || 'system';
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  const applyThemeToDOM = (targetTheme) => {
    if (typeof document === 'undefined') return;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = targetTheme === 'dark' || (targetTheme === 'system' && prefersDark);
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (newTheme) => {
    const validTheme = ['light', 'dark', 'system'].includes(newTheme) ? newTheme : 'system';
    setThemeState(validTheme);
    try {
      localStorage.setItem('college_theme', validTheme);
    } catch (e) {}
    applyThemeToDOM(validTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  useEffect(() => {
    applyThemeToDOM(theme);
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyThemeToDOM('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [theme]);

  // --- 2. USER PREFERENCES (college_preferences) ---
  const DEFAULT_PREFERENCES = {
    theme: 'system',
    language: 'en',
    soundEnabled: true,
    notifications: {
      matches: true,
      messages: true,
      games: true,
      announcements: true,
    },
    discoveryFilters: {
      minAge: 18,
      maxAge: 26,
      gender: 'All',
      city: 'All',
      intention: 'All',
      maxDistance: 100,
      selectedInterests: [],
    },
    lastVisitedSection: 'matches',
    lastActiveChatId: null,
    dismissedHints: [],
  };

  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      const raw = localStorage.getItem('college_preferences');
      if (!raw) return DEFAULT_PREFERENCES;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        notifications: { ...DEFAULT_PREFERENCES.notifications, ...(parsed.notifications || {}) },
        discoveryFilters: { ...DEFAULT_PREFERENCES.discoveryFilters, ...(parsed.discoveryFilters || {}) },
      };
    } catch (e) {
      console.warn('Corrupted college_preferences recovered to safe defaults');
      return DEFAULT_PREFERENCES;
    }
  });

  const updatePreferences = (newPrefs) => {
    setUserPreferences((prev) => {
      const updated = typeof newPrefs === 'function' ? newPrefs(prev) : { ...prev, ...newPrefs };
      try {
        localStorage.setItem('college_preferences', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const playSoundEffect = (type = 'pop') => {
    if (!userPreferences.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(type === 'message' ? 587.33 : 880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  };

  // Auth & View state - Persistent Browser Storage for Instant Zero-Flicker Session Restoration
  const savedUser = getStoredUser();
  const savedToken = getStoredToken();
  const hasSavedSession = !!(savedUser && savedToken);

  const [isAuthenticated, setIsAuthenticated] = useState(hasSavedSession);
  const [isAuthChecking, setIsAuthChecking] = useState(!hasSavedSession);
  const [currentUser, setCurrentUser] = useState(savedUser);
  const [currentView, setCurrentView] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const searchParam = new URLSearchParams(window.location.search).get('view');
      const target = hash || searchParam;
      if (target === 'admin') return 'admin';
    } catch (e) {}

    if (hasSavedSession) {
      try {
        const rawPrefs = localStorage.getItem('college_preferences');
        const parsedPrefs = rawPrefs ? JSON.parse(rawPrefs) : null;
        const lastSection = parsedPrefs?.lastVisitedSection;
        const allowedSections = ['matches', 'discover', 'campus-board', 'profile', 'relationship', 'games', 'settings', 'chats', 'edit-profile'];
        if (allowedSections.includes(lastSection)) {
          return lastSection;
        }
      } catch (e) {}
      return 'matches';
    }
    return 'landing';
  });
  const [previousView, setPreviousView] = useState('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'status' | 'forgot-password' | 'reset-password'
  const [resetPasswordToken, setResetPasswordToken] = useState(null);

  // Check URL parameters for password reset links or direct modal routes on initial load
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = searchParams.get('resetToken') || searchParams.get('token');
      const hash = window.location.hash;
      const isResetRoute = hash === '#reset-password' || hash.startsWith('#reset-password') || window.location.pathname === '/reset-password';
      if (tokenFromUrl || isResetRoute) {
        if (tokenFromUrl) {
          setResetPasswordToken(tokenFromUrl);
        }
        setAuthModalMode('reset-password');
        setIsAuthModalOpen(true);
      } else if (hash === '#forgot-password' || window.location.pathname === '/forgot-password') {
        setAuthModalMode('forgot-password');
        setIsAuthModalOpen(true);
      }
    } catch (_) {}
  }, []);

  // Automatically keep browser localStorage college_user synchronized whenever currentUser updates
  useEffect(() => {
    if (currentUser) {
      setStoredUser(currentUser);
    }
  }, [currentUser]);

  // Restore authenticated session from backend & support direct #admin routing
  useEffect(() => {
    const initAuthAndPreferences = async () => {
      try {
        const hash = window.location.hash.replace('#', '');
        const searchParam = new URLSearchParams(window.location.search).get('view');
        const target = hash || searchParam;
        if (target === 'admin') {
          setCurrentView('admin');
          return;
        }
      } catch (e) {}

      const token = getStoredToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }

      try {
        // Attempt to fetch profile from backend with credentials/cookie
        let res = await api.auth.getMe().catch(async (err) => {
          if (err?.status === 401) {
            // Attempt token refresh via refresh token
            const refreshRes = await api.auth.refresh().catch(() => null);
            if (refreshRes && refreshRes.success) {
              const newToken = refreshRes.data?.token || refreshRes.data?.accessToken;
              if (newToken) {
                setStoredToken(newToken);
              }
              return await api.auth.getMe().catch(() => null);
            }
          }
          return null;
        });

        if (res && res.data) {
          const userObj = res.data.user || res.data;
          setCurrentUser(userObj);
          setStoredUser(userObj);
          setIsAuthenticated(true);

          // Synchronize discovery preferences from PostgreSQL database
          try {
            const prefsRes = await api.discovery.getPreferences();
            if (prefsRes?.data?.preferences) {
              const serverPrefs = prefsRes.data.preferences;
              const syncedFilters = {
                minAge: serverPrefs.minAge || 18,
                maxAge: serverPrefs.maxAge || 26,
                gender: serverPrefs.gender || 'All',
                city: serverPrefs.city || 'All',
                intention: serverPrefs.relationshipIntention || 'All',
                maxDistance: serverPrefs.maxDistance || 100,
                selectedInterests: userPreferences.discoveryFilters?.selectedInterests || [],
              };
              setDiscoveryFilters(syncedFilters);
              updatePreferences({ discoveryFilters: syncedFilters });
            }
          } catch (prefErr) {
            console.warn('Could not sync discovery preferences from backend:', prefErr.message);
          }

          // Restore last visited view if safe, otherwise default to matches
          const lastSection = userPreferences.lastVisitedSection;
          const allowedSections = ['matches', 'discover', 'campus-board', 'profile', 'relationship', 'games', 'settings', 'chats', 'edit-profile'];
          if (allowedSections.includes(lastSection)) {
            setCurrentView(lastSection);
          } else {
            setCurrentView('matches');
          }
        } else if (!savedUser) {
          // No valid session on server and no saved user; clear session indicator safely
          clearStoredToken();
          setStoredUser(null);
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session restoration encountered an issue:', err.message);
        if (err?.status === 401 || err?.status === 403) {
          clearStoredToken();
          setStoredUser(null);
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuthAndPreferences();
  }, []);

  // Colleges Registry loaded dynamically from PostgreSQL database
  const [collegesList, setCollegesList] = useState(PREMIER_COLLEGES);

  useEffect(() => {
    if (typeof api?.registration?.getColleges === 'function') {
      api.registration.getColleges()
        .then((res) => {
          if (res?.data?.colleges && res.data.colleges.length > 0) {
            setCollegesList(res.data.colleges);
          }
        })
        .catch((err) => console.warn('Could not load colleges directory from database:', err.message));
    }
  }, []);

  // Pending Verifications Queue for Admin (72-Hour Manual Verification System)
  const [pendingVerifications, setPendingVerifications] = useState(INITIAL_PENDING_VERIFICATIONS);

  // Discovery
  const [profiles, setProfiles] = useState(DISCOVER_PROFILES);
  const [likedProfiles, setLikedProfiles] = useState(() => {
    try {
      const stored = localStorage.getItem('college_liked_profiles');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [passedProfiles, setPassedProfiles] = useState(() => {
    try {
      const stored = localStorage.getItem('college_passed_profiles');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Filters
  const [discoveryFilters, setDiscoveryFilters] = useState(() => {
    return userPreferences.discoveryFilters || {
      minAge: 18,
      maxAge: 26,
      gender: 'All',
      city: 'All',
      intention: 'All',
      sameCollegeOnly: false,
      maxDistance: 100,
      selectedInterests: []
    };
  });

  const [discoveryCycleInfo, setDiscoveryCycleInfo] = useState({
    currentCycleId: 1,
    isNewCycle: false,
    cycleCompleted: false,
    unseenEligibleCount: 0,
    sameCollegeCount: 0,
    otherCollegesCount: 0,
  });
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);

  // Fetch live personalized discovery profiles from backend
  const fetchDiscoveryProfiles = async (customParams = {}, resetFirst = false) => {
    if (!isAuthenticated && !savedToken) return;
    setIsDiscoveryLoading(true);
    try {
      if (resetFirst) {
        await api.discovery.resetCycle().catch((err) => console.warn('Reset cycle sync:', err.message));
      }

      const activeFilters = { ...discoveryFilters, ...customParams };
      const queryParams = {
        gender: activeFilters.gender,
        minAge: activeFilters.minAge,
        maxAge: activeFilters.maxAge,
        city: activeFilters.city,
        intention: activeFilters.intention,
        sameCollegeOnly: activeFilters.sameCollegeOnly !== undefined ? activeFilters.sameCollegeOnly : undefined,
        limit: customParams.limit || 20,
      };

      const res = await api.discovery.getProfiles(queryParams);
      const users = res?.data?.profiles || res?.data?.users || [];
      const pagination = res?.data?.pagination || {};

      setDiscoveryCycleInfo({
        currentCycleId: pagination.currentCycleId || 1,
        isNewCycle: Boolean(pagination.isNewCycle),
        cycleCompleted: Boolean(pagination.cycleCompleted),
        unseenEligibleCount: pagination.unseenEligibleCount ?? 0,
        sameCollegeCount: pagination.sameCollegeCount ?? 0,
        otherCollegesCount: pagination.otherCollegesCount ?? 0,
      });

      const mapped = users.map((u) => ({
        id: u.id,
        display_name: u.displayName || u.display_name || u.fullName,
        age: u.age || u.profile?.age || 21,
        gender: u.gender || u.profile?.gender || 'Student',
        city: u.city || u.profile?.city || 'Campus',
        state: u.state || u.profile?.state || '',
        college_name: u.collegeName || u.college_name || u.education?.collegeName || 'Premier College',
        is_same_college: Boolean(u.isSameCollege),
        course: u.course || u.degreeName || u.education?.course || 'Degree Program',
        relationship_intention: u.relationshipIntention || u.relationship_intention || 'Casual Connection',
        avatar_url: u.avatarUrl || u.avatar_url || u.photos?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        additional_photos: u.additionalPhotos || u.additional_photos || (u.photos?.slice(1) || []).map((p) => p.url),
        photos: u.photos || [],
        bio: u.bio || u.profile?.bio || 'Verified college student on Collage Story.',
        interests: u.interests || u.profile?.interests || [],
        languages: u.languages || u.languagesSpoken || ['English'],
        mood: u.mood || u.currentMood || 'Looking for a conversation',
        verified: true,
      }));

      setProfiles(mapped);
      return mapped;
    } catch (err) {
      console.warn('Could not load discovery profiles:', err.message);
    } finally {
      setIsDiscoveryLoading(false);
    }
  };

  const updateDiscoveryPreferences = async (newFilters) => {
    const merged = { ...discoveryFilters, ...newFilters };
    setDiscoveryFilters(merged);
    updatePreferences({ discoveryFilters: merged });

    if (isAuthenticated) {
      try {
        const payload = {};
        if (merged.gender) payload.gender = merged.gender;
        if (merged.minAge) payload.minAge = parseInt(merged.minAge, 10);
        if (merged.maxAge) payload.maxAge = parseInt(merged.maxAge, 10);
        if (merged.intention) payload.relationshipIntention = merged.intention;
        if (merged.city) payload.city = merged.city;
        if (merged.sameCollegeOnly !== undefined) payload.sameCollegeOnly = Boolean(merged.sameCollegeOnly);
        if (merged.maxDistance) payload.maxDistance = parseInt(merged.maxDistance, 10);

        await api.discovery.updatePreferences(payload);
        fetchDiscoveryProfiles(merged);
      } catch (err) {
        console.warn('Failed to sync discovery preferences to server:', err.message);
      }
    }
  };

  // Incoming Likes ("Who liked you" with Accept / Reject buttons)
  const [incomingLikes, setIncomingLikes] = useState(INITIAL_INCOMING_LIKES);

  // Sent Requests (Outgoing like requests with status & cancellation)
  const [sentRequests, setSentRequests] = useState([]);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Mutual Friends / Matches (Can only message after Accept!)
  const [matches, setMatches] = useState(INITIAL_MUTUAL_FRIENDS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeChatMatch, setActiveChatMatchState] = useState(null);

  const setActiveChatMatch = (matchOrUpdater) => {
    setActiveChatMatchState((prev) => {
      const next = typeof matchOrUpdater === 'function' ? matchOrUpdater(prev) : matchOrUpdater;
      if (next?.id) {
        updatePreferences({ lastActiveChatId: next.id });
      } else if (next === null) {
        updatePreferences({ lastActiveChatId: null });
      }
      return next;
    });
  };

  // Campus Board Announcements (College exclusive)
  const [announcements, setAnnouncements] = useState(INITIAL_CAMPUS_ANNOUNCEMENTS);
  const [campusEvents, setCampusEvents] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [boardInfo, setBoardInfo] = useState(null);
  const [dailyAllowance, setDailyAllowance] = useState({
    usedToday: 0,
    maxDailyLimit: 5,
    remainingAllowance: 5,
    message: 'Announcements used today: 0/5',
    isLimitReached: false,
  });

  // Active Relationship
  const [activeRelationship, setActiveRelationship] = useState(null);

  // Active Sessions & Sockets
  const socketRef = useRef(null);
  const [activeSessions, setActiveSessions] = useState([]);

  // Mood Resolution Helper
  const resolveMoodOption = (moodStr) => {
    if (!moodStr) return MOOD_OPTIONS[0];
    if (typeof moodStr === 'object' && moodStr.label) return moodStr;
    const clean = String(moodStr).trim().toLowerCase();
    const exact = MOOD_OPTIONS.find((m) => m.id.toLowerCase() === clean || m.label.toLowerCase() === clean);
    if (exact) return exact;
    const partial = MOOD_OPTIONS.find((m) => m.label.toLowerCase().includes(clean) || clean.includes(m.id.toLowerCase()));
    if (partial) return partial;
    return { id: 'custom', label: moodStr, emoji: '✨' };
  };

  // Mood State - Initialized from currentUser or persistent storage
  const [currentMood, setCurrentMoodState] = useState(() => {
    const saved = savedUser?.currentMood || savedUser?.current_mood || savedUser?.mood;
    return resolveMoodOption(saved);
  });

  // Automatically keep currentMood synchronized whenever currentUser changes
  useEffect(() => {
    const userMood = currentUser?.currentMood || currentUser?.current_mood || currentUser?.mood;
    if (userMood) {
      setCurrentMoodState(resolveMoodOption(userMood));
    }
  }, [currentUser?.currentMood, currentUser?.current_mood, currentUser?.mood]);

  // Update Mood: Persists to PostgreSQL first, updates frontend state on confirmation, and rolls back on failure
  const updateUserMood = async (moodTarget) => {
    const moodObj = typeof moodTarget === 'string'
      ? resolveMoodOption(moodTarget)
      : (moodTarget || MOOD_OPTIONS[0]);

    // Send to backend API first to guarantee PostgreSQL persistence
    const updateMoodFn = api.users?.updateMood || api.profile?.updateMood;
    const res = await updateMoodFn(moodObj.label);
    if (!res || !res.success) {
      throw new Error(res?.message || 'Failed to save mood in PostgreSQL database');
    }

    const savedMoodLabel = res.data?.currentMood || res.data?.mood || moodObj.label;
    const finalMoodObj = resolveMoodOption(savedMoodLabel);

    // Update frontend state ONLY after database confirms success
    setCurrentMoodState(finalMoodObj);

    // Update currentUser state and persistent storage
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        currentMood: finalMoodObj.label,
        current_mood: finalMoodObj.label,
        mood: finalMoodObj.label,
        moodUpdatedAt: res.data?.moodUpdatedAt || new Date().toISOString(),
      };
      setStoredUser(updated);
      return updated;
    });

    return finalMoodObj;
  };

  // Admin Data
  const [adminMetrics, setAdminMetrics] = useState(ADMIN_METRICS);
  const [adminReports, setAdminReports] = useState(ADMIN_REPORTS);
  const [adminAuditLogs, setAdminAuditLogs] = useState(ADMIN_AUDIT_LOGS);

  // Notifications & Modals
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Helper Toast
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    setUnreadNotificationsCount(0);
    api.notifications.markAllRead().catch((err) => console.warn('Sync markAllNotificationsRead:', err.message));
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
    );
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    api.notifications.markRead(id).catch((err) => console.warn('Sync markNotificationRead:', err.message));
  };

  const deleteNotification = (id) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.read && !target.isRead) {
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    api.notifications.delete(id).catch((err) => console.warn('Sync deleteNotification:', err.message));
  };

  // Load live data from PostgreSQL Backend whenever student is authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    let isMounted = true;

    // 1. Fetch Discovery Profiles
    fetchDiscoveryProfiles();

    // 2. Fetch Incoming Likes / Requests
    api.matching.getIncoming()
      .then((res) => {
        if (!isMounted) return;
        const requests = res?.data?.incomingLikes || res?.data?.requests || [];
        const mapped = requests.map((r) => ({
          id: r.id,
          sender_id: r.senderId || r.user?.id,
          user: {
            id: r.user?.id || r.senderId,
            display_name: r.user?.displayName || r.user?.display_name || r.sender?.displayName || r.sender?.fullName,
            avatar_url: r.user?.avatarUrl || r.user?.avatar_url || r.sender?.photos?.[0]?.url || r.sender?.avatarUrl,
            college_name: r.user?.collegeName || r.user?.college_name || r.sender?.education?.collegeName || 'Campus',
            course: r.user?.course || r.sender?.education?.course || 'Student',
            age: r.user?.age || r.sender?.profile?.age || 21,
            gender: r.user?.gender || r.sender?.profile?.gender || 'Student',
            bio: r.user?.bio || r.sender?.profile?.bio || '',
            interests: r.user?.interests || r.sender?.profile?.interests || [],
            city: r.user?.city || r.sender?.profile?.city || '',
          },
          created_at: r.createdAt || r.likedAt,
        }));
        setIncomingLikes(mapped);
      })
      .catch((err) => console.warn('Could not load incoming likes:', err.message));

    // 2b. Fetch Sent (Outgoing) Requests
    api.matching.getSent()
      .then((res) => {
        if (!isMounted) return;
        const sent = res?.data?.sentRequests || res?.data?.requests || [];
        const mapped = sent.map((r) => ({
          id: r.id,
          receiver_id: r.receiverId || r.user?.id,
          status: r.status,
          user: {
            id: r.user?.id || r.receiverId,
            display_name: r.user?.displayName || r.user?.display_name || 'Campus Student',
            avatar_url: r.user?.avatarUrl || r.user?.avatar_url,
            additional_photos: r.user?.additionalPhotos || r.user?.additional_photos || [],
            college_name: r.user?.collegeName || r.user?.college_name || 'Campus',
            course: r.user?.course || 'Student',
            age: r.user?.age || 21,
            gender: r.user?.gender || 'Student',
            bio: r.user?.bio || '',
            interests: r.user?.interests || [],
            city: r.user?.city || '',
          },
          created_at: r.createdAt || r.sentAt,
        }));
        setSentRequests(mapped);
      })
      .catch((err) => console.warn('Could not load sent requests:', err.message));

    // 3. Fetch Matches
    api.matching.getMatches()
      .then((res) => {
        if (!isMounted) return;
        const matchesList = res?.data?.matches || [];
        const mapped = matchesList.map((m) => {
          const partner = m.user || (m.user1Id === currentUser.id ? m.user2 : m.user1);
          return {
            id: m.id,
            conversation_id: m.conversationId || m.id,
            user: {
              id: partner?.id,
              display_name: partner?.displayName || partner?.display_name || partner?.fullName || 'Campus Match',
              avatar_url: partner?.avatarUrl || partner?.avatar_url || partner?.photos?.[0]?.url,
              additional_photos: partner?.additionalPhotos || partner?.additional_photos || (partner?.photos?.slice(1) || []).map((p) => p.url),
              college_name: partner?.collegeName || partner?.college_name || partner?.education?.collegeName || 'Campus',
              course: partner?.course || partner?.education?.course || 'Student',
              bio: partner?.bio || partner?.profile?.bio || '',
              interests: partner?.interests || partner?.profile?.interests || [],
              mood: partner?.currentMood || partner?.mood || partner?.profile?.currentMood || 'Want to make friends',
              age: partner?.age || partner?.profile?.age || 21,
              gender: partner?.gender || partner?.profile?.gender || 'Student',
              city: partner?.city || partner?.profile?.city || '',
            },
            matched_at: m.matched_at || m.createdAt,
            status: m.status || 'active',
            stage: m.stage || 'Friend',
            unread_count: m.unread_count || 0,
            go_request: m.go_request || null,
            last_message: m.last_message || null,
          };
        });
        setMatches(mapped);

        // Restore active chat if user was in a chat previously
        const savedChatId = userPreferences.lastActiveChatId;
        if (savedChatId && mapped.length > 0) {
          const matchToRestore = mapped.find((m) => m.id === savedChatId || m.user?.id === savedChatId);
          if (matchToRestore) {
            setActiveChatMatch(matchToRestore);
          }
        }
      })
      .catch((err) => console.warn('Could not load matches:', err.message));

    // 4. Fetch Conversations
    api.chat.getConversations()
      .then((res) => {
        if (!isMounted) return;
        const convs = res?.data?.conversations || [];
        const convMap = {};
        convs.forEach((conv) => {
          const key = conv.matchId || conv.id;
          if (conv.messages && conv.messages.length > 0) {
            convMap[key] = conv.messages.map((msg) => ({
              id: msg.id,
              sender_id: msg.senderId,
              content: msg.content,
              message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : (msg.messageType === 'SYSTEM_PROMPT' ? 'system' : 'text'),
              duration_seconds: msg.voiceDuration,
              audio_url: msg.mediaUrl ? api.chat.getAudioUrl(conv.id, msg.id) : null,
              created_at: msg.createdAt,
              is_read: msg.isRead,
            }));
          }
        });
        setConversations(convMap);
      })
      .catch((err) => console.warn('Could not load conversations:', err.message));

    // 5. Fetch Notifications & Unread Count
    api.notifications.getAll()
      .then((res) => {
        if (!isMounted) return;
        const notifs = res?.data?.notifications || [];
        const mapped = notifs.map((n) => ({
          id: n.id,
          type: n.type || 'system',
          rawType: n.type || 'system',
          title: n.title,
          body: n.message || n.body || '',
          message: n.message || n.body || '',
          relatedEntityId: n.relatedEntityId,
          data: n.data,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          createdAt: n.createdAt,
          read: n.isRead ?? n.read ?? false,
          isRead: n.isRead ?? n.read ?? false,
          actor: n.actor,
        }));
        setNotifications(mapped);
        const unread = mapped.filter((n) => !n.read).length;
        setUnreadNotificationsCount(unread);
      })
      .catch((err) => console.warn('Could not load notifications:', err.message));

    api.notifications.getUnreadCount()
      .then((res) => {
        if (!isMounted) return;
        if (typeof res?.data?.unreadCount === 'number') {
          setUnreadNotificationsCount(res.data.unreadCount);
        }
      })
      .catch(() => {});

    // 6. Fetch Campus Board Announcements & Daily Allowance
    api.campus.getAnnouncements()
      .then((res) => {
        if (!isMounted) return;
        setAnnouncements(res?.data?.announcements || []);
        if (res?.data?.allowance) {
          setDailyAllowance(res.data.allowance);
        }
      })
      .catch((err) => console.warn('Could not load campus announcements:', err.message));

    api.campus.getBoard()
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          setBoardInfo(res.data);
          if (res.data.allowance) {
            setDailyAllowance(res.data.allowance);
          }
        }
      })
      .catch((err) => console.warn('Could not load campus board:', err.message));

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, currentUser?.id]);

  // Fetch active sessions
  const refreshSessions = () => {
    if (!isAuthenticated) return;
    api.auth.getSessions()
      .then((res) => {
        if (res?.data?.sessions) {
          setActiveSessions(res.data.sessions);
        }
      })
      .catch((err) => console.warn('Could not load sessions:', err.message));
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.auth.revokeSession(sessionId);
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      addToast('Device session revoked successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to revoke session', 'error');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api.auth.revokeOtherSessions();
      setActiveSessions((prev) => prev.filter((s) => s.isCurrentSession));
      addToast('All other device sessions have been revoked.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to revoke other sessions', 'error');
    }
  };

  // Automatically mark conversation read and refresh messages when activeChatMatch opens
  useEffect(() => {
    if (activeChatMatch?.id) {
      api.chat.markRead(activeChatMatch.id).catch(() => { });
      api.chat.getMessages(activeChatMatch.id)
        .then((res) => {
          if (res?.data?.messages && res.data.messages.length > 0) {
            setConversations((prev) => ({
              ...prev,
              [activeChatMatch.id]: res.data.messages.map((msg) => ({
                id: msg.id,
                sender_id: msg.senderId,
                content: msg.content,
                message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : (msg.messageType === 'SYSTEM_PROMPT' ? 'system' : 'text'),
                duration_seconds: msg.voiceDuration,
                audio_url: msg.mediaUrl ? api.chat.getAudioUrl(activeChatMatch.id, msg.id) : null,
                created_at: msg.createdAt,
                is_read: msg.isRead,
              })),
            }));
          }
        })
        .catch(() => { });
    }
  }, [activeChatMatch?.id]);

  // Multi-Device Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    const token = getStoredToken();
    if (!token) return;

    refreshSessions();

    // When accessed through Vite proxy or same-host deployment, use window.location.origin
    // to prevent CORS or port mismatch issues; fallback to localhost:5000 if needed.
    const socketUrl = (typeof window !== 'undefined' && window.location?.origin)
      ? window.location.origin
      : 'http://localhost:5000';

    const deviceId = localStorage.getItem('college_device_id') || `web_${Date.now()}`;
    localStorage.setItem('college_device_id', deviceId);

    const socket = io(socketUrl, {
      auth: {
        token,
        deviceId,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Re-sync any missed messages since device was offline
      const lastSync = localStorage.getItem('college_last_sync');
      api.chat.sync(lastSync)
        .then((res) => {
          if (res?.data?.messages && res.data.messages.length > 0) {
            setConversations((prev) => {
              const updated = { ...prev };
              res.data.messages.forEach((msg) => {
                const convId = msg.conversationId;
                const existing = updated[convId] || [];
                if (!existing.some((m) => m.id === msg.id)) {
                  updated[convId] = [
                    ...existing,
                    {
                      id: msg.id,
                      sender_id: msg.senderId,
                      content: msg.content,
                      message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : (msg.messageType === 'SYSTEM_PROMPT' ? 'system' : 'text'),
                      duration_seconds: msg.voiceDuration,
                      audio_url: msg.mediaUrl ? api.chat.getAudioUrl(convId, msg.id) : null,
                      created_at: msg.createdAt,
                      is_read: msg.isRead,
                    },
                  ];
                }
              });
              return updated;
            });
          }
          localStorage.setItem('college_last_sync', new Date().toISOString());
        })
        .catch(() => { });
    });

    // Handle new incoming messages (text and voice notes)
    socket.on('new_message', (msg) => {
      const convId = msg.conversationId;
      setConversations((prev) => {
        const existing = prev[convId] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [convId]: [
            ...existing,
            {
              id: msg.id,
              sender_id: msg.senderId,
              content: msg.content,
              message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : (msg.messageType === 'SYSTEM_PROMPT' ? 'system' : 'text'),
              duration_seconds: msg.voiceDuration,
              audio_url: msg.mediaUrl ? api.chat.getAudioUrl(convId, msg.id) : null,
              created_at: msg.createdAt,
              is_read: msg.isRead,
            },
          ],
        };
      });

      // Update match's last message & unread badge
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id === convId || m.conversation_id === convId) {
            const isCurrentlyInRoom = activeChatMatch && (activeChatMatch.id === m.id || activeChatMatch.id === convId);
            return {
              ...m,
              last_message: {
                content: msg.content,
                created_at: msg.createdAt,
                sender_id: msg.senderId,
                message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : 'text',
              },
              unread_count: isCurrentlyInRoom ? 0 : (m.unread_count || 0) + 1,
            };
          }
          return m;
        })
      );

      if (activeChatMatch && (activeChatMatch.id === convId || activeChatMatch.id === msg.conversationId)) {
        api.chat.markRead(convId).catch(() => { });
      }
    });

    // Handle message synchronization across sender's active devices
    socket.on('message_sync', (msg) => {
      const convId = msg.conversationId;
      setConversations((prev) => {
        const existing = prev[convId] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [convId]: [
            ...existing,
            {
              id: msg.id,
              sender_id: msg.senderId,
              content: msg.content,
              message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : (msg.messageType === 'SYSTEM_PROMPT' ? 'system' : 'text'),
              duration_seconds: msg.voiceDuration,
              audio_url: msg.mediaUrl ? api.chat.getAudioUrl(convId, msg.id) : null,
              created_at: msg.createdAt,
              is_read: msg.isRead,
            },
          ],
        };
      });

      setMatches((prev) =>
        prev.map((m) => {
          if (m.id === convId || m.conversation_id === convId) {
            return {
              ...m,
              last_message: {
                content: msg.content,
                created_at: msg.createdAt,
                sender_id: msg.senderId,
                message_type: msg.messageType === 'VOICE_NOTE' ? 'voice' : 'text',
              },
            };
          }
          return m;
        })
      );
    });

    // Handle real-time read receipts across all devices
    socket.on('messages_read', (data) => {
      const convId = data.conversationId;
      setConversations((prev) => {
        const list = prev[convId];
        if (!list) return prev;
        return {
          ...prev,
          [convId]: list.map((m) => ({ ...m, is_read: true })),
        };
      });

      setMatches((prev) =>
        prev.map((m) => {
          if (m.id === convId || m.conversation_id === convId) {
            return { ...m, unread_count: 0 };
          }
          return m;
        })
      );
    });

    // Handle block events across all active devices
    socket.on('conversation_blocked', (data) => {
      addToast('A match or conversation has been blocked and removed.', 'info');
      setMatches((prev) => prev.filter((m) => m.id !== data.conversationId && m.conversation_id !== data.conversationId));
      if (activeChatMatch && (activeChatMatch.id === data.conversationId || activeChatMatch.conversation_id === data.conversationId)) {
        setActiveChatMatch(null);
        setCurrentView('matches');
      }
    });

    // Handle real-time mood update broadcast across all online students
    socket.on('mood_updated', (data) => {
      if (!data?.userId || !data?.mood) return;

      // 0. Update own profile if modified in another tab or device
      if (currentUser?.id === data.userId) {
        setCurrentMoodState(resolveMoodOption(data.mood));
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, mood: data.mood, currentMood: data.mood, current_mood: data.mood };
          setStoredUser(updated);
          return updated;
        });
      }

      // 1. Update Discover profiles feed in real time
      setProfiles((prev) =>
        prev.map((p) => (p.id === data.userId ? { ...p, mood: data.mood, currentMood: data.mood } : p))
      );

      // 2. Update Incoming Likes in real time
      setIncomingLikes((prev) =>
        prev.map((i) =>
          (i.user?.id === data.userId || i.sender_id === data.userId)
            ? { ...i, user: { ...i.user, mood: data.mood, currentMood: data.mood } }
            : i
        )
      );

      // 3. Update Mutual Friends & Matches in real time
      setMatches((prev) =>
        prev.map((m) =>
          m.user.id === data.userId
            ? { ...m, user: { ...m.user, mood: data.mood, currentMood: data.mood } }
            : m
        )
      );

      // 4. Update Active Chat partner header in real time
      setActiveChatMatch((prev) => {
        if (prev?.user?.id === data.userId) {
          return {
            ...prev,
            user: { ...prev.user, mood: data.mood, currentMood: data.mood },
          };
        }
        return prev;
      });
    });

    // Handle real-time incoming notifications
    socket.on('new_notification', (notif) => {
      const formatted = {
        id: notif.id,
        type: notif.type || 'system',
        rawType: notif.type || 'system',
        title: notif.title,
        body: notif.message || notif.body || '',
        message: notif.message || notif.body || '',
        relatedEntityId: notif.relatedEntityId,
        data: notif.data,
        time: notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        createdAt: notif.createdAt || new Date().toISOString(),
        read: false,
        isRead: false,
        actor: notif.actor,
      };
      setNotifications((prev) => [formatted, ...prev.filter((n) => n.id !== notif.id)]);
      setUnreadNotificationsCount((prev) => prev + 1);
      playNotificationSound('notification');
      if (notif.title) {
        addToast(notif.title, 'info');
      }
    });

    // Handle real-time unread notification count synchronization
    socket.on('unread_notification_count', (payload) => {
      const count = typeof payload?.count === 'number' ? payload.count : payload?.unreadCount;
      if (typeof count === 'number') {
        setUnreadNotificationsCount(count);
      }
    });

    // Campus Board Real-Time Sync
    socket.on('new_campus_post', (post) => {
      setAnnouncements((prev) => [post, ...(prev || []).filter((p) => p.id !== post.id)]);
    });

    socket.on('post_like_updated', (data) => {
      setAnnouncements((prev) =>
        (prev || []).map((p) => {
          if (p.id === data.postId) {
            const isSelf = data.userId === currentUser?.id;
            return {
              ...p,
              upvotes: data.likesCount,
              likesCount: data.likesCount,
              likes_count: data.likesCount,
              ...(isSelf ? { isLiked: data.isLiked, is_liked: data.isLiked } : {}),
            };
          }
          return p;
        })
      );
    });

    socket.on('new_post_comment', (data) => {
      setAnnouncements((prev) =>
        (prev || []).map((p) => {
          if (p.id === data.postId) {
            const currentComments = p.comments || [];
            const exists = currentComments.some((c) => c.id === data.comment?.id);
            const nextComments = exists ? currentComments : [...currentComments, data.comment];
            return {
              ...p,
              comments: nextComments,
              commentsCount: (p.commentsCount || 0) + (exists ? 0 : 1),
              comments_count: (p.comments_count || 0) + (exists ? 0 : 1),
            };
          }
          return p;
        })
      );
    });

    socket.on('new_campus_event', (event) => {
      setCampusEvents((prev) => [event, ...(prev || []).filter((e) => e.id !== event.id)]);
    });

    // Handle session revoked
    socket.on('session_revoked', () => {
      addToast('This device session was revoked.', 'error');
      handleLogout();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, currentUser?.id, activeChatMatch]);

  // Current Plan Limits Helper
  const currentPlanConfig = SUBSCRIPTION_PLANS[currentUser?.subscription_plan] || SUBSCRIPTION_PLANS.free;

  // ACCEPT / REJECT INCOMING LIKE (PRD Update)
  const handleAcceptLike = (likeItem) => {
    // Check match limit based on subscription plan
    if (matches.length >= currentPlanConfig.max_mutual_matches) {
      addToast(
        `Mutual match limit reached (${currentPlanConfig.max_mutual_matches} max on ${currentPlanConfig.name}). Upgrade to accept more!`,
        'warning'
      );
      setIsPremiumModalOpen(true);
      return;
    }

    // Call backend API (if likeItem is from backend, likeItem.id is the MatchRequest id)
    api.matching.acceptRequest(likeItem.id).catch((err) => console.warn('Accept API sync:', err.message));

    // Create mutual friend connection
    const newMatchId = likeItem.id || ('match_' + Date.now());
    const newMutualFriend = {
      id: newMatchId,
      user: likeItem.user,
      matched_at: new Date().toISOString(),
      status: 'active',
      stage: 'Friend', // Starts as Friend (talking)
      unread_count: 0,
      go_request: null,
      last_message: null
    };

    setMatches((prev) => [newMutualFriend, ...prev]);
    setIncomingLikes((prev) => prev.filter((item) => item.id !== likeItem.id));

    // Show celebratory match modal
    setMatchedCelebrationUser(likeItem.user);

    // Create initial conversation thread
    setConversations((prev) => ({
      ...prev,
      [newMatchId]: [
        {
          id: 'sys_' + Date.now(),
          sender_id: 'system',
          message_type: 'system',
          content: `You accepted ${likeItem.user.display_name}. You are now Mutual Friends! You can now start talking, send voice notes, and play conversation games.`,
          created_at: new Date().toISOString()
        }
      ]
    }));

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) { }

    addToast(`Accepted! You and ${likeItem.user.display_name} are now Mutual Friends. Chat unlocked! 💬`, 'success');
  };

  const handleRejectLike = (likeId) => {
    api.matching.rejectRequest(likeId).catch((err) => console.warn('Reject API sync:', err.message));
    setIncomingLikes((prev) => prev.filter((item) => item.id !== likeId));
    addToast('Match request declined.', 'info');
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.matching.cancelRequest(requestId);
      setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
      setCurrentUser((prev) => ({
        ...prev,
        sent_requests_count: Math.max(0, (prev?.sent_requests_count || 1) - 1),
      }));
      addToast('Match request cancelled.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to cancel request.', 'error');
    }
  };

  const handleUnmatch = async (matchId) => {
    try {
      await api.matching.unmatch(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      if (activeChatMatch?.id === matchId) {
        setActiveChatMatch(null);
      }
      addToast('Unmatched successfully.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to unmatch.', 'error');
    }
  };

  const refreshMatchingData = async () => {
    try {
      setIsMatchingLoading(true);
      const [incRes, sentRes, matchRes] = await Promise.allSettled([
        api.matching.getIncoming(),
        api.matching.getSent(),
        api.matching.getMatches(),
      ]);

      if (incRes.status === 'fulfilled') {
        const requests = incRes.value?.data?.incomingLikes || incRes.value?.data?.requests || [];
        setIncomingLikes(requests.map((r) => ({
          id: r.id,
          sender_id: r.senderId || r.user?.id,
          user: {
            id: r.user?.id || r.senderId,
            display_name: r.user?.displayName || r.user?.display_name || 'Campus Student',
            avatar_url: r.user?.avatarUrl || r.user?.avatar_url,
            additional_photos: r.user?.additionalPhotos || r.user?.additional_photos || [],
            college_name: r.user?.collegeName || r.user?.college_name || 'Campus',
            course: r.user?.course || 'Student',
            age: r.user?.age || 21,
            gender: r.user?.gender || 'Student',
            bio: r.user?.bio || '',
            interests: r.user?.interests || [],
            city: r.user?.city || '',
          },
          created_at: r.createdAt || r.likedAt,
        })));
      }

      if (sentRes.status === 'fulfilled') {
        const sent = sentRes.value?.data?.sentRequests || sentRes.value?.data?.requests || [];
        setSentRequests(sent.map((r) => ({
          id: r.id,
          receiver_id: r.receiverId || r.user?.id,
          status: r.status,
          user: {
            id: r.user?.id || r.receiverId,
            display_name: r.user?.displayName || r.user?.display_name || 'Campus Student',
            avatar_url: r.user?.avatarUrl || r.user?.avatar_url,
            additional_photos: r.user?.additionalPhotos || r.user?.additional_photos || [],
            college_name: r.user?.collegeName || r.user?.college_name || 'Campus',
            course: r.user?.course || 'Student',
            age: r.user?.age || 21,
            gender: r.user?.gender || 'Student',
            bio: r.user?.bio || '',
            interests: r.user?.interests || [],
            city: r.user?.city || '',
          },
          created_at: r.createdAt || r.sentAt,
        })));
      }

      if (matchRes.status === 'fulfilled') {
        const matchesList = matchRes.value?.data?.matches || [];
        setMatches(matchesList.map((m) => {
          const partner = m.user || (m.user1Id === currentUser?.id ? m.user2 : m.user1);
          return {
            id: m.id,
            conversation_id: m.conversationId || m.id,
            user: {
              id: partner?.id,
              display_name: partner?.displayName || partner?.display_name || partner?.fullName || 'Campus Match',
              avatar_url: partner?.avatarUrl || partner?.avatar_url || partner?.photos?.[0]?.url,
              additional_photos: partner?.additionalPhotos || partner?.additional_photos || (partner?.photos?.slice(1) || []).map((p) => p.url),
              college_name: partner?.collegeName || partner?.college_name || partner?.education?.collegeName || 'Campus',
              course: partner?.course || partner?.education?.course || 'Student',
              bio: partner?.bio || partner?.profile?.bio || '',
              interests: partner?.interests || partner?.profile?.interests || [],
              mood: partner?.currentMood || partner?.mood || 'Want to make friends',
              age: partner?.age || 21,
              gender: partner?.gender || 'Student',
              city: partner?.city || '',
            },
            matched_at: m.matched_at || m.createdAt,
            status: m.status || 'active',
            stage: m.stage || 'Friend',
            unread_count: m.unread_count || 0,
            go_request: m.go_request || null,
            last_message: m.last_message || null,
          };
        }));
      }
    } catch (e) {
      console.warn('Error refreshing matching data:', e.message);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  // SEND MATCH REQUEST (In Discover feed)
  const handleSendMatchRequest = (profile) => {
    // Check sent requests limit
    if ((currentUser?.sent_requests_count || 0) >= currentPlanConfig.max_sent_requests) {
      addToast(
        `Sent request limit reached (${currentPlanConfig.max_sent_requests} on ${currentPlanConfig.name}). Upgrade to Campus Pro!`,
        'warning'
      );
      setIsPremiumModalOpen(true);
      return;
    }

    api.matching.sendRequest(profile.id).catch((err) => console.warn('Send request API sync:', err.message));

    setLikedProfiles((prev) => {
      const next = [...prev, profile.id];
      try { localStorage.setItem('college_liked_profiles', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setSentRequests((prev) => [
      {
        id: 'sent_' + Date.now(),
        receiver_id: profile.id,
        status: 'PENDING',
        user: profile,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setCurrentUser((prev) => ({
      ...prev,
      sent_requests_count: (prev?.sent_requests_count || 0) + 1
    }));

    addToast(`Match request sent to ${profile.display_name}! (Used ${(currentUser?.sent_requests_count || 0) + 1}/${currentPlanConfig.max_sent_requests})`, 'info');
  };

  const handlePass = (profile) => {
    if (profile?.id) {
      api.discovery.pass(profile.id).catch((err) => console.warn('Pass sync error:', err.message));
    }
    setPassedProfiles((prev) => {
      const next = [...prev, profile.id];
      try { localStorage.setItem('college_passed_profiles', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  // "GO BUTTON" STAGE TRANSITION (Friend -> Dating -> Relationship)
  const handleSendGoRequest = (matchId, targetStage = 'Dating', senderId = currentUser.id) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const goMsgId = 'go_req_' + Date.now();
    const isFromMe = senderId === currentUser.id;

    // Set pending go request
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
            ...m,
            go_request: {
              id: goMsgId,
              from: senderId,
              targetStage,
              status: 'pending',
              requested_at: new Date().toISOString()
            }
          }
          : m
      )
    );

    // Append GO request message to conversation thread so it appears directly in chat
    const newGoMessage = {
      id: goMsgId,
      sender_id: senderId,
      message_type: 'go_request',
      target_stage: targetStage,
      go_status: 'pending',
      content: isFromMe
        ? `🚀 Sent a GO request to transition from Friendship to ${targetStage} stage!`
        : `🚀 ${match.user.display_name} sent a GO request to transition from Friendship to ${targetStage} stage!`,
      created_at: new Date().toISOString()
    };

    setConversations((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newGoMessage]
    }));

    if (isFromMe) {
      addToast(`"GO" invitation sent to ${match.user.display_name} to advance to ${targetStage} stage!`, 'info');
    }
  };

  // Handle responding to an incoming Go request with accept or refuse (with explanation sent via chat)
  const handleRespondToGoRequest = (matchId, choice, explanation = '') => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const nextStage = match.go_request?.targetStage || 'Dating';

    if (choice === 'accept') {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, stage: nextStage, go_request: null }
            : m
        )
      );

      // Add celebratory celebration system message to chat
      const celebrationMsg = {
        id: 'msg_' + Date.now(),
        sender_id: 'system',
        message_type: 'system',
        content: `🎉 Mutual agreement! You and ${match.user.display_name} accepted the GO request and are now officially in the ${nextStage} Stage! ❤️`,
        created_at: new Date().toISOString()
      };

      // Also update the go_request message status in conversations
      setConversations((prev) => ({
        ...prev,
        [matchId]: (prev[matchId] || []).map((msg) =>
          msg.message_type === 'go_request' && msg.go_status === 'pending'
            ? { ...msg, go_status: 'accepted' }
            : msg
        ).concat(celebrationMsg)
      }));

      try {
        confetti({ particleCount: 90, spread: 70 });
      } catch (e) { }
      addToast(`Accepted! You and ${match.user.display_name} are now in the ${nextStage} stage! ❤️`, 'success');
    } else if (choice === 'refuse' || choice === 'reject' || choice === 'we_are_good_as_a_friend') {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, stage: 'Friend', go_request: null } : m))
      );

      // When refused, send the explanation directly as a chat message per requirement!
      const finalExplanation = explanation.trim() || 'I really value our friendship and want to take things slower for now.';
      const explanationMsg = {
        id: 'msg_' + Date.now(),
        sender_id: currentUser.id,
        message_type: 'text',
        content: `I appreciate you asking, but I'd prefer to stay friends for now 😊\nReason: "${finalExplanation}"`,
        created_at: new Date().toISOString()
      };

      setConversations((prev) => ({
        ...prev,
        [matchId]: (prev[matchId] || []).map((msg) =>
          msg.message_type === 'go_request' && msg.go_status === 'pending'
            ? { ...msg, go_status: 'refused', refusal_reason: finalExplanation }
            : msg
        ).concat(explanationMsg)
      }));

      addToast(`Explanation sent in chat. Staying as mutual friends! 🤝`, 'info');
    }
  };

  // CAMPUS BOARD: Announcement publishing (College-exclusive & Daily Limit)
  const refreshCampusBoard = async () => {
    try {
      const [annRes, boardRes] = await Promise.all([
        api.campus.getAnnouncements(),
        api.campus.getBoard(),
      ]);
      if (annRes?.data?.announcements) {
        setAnnouncements(annRes.data.announcements);
      }
      if (boardRes?.data) {
        setBoardInfo(boardRes.data);
        if (boardRes.data.allowance) {
          setDailyAllowance(boardRes.data.allowance);
        }
      }
    } catch (err) {
      console.warn('Refresh campus board error:', err.message);
    }
  };

  const handleCreateAnnouncement = async (annData, imageFile = null) => {
    let payload;
    if (imageFile) {
      const formData = new FormData();
      formData.append('title', annData.title);
      formData.append('content', annData.content);
      formData.append('category', annData.category || 'General');
      if (annData.postType) formData.append('postType', annData.postType);
      if (annData.isUrgent) formData.append('isUrgent', 'true');
      formData.append('image', imageFile);
      payload = formData;
    } else {
      payload = {
        title: annData.title,
        content: annData.content,
        category: annData.category || 'General',
        postType: annData.postType || 'POST',
        isUrgent: Boolean(annData.isUrgent),
        imageUrl: annData.imageUrl || undefined,
      };
    }

    try {
      const res = await api.campus.createAnnouncement(payload);
      const newPost = res?.data?.post || res?.data?.announcement;
      if (newPost) {
        setAnnouncements((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
      }
      if (res?.data?.allowance) {
        setDailyAllowance(res.data.allowance);
      }
      addToast(res?.message || `Post broadcast to ${currentUser?.college_name || 'your college'} Campus Board! 📢`, 'success');
      return res;
    } catch (err) {
      console.warn('Create announcement API error:', err.message);
      if (err.status === 429) {
        addToast('You have reached your daily announcement limit. You can post again tomorrow.', 'error');
      } else {
        addToast(err.message || 'Could not post announcement', 'error');
      }
      throw err;
    }
  };

  const handleUpdateAnnouncement = async (id, updateData) => {
    try {
      const res = await api.campus.updateAnnouncement(id, updateData);
      const updated = res?.data?.post || res?.data?.announcement;
      if (updated) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
        );
      }
      addToast('Post updated successfully.', 'success');
      return res;
    } catch (err) {
      console.warn('Update announcement API error:', err.message);
      addToast(err.message || 'Could not update post', 'error');
      throw err;
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await api.campus.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      if (res?.data?.allowance) {
        setDailyAllowance(res.data.allowance);
      }
      addToast('Post deleted from Campus Board.', 'info');
      return res;
    } catch (err) {
      console.warn('Delete announcement API error:', err.message);
      addToast(err.message || 'Could not delete post', 'error');
      throw err;
    }
  };

  const handleToggleLikePost = async (postId) => {
    // Optimistic toggle
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === postId) {
          const nextIsLiked = !a.isLiked;
          const delta = nextIsLiked ? 1 : -1;
          const nextCount = Math.max(0, (a.likesCount ?? a.upvotes ?? 0) + delta);
          return {
            ...a,
            isLiked: nextIsLiked,
            is_liked: nextIsLiked,
            upvotes: nextCount,
            likesCount: nextCount,
            likes_count: nextCount,
          };
        }
        return a;
      })
    );

    try {
      const res = await api.campus.likePost(postId);
      if (res?.data) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === postId
              ? {
                  ...a,
                  isLiked: res.data.isLiked,
                  is_liked: res.data.isLiked,
                  upvotes: res.data.likesCount,
                  likesCount: res.data.likesCount,
                  likes_count: res.data.likesCount,
                }
              : a
          )
        );
      }
      return res;
    } catch (err) {
      console.warn('Like post error:', err.message);
      addToast(err.message || 'Could not like post', 'error');
    }
  };

  const handleToggleSavePost = async (postId) => {
    try {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === postId ? { ...a, isSaved: !a.isSaved, is_saved: !a.isSaved } : a))
      );
      const res = await api.campus.toggleSavePost(postId);
      if (res?.data) {
        addToast(res.data.isSaved ? 'Post saved to bookmarks! 🔖' : 'Removed from bookmarks.', 'info');
      }
      return res;
    } catch (err) {
      console.warn('Toggle save post error:', err.message);
      addToast(err.message || 'Could not save post', 'error');
    }
  };

  const handleUpvoteAnnouncement = async (annId) => {
    return handleToggleLikePost(annId);
  };

  // SUBSCRIPTION UPGRADE (Free -> Pro 49 -> Unlimited 99 per 28 days)
  const handleUpgradePlan = (planId) => {
    setCurrentUser((prev) => ({
      ...prev,
      subscription_plan: planId,
      plan_expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
    }));

    try {
      confetti({ particleCount: 100, spread: 80 });
    } catch (e) { }

    const plan = SUBSCRIPTION_PLANS[planId];
    addToast(`Successfully upgraded to ${plan.name} (₹${plan.price} / 28 days)! 👑`, 'success');
    setIsPremiumModalOpen(false);
  };

  // Block & Report
  const handleBlockUser = (userId, userName) => {
    api.matching.blockUser(userId, 'Blocked by user').catch((err) => console.warn('Block user API sync:', err.message));
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setMatches((prev) => prev.filter((m) => m.user.id !== userId));
    setIncomingLikes((prev) => prev.filter((i) => i.user.id !== userId));
    addToast(`${userName || 'User'} blocked. Conversation permanently removed.`, 'warning');
    setBlockTarget(null);
    if (activeChatMatch && activeChatMatch.user.id === userId) {
      setActiveChatMatch(null);
      setCurrentView('matches');
    }
  };

  const handleReportUser = (reportedUser, category, description) => {
    if (reportedUser?.id) {
      api.reports.submit({
        reportedUserId: reportedUser.id,
        category: category || 'Other',
        reason: description || 'In-app user report',
      }).catch((err) => console.warn('Submit report API sync:', err.message));
    }

    const newReport = {
      id: 'rep_' + Date.now(),
      reporter: `${currentUser?.id || 'User'} (${currentUser?.display_name || 'Student'})`,
      reported_user: `${reportedUser.id} (${reportedUser.display_name || reportedUser.full_name || 'User'})`,
      category,
      description,
      evidence: 'Submitted via in-app report workflow.',
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    setAdminReports((prev) => [newReport, ...prev]);
    setReportTarget(null);
    addToast('Report submitted to campus moderation team.', 'success');
  };

  const handleUnblockUser = async (userId) => {
    try {
      await api.matching.unblock(userId);
      addToast('User unblocked successfully.', 'success');
    } catch (err) {
      console.warn('Unblock user API sync:', err.message);
      addToast(err.message || 'Could not unblock user', 'error');
    }
  };

  // Messaging (Only allowed if mutual friends!)
  const sendMessage = (matchId, messagePayload) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      addToast('Cannot send message: You can only message mutual friends after accepting.', 'error');
      return;
    }

    const newMessage = {
      id: 'msg_' + Date.now(),
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      reactions: [],
      ...messagePayload
    };

    setConversations((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMessage]
    }));

    const idempotencyKey = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    // Synchronize to PostgreSQL Backend via API with idempotencyKey
    if (messagePayload.message_type === 'voice' && messagePayload.audio_blob) {
      api.chat.sendVoiceMessage(matchId, messagePayload.audio_blob, messagePayload.duration_seconds, idempotencyKey)
        .then((res) => {
          if (res?.data?.message?.id) {
            setConversations((prev) => ({
              ...prev,
              [matchId]: (prev[matchId] || []).map((m) =>
                m.id === newMessage.id
                  ? { ...m, id: res.data.message.id, audio_url: api.chat.getAudioUrl(matchId, res.data.message.id) }
                  : m
              ),
            }));
          }
        })
        .catch((err) => console.warn('Send voice message API sync:', err.message));
    } else if (messagePayload.content) {
      api.chat.sendMessage(matchId, messagePayload.content, 'TEXT', idempotencyKey)
        .then((res) => {
          if (res?.data?.message?.id) {
            setConversations((prev) => ({
              ...prev,
              [matchId]: (prev[matchId] || []).map((m) =>
                m.id === newMessage.id ? { ...m, id: res.data.message.id } : m
              ),
            }));
          }
        })
        .catch((err) => console.warn('Send text message API sync:', err.message));
    }

    // Update match last message
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            last_message: {
              content:
                messagePayload.message_type === 'voice'
                  ? `Audio Note (${messagePayload.duration_seconds || 15}s)`
                  : messagePayload.content,
              created_at: newMessage.created_at,
              sender_id: currentUser.id,
              message_type: messagePayload.message_type
            }
          };
        }
        return m;
      })
    );
  };

  const handleAddReaction = (matchId, messageId, reactionEmoji) => {
    setConversations((prev) => {
      const thread = prev[matchId] || [];
      const updated = thread.map((msg) => {
        if (msg.id === messageId) {
          const newReactions = [...(msg.reactions || [])];
          newReactions.push({ user_id: currentUser.id, reaction: reactionEmoji });
          return { ...msg, reactions: newReactions };
        }
        return msg;
      });
      return { ...prev, [matchId]: updated };
    });
  };

  const handleDeleteMessage = (matchId, messageId) => {
    setConversations((prev) => {
      const thread = prev[matchId] || [];
      return { ...prev, [matchId]: thread.filter((msg) => msg.id !== messageId) };
    });
    addToast('Message deleted', 'info');
  };

  // --- COMPLETE MANUAL VERIFICATION & 72-HOUR LIFECYCLE ---

  // 1. Log In using Gmail/Email OR Mobile + Password (strictly verified against database)
  const loginWithCredentials = async (identifier, password) => {
    try {
      const cleanIdentifier = String(identifier || '').trim();
      const res = await api.auth.login(cleanIdentifier, password);
      if (res && res.success && res.data) {
        const { user } = res.data;
        const token = res.data.token || res.data.accessToken;
        if (token) setStoredToken(token);
        if (user) {
          setCurrentUser(user);
          setStoredUser(user);
        }
        setIsAuthenticated(true);
        // Restore last visited view if the user had one saved, otherwise default to matches
        const savedView = userPreferences.lastVisitedSection;
        const validViews = ['matches', 'discover', 'campus-board', 'profile', 'relationship', 'games', 'settings', 'chats', 'edit-profile'];
        const targetView = validViews.includes(savedView) ? savedView : 'matches';
        setCurrentView(targetView);
        addToast(`Welcome back, ${user.displayName || user.fullName || user.display_name}! ✨`, 'success');
        return { success: true, user };
      }
      return {
        success: false,
        message: res?.message || 'Login failed. Please check your credentials.'
      };
    } catch (err) {
      // If backend reports an application in review or requiring correction or rejected
      if (err.code === 'ACCOUNT_NOT_ACTIVE' && err.details) {
        return {
          success: false,
          status: err.details.status,
          student: {
            id: err.details.applicationId,
            application_id: err.details.applicationId,
            status: err.details.status,
            submitted_at: err.details.submittedAt,
            review_deadline: err.details.reviewDeadline,
            isOverdue: err.details.isOverdue,
            correction_fields: err.details.correctionFields || [],
            correction_message: err.details.correctionMessage || null,
            rejection_reason: err.details.rejectionReason || null,
            email: identifier
          },
          reason: err.details.rejectionReason || err.details.correctionMessage,
          fields: err.details.correctionFields || [],
          message: err.message
        };
      }

      if (err.code === 'SERVER_OFFLINE') {
        return {
          success: false,
          message: 'Unable to connect to authentication service. Please try again.'
        };
      }

      return {
        success: false,
        message: err.message || 'Invalid credentials. Email or password does not match.'
      };
    }
  };

  // 2. Register New Student Application (Database Persistence)
  const registerStudent = async (studentData) => {
    try {
      const res = await api.registration.submit(studentData);
      if (res && res.success && res.data) {
        const app = res.data;
        setPendingVerifications((prev) => [app, ...prev]);
        setAdminMetrics((prev) => ({
          ...prev,
          pending_verifications: prev.pending_verifications + 1
        }));
        return {
          success: true,
          status: app.status || 'PENDING_REVIEW',
          student: app,
          applicationId: app.application_id || app.applicationId,
          message: 'Your Collage Story application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.'
        };
      }
      return {
        success: false,
        message: res?.message || 'Registration failed.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Registration failed.'
      };
    }
  };

  // 3. Resubmit Corrected Details when in NEEDS_CORRECTION
  const resubmitVerification = async (appId, updatedData) => {
    try {
      const res = await api.registration.resubmit(appId, updatedData);
      setPendingVerifications((prev) =>
        prev.map((app) => {
          if (app.id === appId || app.application_id === appId) {
            return {
              ...app,
              ...updatedData,
              status: 'RESUBMITTED',
              correction_fields: [],
              correction_message: null,
            };
          }
          return app;
        })
      );
      addToast('Corrected application resubmitted! Our team will continue verification.', 'info');
      return { success: true, data: res?.data };
    } catch (err) {
      addToast(err.message || 'Failed to resubmit application.', 'error');
      return { success: false, message: err.message };
    }
  };

  // 4. Admin Action: Claim / Mark Under Review
  const startApplicationReview = async (appId, adminName = 'Admin') => {
    try {
      await api.admin.claim(appId);
    } catch (err) {
      console.warn('Backend claim sync:', err.message);
    }

    setPendingVerifications((prev) =>
      prev.map((a) =>
        (a.id === appId || a.application_id === appId)
          ? { ...a, status: 'UNDER_REVIEW', assigned_admin: adminName }
          : a
      )
    );
    addToast(`Application claimed and marked UNDER_REVIEW by ${adminName}.`, 'info');
  };

  // 5. Admin Action: Request Correction
  const requestCorrectionOnApplication = async (appId, fields, message) => {
    try {
      await api.admin.requestCorrection(appId, fields, message);
    } catch (err) {
      console.warn('Backend correction request sync:', err.message);
    }

    setPendingVerifications((prev) =>
      prev.map((a) =>
        (a.id === appId || a.application_id === appId)
          ? {
            ...a,
            status: 'NEEDS_CORRECTION',
            correction_fields: fields,
            correction_message: message
          }
          : a
      )
    );

    const newLog = {
      id: 'log_' + Date.now(),
      admin: `Admin (${currentUser?.display_name || 'Admin'})`,
      action: `REQUESTED_CORRECTION on Application ${appId}`,
      reason: message,
      timestamp: new Date().toISOString()
    };
    setAdminAuditLogs((prev) => [newLog, ...prev]);

    addToast(`Correction request sent for fields: ${fields.join(', ')}`, 'warning');
  };

  // 6. Admin Action: Approve Application -> Transactional Active User Creation
  const approveStudentVerification = async (appId) => {
    try {
      await api.admin.approve(appId, 'Approved via Admin verification checklist');
    } catch (err) {
      console.warn('Backend approve sync:', err.message);
    }

    const student = pendingVerifications.find((v) => v.id === appId || v.application_id === appId);
    if (!student) return;

    setPendingVerifications((prev) =>
      prev.map((v) =>
        (v.id === appId || v.application_id === appId)
          ? { ...v, status: 'APPROVED', rejection_reason: null }
          : v
      )
    );

    // Admin audit log
    const newLog = {
      id: 'log_' + Date.now(),
      admin: `SuperAdmin (${currentUser?.display_name || 'Admin'})`,
      action: `APPROVED Application ${student.application_id || student.id} for ${student.legal_name || student.full_name}`,
      reason: '18+ age, college enrollment, identity document, and all 3 photographs manually verified.',
      timestamp: new Date().toISOString()
    };
    setAdminAuditLogs((prev) => [newLog, ...prev]);
    setAdminMetrics((prev) => ({
      ...prev,
      pending_verifications: Math.max(0, prev.pending_verifications - 1),
      total_users: prev.total_users + 1
    }));

    addToast(`Approved ${student.display_name}! Active account created. 🎓`, 'success');
  };

  // 7. Admin Action: Reject Application
  const rejectStudentVerification = async (appId, reason) => {
    try {
      await api.admin.reject(appId, reason);
    } catch (err) {
      console.warn('Backend reject sync:', err.message);
    }

    const student = pendingVerifications.find((v) => v.id === appId || v.application_id === appId);
    if (!student) return;

    setPendingVerifications((prev) =>
      prev.map((v) =>
        (v.id === appId || v.application_id === appId)
          ? { ...v, status: 'REJECTED', rejection_reason: reason }
          : v
      )
    );

    const newLog = {
      id: 'log_' + Date.now(),
      admin: `SuperAdmin (${currentUser?.display_name || 'Admin'})`,
      action: `REJECTED Application ${student.application_id || student.id} for ${student.legal_name || student.full_name}`,
      reason: reason || 'Application does not meet platform safety or document guidelines.',
      timestamp: new Date().toISOString()
    };
    setAdminAuditLogs((prev) => [newLog, ...prev]);
    setAdminMetrics((prev) => ({
      ...prev,
      pending_verifications: Math.max(0, prev.pending_verifications - 1)
    }));

    addToast(`Application ${student.application_id || student.id} rejected. Reason: "${reason}"`, 'warning');
  };

  // 8. Sign Out
  const logout = () => {
    api.auth.logout();
    clearStoredToken();
    setStoredUser(null);
    try {
      localStorage.removeItem('college_access_token');
      localStorage.removeItem('college_has_session');
      localStorage.removeItem('college_user');
      localStorage.removeItem('college_user_prefs');
      localStorage.removeItem('college_liked_profiles');
      localStorage.removeItem('college_passed_profiles');
      localStorage.removeItem('college_last_sync');
    } catch (e) {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    setProfiles([]);
    setIncomingLikes([]);
    setMatches([]);
    setConversations({});
    setAnnouncements([]);
    setNotifications([]);
    setActiveChatMatch(null);
    setCurrentView('landing');
    addToast('Logged out of Collage Story.', 'info');
  };

  const navigateTo = (view) => {
    const publicViews = ['landing', 'about', 'how-it-works', 'safety', 'community', 'privacy', 'terms', 'contact', 'admin'];

    // Gatekeeping: Without login or approved account, user cannot enter website (except public views and admin portal)
    if (!isAuthenticated && !publicViews.includes(view)) {
      setIsAuthModalOpen(true);
      setAuthModalMode('login');
      addToast('Please log in or create an account to enter Collage Story.', 'info');
      setCurrentView('landing');
      return;
    }

    if (isAuthenticated && !publicViews.includes(view)) {
      updatePreferences({ lastVisitedSection: view });
    }

    setPreviousView(currentView);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        isDarkMode,
        toggleTheme,
        userPreferences,
        updatePreferences,
        playSoundEffect,
        isAuthChecking,
        updateDiscoveryPreferences,
        isAuthenticated,
        setIsAuthenticated,
        currentUser,
        setCurrentUser,
        currentView,
        previousView,
        navigateTo,
        profiles,
        setProfiles,
        likedProfiles,
        passedProfiles,
        handleSendMatchRequest,
        handlePass,
        incomingLikes,
        handleAcceptLike,
        handleRejectLike,
        sentRequests,
        setSentRequests,
        handleCancelRequest,
        handleUnmatch,
        refreshMatchingData,
        isMatchingLoading,
        matches,
        setMatches,
        conversations,
        activeChatMatch,
        setActiveChatMatch,
        sendMessage,
        handleAddReaction,
        handleDeleteMessage,
        handleSendGoRequest,
        handleRespondToGoRequest,
        announcements,
        campusEvents,
        setCampusEvents,
        savedPosts,
        setSavedPosts,
        boardInfo,
        dailyAllowance,
        refreshCampusBoard,
        handleCreateAnnouncement,
        handleUpdateAnnouncement,
        handleDeleteAnnouncement,
        handleUpvoteAnnouncement,
        handleToggleLikePost,
        handleToggleSavePost,
        currentPlanConfig,
        handleUpgradePlan,
        currentMood,
        setCurrentMood: updateUserMood,
        updateUserMood,
        resolveMoodOption,
        MOOD_OPTIONS,
        adminMetrics,
        adminReports,
        adminAuditLogs,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsRead,
        markNotificationRead,
        deleteNotification,
        isPremiumModalOpen,
        setIsPremiumModalOpen,
        reportTarget,
        setReportTarget,
        blockTarget,
        setBlockTarget,
        toasts,
        addToast,
        discoveryFilters,
        setDiscoveryFilters,
        discoveryCycleInfo,
        isDiscoveryLoading,
        fetchDiscoveryProfiles,
        refreshDiscoveryProfiles: () => fetchDiscoveryProfiles(),
        resetDiscoveryCycle: () => fetchDiscoveryProfiles({}, true),
        handleBlockUser,
        handleUnblockUser,
        handleReportUser,
        // Auth & Admin Verification Pipeline
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        pendingVerifications,
        setPendingVerifications,
        collegesList,
        loginWithCredentials,
        registerStudent,
        resubmitVerification,
        startApplicationReview,
        requestCorrectionOnApplication,
        approveStudentVerification,
        rejectStudentVerification,
        activeSessions,
        refreshSessions,
        handleRevokeSession,
        handleRevokeOtherSessions,
        resetPasswordToken,
        setResetPasswordToken,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

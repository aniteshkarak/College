import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { api, setStoredToken, clearStoredToken, getStoredToken } from '../services/api';
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
  // Auth & View state - By default unauthenticated (user cannot enter without login or creating account)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // Start on landing page
  const [previousView, setPreviousView] = useState('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'status'

  // Restore authenticated session from backend token if stored & support direct #admin routing
  useEffect(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const searchParam = new URLSearchParams(window.location.search).get('view');
      const target = hash || searchParam;
      if (target === 'admin') {
        setCurrentView('admin');
      }
    } catch (e) {}

    const token = getStoredToken();
    if (token) {
      api.auth.getMe()
        .then((res) => {
          if (res?.data) {
            setCurrentUser(res.data);
            setIsAuthenticated(true);
            // User sessions ALWAYS stay on student platform
            setCurrentView('matches');
          }
        })
        .catch(() => {
          clearStoredToken();
        });
    }
  }, []);

  // Colleges Registry
  const [collegesList, setCollegesList] = useState(PREMIER_COLLEGES);

  // Pending Verifications Queue for Admin (72-Hour Manual Verification System)
  const [pendingVerifications, setPendingVerifications] = useState(INITIAL_PENDING_VERIFICATIONS);

  // Discovery
  const [profiles, setProfiles] = useState(DISCOVER_PROFILES);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [passedProfiles, setPassedProfiles] = useState([]);

  // Filters
  const [discoveryFilters, setDiscoveryFilters] = useState({
    minAge: 18,
    maxAge: 26,
    gender: 'All',
    city: 'All',
    intention: 'All',
    maxDistance: 100,
    selectedInterests: []
  });

  // Incoming Likes ("Who liked you" with Accept / Reject buttons)
  const [incomingLikes, setIncomingLikes] = useState(INITIAL_INCOMING_LIKES);

  // Mutual Friends / Matches (Can only message after Accept!)
  const [matches, setMatches] = useState(INITIAL_MUTUAL_FRIENDS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeChatMatch, setActiveChatMatch] = useState(null);

  // Campus Board Announcements (College exclusive)
  const [announcements, setAnnouncements] = useState(INITIAL_CAMPUS_ANNOUNCEMENTS);
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

  // Mood
  const [currentMood, setCurrentMood] = useState(MOOD_OPTIONS[3]); // 'Want to make friends'

  // Admin Data
  const [adminMetrics, setAdminMetrics] = useState(ADMIN_METRICS);
  const [adminReports, setAdminReports] = useState(ADMIN_REPORTS);
  const [adminAuditLogs, setAdminAuditLogs] = useState(ADMIN_AUDIT_LOGS);

  // Notifications & Modals
  const [notifications, setNotifications] = useState([]);
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.notifications.markAllRead().catch((err) => console.warn('Sync markAllNotificationsRead:', err.message));
  };

  // Load live data from PostgreSQL Backend whenever student is authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    let isMounted = true;

    // 1. Fetch Discovery Profiles
    api.discovery.getProfiles()
      .then((res) => {
        if (!isMounted) return;
        const users = res?.data?.profiles || res?.data?.users || [];
        const mapped = users.map((u) => ({
          id: u.id,
          display_name: u.displayName || u.display_name || u.fullName,
          age: u.age || u.profile?.age || 21,
          gender: u.gender || u.profile?.gender || 'Student',
          city: u.city || u.profile?.city || 'Campus',
          state: u.state || u.profile?.state || '',
          college_name: u.collegeName || u.college_name || u.education?.collegeName || 'Premier College',
          course: u.course || u.degreeName || u.education?.course || 'Degree Program',
          relationship_intention: u.relationshipIntention || u.relationship_intention || 'Casual Connection',
          avatar_url: u.avatarUrl || u.avatar_url || u.photos?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
          additional_photos: u.additionalPhotos || u.additional_photos || (u.photos?.slice(1) || []).map((p) => p.url),
          bio: u.bio || u.profile?.bio || 'Verified college student on Collégé.',
          interests: u.interests || u.profile?.interests || [],
          languages: u.languages || u.languagesSpoken || ['English'],
          mood: u.mood || u.currentMood || 'Looking for a conversation',
          verified: true,
        }));
        setProfiles(mapped);
      })
      .catch((err) => console.warn('Could not load discovery profiles:', err.message));

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

    // 5. Fetch Notifications
    api.notifications.getAll()
      .then((res) => {
        if (!isMounted) return;
        const notifs = res?.data?.notifications || [];
        const mapped = notifs.map((n) => ({
          id: n.id,
          type: (n.type || 'system').toLowerCase(),
          title: n.title,
          body: n.body,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: n.read ?? n.isRead ?? false,
        }));
        setNotifications(mapped);
      })
      .catch((err) => console.warn('Could not load notifications:', err.message));

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

  // Automatically mark conversation read and refresh messages when activeChatMatch opens
  useEffect(() => {
    if (activeChatMatch?.id) {
      api.chat.markRead(activeChatMatch.id).catch(() => {});
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
        .catch(() => {});
    }
  }, [activeChatMatch?.id]);

  // Multi-Device Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    const token = getStoredToken();
    if (!token) return;

    refreshSessions();

    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : window.location.origin;

    const deviceId = localStorage.getItem('college_device_id') || `web_${Date.now()}`;
    localStorage.setItem('college_device_id', deviceId);

    const socket = io(socketUrl, {
      auth: {
        token,
        deviceId,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
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
        .catch(() => {});
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
        api.chat.markRead(convId).catch(() => {});
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
    } catch (e) {}

    addToast(`Accepted! You and ${likeItem.user.display_name} are now Mutual Friends. Chat unlocked! 💬`, 'success');
  };

  const handleRejectLike = (likeId) => {
    api.matching.rejectRequest(likeId).catch((err) => console.warn('Reject API sync:', err.message));
    setIncomingLikes((prev) => prev.filter((item) => item.id !== likeId));
    addToast('Match request declined.', 'info');
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

    setLikedProfiles((prev) => [...prev, profile.id]);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
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
    setPassedProfiles((prev) => [...prev, profile.id]);
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
      } catch (e) {}
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
      formData.append('category', annData.category || 'Campus Event');
      if (annData.isUrgent) formData.append('isUrgent', 'true');
      formData.append('image', imageFile);
      payload = formData;
    } else {
      payload = {
        title: annData.title,
        content: annData.content,
        category: annData.category || 'Campus Event',
        isUrgent: Boolean(annData.isUrgent),
      };
    }

    try {
      const res = await api.campus.createAnnouncement(payload);
      if (res?.data?.announcement) {
        setAnnouncements((prev) => [res.data.announcement, ...prev]);
      }
      if (res?.data?.allowance) {
        setDailyAllowance(res.data.allowance);
      }
      addToast(res?.message || `Announcement broadcast to ${currentUser?.college_name || 'your college'} Campus Board! 📢`, 'success');
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
      if (res?.data?.announcement) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...res.data.announcement } : a))
        );
      }
      addToast('Announcement updated successfully.', 'success');
      return res;
    } catch (err) {
      console.warn('Update announcement API error:', err.message);
      addToast(err.message || 'Could not update announcement', 'error');
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
      addToast('Announcement deleted from Campus Board.', 'info');
      return res;
    } catch (err) {
      console.warn('Delete announcement API error:', err.message);
      addToast(err.message || 'Could not delete announcement', 'error');
      throw err;
    }
  };

  const handleUpvoteAnnouncement = async (annId) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === annId ? { ...a, upvotes: (a.upvotes || 0) + 1 } : a))
    );
    try {
      await api.campus.upvote(annId);
      addToast('Upvoted campus announcement!', 'info');
    } catch (err) {
      console.warn('Upvote API error:', err.message);
    }
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
    } catch (e) {}

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
      const res = await api.auth.login(identifier, password);
      if (res && res.success && res.data) {
        const { user, accessToken } = res.data;
        if (accessToken) setStoredToken(accessToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
        // User login always opens the student platform, never the admin panel
        setCurrentView('matches');
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
          message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.'
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
    addToast('Logged out of Collégé.', 'info');
  };

  const navigateTo = (view) => {
    const publicViews = ['landing', 'about', 'how-it-works', 'safety', 'community', 'privacy', 'terms', 'contact', 'admin'];
    
    // Gatekeeping: Without login or approved account, user cannot enter website (except public views and admin portal)
    if (!isAuthenticated && !publicViews.includes(view)) {
      setIsAuthModalOpen(true);
      setAuthModalMode('login');
      addToast('Please log in or create an account to enter Collégé.', 'info');
      setCurrentView('landing');
      return;
    }

    setPreviousView(currentView);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
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
        boardInfo,
        dailyAllowance,
        refreshCampusBoard,
        handleCreateAnnouncement,
        handleUpdateAnnouncement,
        handleDeleteAnnouncement,
        handleUpvoteAnnouncement,
        currentPlanConfig,
        handleUpgradePlan,
        currentMood,
        setCurrentMood,
        adminMetrics,
        adminReports,
        adminAuditLogs,
        notifications,
        markAllNotificationsRead,
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
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

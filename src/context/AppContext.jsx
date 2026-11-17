import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_USER,
  DISCOVER_PROFILES,
  INITIAL_MATCHES,
  INITIAL_CONVERSATIONS,
  CONVERSATION_GAMES,
  DAILY_QUESTIONS,
  MOOD_OPTIONS,
  ADMIN_METRICS,
  ADMIN_REPORTS,
  ADMIN_AUDIT_LOGS
} from '../services/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth & View state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);
  const [currentView, setCurrentView] = useState('discover'); // 'discover' | 'matches' | 'chats' | 'games' | 'daily' | 'relationship' | 'profile' | 'settings' | 'admin' | 'landing' | 'about' | 'safety' | 'privacy' | 'terms' | 'how-it-works' | 'contact'
  const [previousView, setPreviousView] = useState('discover');

  // Discovery & Profiles
  const [profiles, setProfiles] = useState(DISCOVER_PROFILES);
  const [passedProfiles, setPassedProfiles] = useState([]);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [matchedCelebrationUser, setMatchedCelebrationUser] = useState(null);

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

  // Matches & Chat
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeChatMatch, setActiveChatMatch] = useState(null);

  // Relationship mode
  const [relationshipRequests, setRelationshipRequests] = useState([
    // e.g. { matchId: 'match_002', from: 'usr_004', to: 'usr_me_001', status: 'pending', createdAt: '2026-11-17T18:00:00Z' }
  ]);
  const [activeRelationship, setActiveRelationship] = useState(null);

  // Daily Question & Mood
  const [todayQuestion, setTodayQuestion] = useState(DAILY_QUESTIONS[0]);
  const [userDailyAnswer, setUserDailyAnswer] = useState('');
  const [dailyAnswerVisibility, setDailyAnswerVisibility] = useState('public'); // 'public' | 'private'
  const [currentMood, setCurrentMood] = useState(MOOD_OPTIONS[5]); // 'Open to dating'

  // Admin Data
  const [adminMetrics, setAdminMetrics] = useState(ADMIN_METRICS);
  const [adminReports, setAdminReports] = useState(ADMIN_REPORTS);
  const [adminAuditLogs, setAdminAuditLogs] = useState(ADMIN_AUDIT_LOGS);

  // Notifications & Modals
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      type: 'match',
      title: 'New Match!',
      body: 'You and Riya Sen liked each other. Say hello!',
      time: '10m ago',
      read: false
    },
    {
      id: 'notif_2',
      type: 'message',
      title: 'New Voice Note',
      body: 'Tanvi sent you a 24s voice note.',
      time: '1h ago',
      read: true
    },
    {
      id: 'notif_3',
      type: 'game',
      title: 'Game Invitation',
      body: 'Riya invited you to play Truth or Dare!',
      time: '3h ago',
      read: true
    }
  ]);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { user, messageId }
  const [blockTarget, setBlockTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Like logic
  const handleLike = (profile) => {
    setLikedProfiles((prev) => [...prev, profile.id]);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));

    // Simulated mutual match (Riya Sen, Tanvi, Sneha will match instantly)
    const isMutual = ['usr_002', 'usr_003', 'usr_004'].includes(profile.id);

    if (isMutual) {
      const newMatchId = 'match_' + Date.now();
      const newMatch = {
        id: newMatchId,
        user: profile,
        matched_at: new Date().toISOString(),
        status: 'active',
        relationship_stage: 'Matched',
        unread_count: 0,
        last_message: null
      };

      setMatches((prev) => [newMatch, ...prev]);
      setConversations((prev) => ({
        ...prev,
        [newMatchId]: [
          {
            id: 'sys_' + Date.now(),
            sender_id: 'system',
            message_type: 'system',
            content: "It's a match! You both liked each other. Start with a respectful conversation or an icebreaker game.",
            created_at: new Date().toISOString()
          }
        ]
      }));

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback silently if canvas not available
      }

      setMatchedCelebrationUser(profile);
      addToast(`It's a Match with ${profile.display_name}! ✨`, 'success');
    } else {
      addToast(`Liked ${profile.display_name}`, 'info');
    }
  };

  // Pass logic (Never reveal who passed)
  const handlePass = (profile) => {
    setPassedProfiles((prev) => [...prev, profile.id]);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  // Block logic
  const handleBlockUser = (userId, userName) => {
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setMatches((prev) => prev.filter((m) => m.user.id !== userId));
    addToast(`${userName || 'User'} has been blocked and removed from all matches.`, 'warning');
    setBlockTarget(null);
    if (activeChatMatch && activeChatMatch.user.id === userId) {
      setActiveChatMatch(null);
      setCurrentView('chats');
    }
  };

  // Report logic
  const handleReportUser = (reportedUser, category, description) => {
    const newReport = {
      id: 'rep_' + Date.now(),
      reporter: `${currentUser.id} (${currentUser.display_name})`,
      reported_user: `${reportedUser.id} (${reportedUser.display_name})`,
      category,
      description,
      evidence: 'Submitted via in-app report workflow.',
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    setAdminReports((prev) => [newReport, ...prev]);
    setAdminMetrics((prev) => ({ ...prev, total_reports: prev.total_reports + 1 }));
    setReportTarget(null);
    addToast('Report submitted to moderation team. Thank you for keeping Collégé safe.', 'success');
  };

  // Send message
  const sendMessage = (matchId, messagePayload) => {
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

    // Update match last message
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            last_message: {
              content: messagePayload.message_type === 'voice' ? `Audio Note (${messagePayload.duration_seconds || 15}s)` : messagePayload.content,
              created_at: newMessage.created_at,
              sender_id: currentUser.id,
              message_type: messagePayload.message_type
            }
          };
        }
        return m;
      })
    );

    // Simulated responsive reply after 2 seconds to make conversations feel responsive
    const match = matches.find((m) => m.id === matchId);
    if (match && match.user) {
      setTimeout(() => {
        const replies = [
          `Haha that's so true! 😊`,
          `Totally agree! Want to try a round of Would You Rather?`,
          `That made my day! How is campus life treating you today?`,
          `Good point! What are you planning for the weekend?`
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg = {
          id: 'msg_' + Date.now() + '_bot',
          sender_id: match.user.id,
          message_type: 'text',
          content: randomReply,
          created_at: new Date().toISOString(),
          reactions: []
        };

        setConversations((prevConv) => ({
          ...prevConv,
          [matchId]: [...(prevConv[matchId] || []), replyMsg]
        }));

        setMatches((prevMatches) =>
          prevMatches.map((m) => {
            if (m.id === matchId) {
              return {
                ...m,
                unread_count: activeChatMatch?.id === matchId ? 0 : m.unread_count + 1,
                last_message: {
                  content: randomReply,
                  created_at: replyMsg.created_at,
                  sender_id: match.user.id,
                  message_type: 'text'
                }
              };
            }
            return m;
          })
        );
      }, 2000);
    }
  };

  // Add reaction to message
  const handleAddReaction = (matchId, messageId, reactionEmoji) => {
    setConversations((prev) => {
      const thread = prev[matchId] || [];
      const updated = thread.map((msg) => {
        if (msg.id === messageId) {
          const existingReactionIndex = (msg.reactions || []).findIndex((r) => r.user_id === currentUser.id);
          let newReactions = [...(msg.reactions || [])];
          if (existingReactionIndex > -1) {
            newReactions[existingReactionIndex] = { user_id: currentUser.id, reaction: reactionEmoji };
          } else {
            newReactions.push({ user_id: currentUser.id, reaction: reactionEmoji });
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      });
      return { ...prev, [matchId]: updated };
    });
  };

  // Delete message
  const handleDeleteMessage = (matchId, messageId) => {
    setConversations((prev) => {
      const thread = prev[matchId] || [];
      return {
        ...prev,
        [matchId]: thread.filter((msg) => msg.id !== messageId)
      };
    });
    addToast('Message deleted', 'info');
  };

  // Relationship mode workflows (PRD 4.9)
  const sendRelationshipRequest = (matchId) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    // In a real system, the partner gets a private request. Here we simulate mutual response!
    const newReq = {
      id: 'req_' + Date.now(),
      matchId,
      requester: currentUser,
      receiver: match.user,
      status: 'pending',
      requested_at: new Date().toISOString()
    };

    setRelationshipRequests((prev) => [...prev, newReq]);
    addToast(`Relationship request sent privately to ${match.user.display_name}.`, 'info');

    // Simulate partner acceptance and confirmation prompt
    setTimeout(() => {
      addToast(`${match.user.display_name} has accepted your relationship intention! Confirm mutual status to make it official. ❤️`, 'success');
      setRelationshipRequests((prev) =>
        prev.map((r) => (r.matchId === matchId ? { ...r, status: 'mutual_accepted' } : r))
      );
    }, 2500);
  };

  const confirmMutualRelationship = (matchId) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const relObj = {
      id: 'rel_' + Date.now(),
      partner: match.user,
      matchId,
      status: 'In Relationship',
      started_at: new Date().toISOString(),
      display_on_profile: true
    };

    setActiveRelationship(relObj);
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, relationship_stage: 'Relationship' } : m))
    );

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch (e) {}

    addToast(`Congratulations! You and ${match.user.display_name} are now in an official relationship on Collégé! 💖`, 'success');
  };

  const endMutualRelationship = () => {
    setActiveRelationship(null);
    addToast('Relationship ended on the platform. We hope both of you find happiness ahead.', 'info');
  };

  // Navigation helper
  const navigateTo = (view) => {
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
        handleLike,
        handlePass,
        handleBlockUser,
        handleReportUser,
        matchedCelebrationUser,
        setMatchedCelebrationUser,
        discoveryFilters,
        setDiscoveryFilters,
        matches,
        setMatches,
        conversations,
        activeChatMatch,
        setActiveChatMatch,
        sendMessage,
        handleAddReaction,
        handleDeleteMessage,
        relationshipRequests,
        activeRelationship,
        sendRelationshipRequest,
        confirmMutualRelationship,
        endMutualRelationship,
        todayQuestion,
        userDailyAnswer,
        setUserDailyAnswer,
        dailyAnswerVisibility,
        setDailyAnswerVisibility,
        currentMood,
        setCurrentMood,
        adminMetrics,
        setAdminMetrics,
        adminReports,
        setAdminReports,
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
        addToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

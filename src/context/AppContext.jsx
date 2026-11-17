import React, { createContext, useContext, useState } from 'react';
import confetti from 'canvas-confetti';
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
  ADMIN_AUDIT_LOGS
} from '../services/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth & View state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);
  const [currentView, setCurrentView] = useState('matches'); // Start in matches or discover
  const [previousView, setPreviousView] = useState('matches');

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

  // Active Relationship
  const [activeRelationship, setActiveRelationship] = useState(null);

  // Mood
  const [currentMood, setCurrentMood] = useState(MOOD_OPTIONS[3]); // 'Want to make friends'

  // Admin Data
  const [adminMetrics, setAdminMetrics] = useState(ADMIN_METRICS);
  const [adminReports, setAdminReports] = useState(ADMIN_REPORTS);
  const [adminAuditLogs, setAdminAuditLogs] = useState(ADMIN_AUDIT_LOGS);

  // Notifications & Modals
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      type: 'like',
      title: 'New Like Received',
      body: 'Tanvi Sharma from IIT Kharagpur liked your profile. Check your Match Requests!',
      time: '15m ago',
      read: false
    },
    {
      id: 'notif_2',
      type: 'campus',
      title: 'New Campus Announcement',
      body: 'Spring Fest 2026 band night auditions announced on your Campus Board.',
      time: '1h ago',
      read: false
    }
  ]);
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
  };

  // Current Plan Limits Helper
  const currentPlanConfig = SUBSCRIPTION_PLANS[currentUser.subscription_plan] || SUBSCRIPTION_PLANS.free;

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

    // Create mutual friend connection
    const newMatchId = 'match_' + Date.now();
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
    setIncomingLikes((prev) => prev.filter((item) => item.id !== likeId));
    addToast('Match request declined.', 'info');
  };

  // SEND MATCH REQUEST (In Discover feed)
  const handleSendMatchRequest = (profile) => {
    // Check sent requests limit
    if (currentUser.sent_requests_count >= currentPlanConfig.max_sent_requests) {
      addToast(
        `Sent request limit reached (${currentPlanConfig.max_sent_requests} on ${currentPlanConfig.name}). Upgrade to Campus Pro!`,
        'warning'
      );
      setIsPremiumModalOpen(true);
      return;
    }

    setLikedProfiles((prev) => [...prev, profile.id]);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setCurrentUser((prev) => ({
      ...prev,
      sent_requests_count: (prev.sent_requests_count || 0) + 1
    }));

    addToast(`Match request sent to ${profile.display_name}! (Used ${currentUser.sent_requests_count + 1}/${currentPlanConfig.max_sent_requests})`, 'info');
  };

  const handlePass = (profile) => {
    setPassedProfiles((prev) => [...prev, profile.id]);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  // "GO BUTTON" STAGE TRANSITION (Friend -> Dating -> Relationship)
  const handleSendGoRequest = (matchId, targetStage = 'Dating') => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    // Set pending go request
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              go_request: {
                from: currentUser.id,
                targetStage,
                status: 'pending',
                requested_at: new Date().toISOString()
              }
            }
          : m
      )
    );

    addToast(`"Go" request sent to ${match.user.display_name}! Asked to transition to ${targetStage} stage.`, 'info');

    // Simulate partner response after 3 seconds for demonstration
    setTimeout(() => {
      // Possible reactions: 'accept' | 'reject' | 'sometimes_later' | 'we_are_good_as_a_friend'
      const simulatedResponse = 'accept';

      if (simulatedResponse === 'accept') {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  stage: targetStage,
                  go_request: null
                }
              : m
          )
        );

        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 }
          });
        } catch (e) {}

        addToast(
          `❤️ ${match.user.display_name} Accepted your "Go" request! You are now in the ${targetStage} stage!`,
          'success'
        );
      }
    }, 3000);
  };

  // Handle responding to an incoming Go request (the 4 specified choices)
  const handleRespondToGoRequest = (matchId, choice) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    if (choice === 'accept') {
      const nextStage = match.go_request?.targetStage || 'Dating';
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, stage: nextStage, go_request: null }
            : m
        )
      );
      try {
        confetti({ particleCount: 90, spread: 70 });
      } catch (e) {}
      addToast(`Accepted! You and ${match.user.display_name} are now in the ${nextStage} stage! ❤️`, 'success');
    } else if (choice === 'reject') {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, go_request: null } : m))
      );
      addToast(`Declined the stage transition request.`, 'info');
    } else if (choice === 'sometimes_later') {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, go_request: null } : m))
      );
      addToast(`Replied: 'Sometimes later'. Take your time! 😊`, 'info');
    } else if (choice === 'we_are_good_as_a_friend') {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, stage: 'Friend', go_request: null } : m))
      );
      addToast(`Replied: 'We are good as a friend'. Staying as mutual friends 🤝`, 'info');
    }
  };

  // CAMPUS BOARD: Announcement publishing (College-exclusive)
  const handleCreateAnnouncement = (annData) => {
    const newAnnouncement = {
      id: 'ann_' + Date.now(),
      college_name: currentUser.college_name,
      author_name: currentUser.display_name,
      author_role: 'Student',
      title: annData.title,
      category: annData.category || 'Campus Event',
      badge_color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      content: annData.content,
      date: 'Today',
      upvotes: 1,
      pinned: false
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    addToast(`Announcement broadcast to ${currentUser.college_name} Campus Board! 📢`, 'success');
  };

  const handleUpvoteAnnouncement = (annId) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === annId ? { ...a, upvotes: a.upvotes + 1 } : a))
    );
    addToast('Upvoted campus announcement!', 'info');
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
    setReportTarget(null);
    addToast('Report submitted to campus moderation team.', 'success');
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

    // Simulated responsive reply
    setTimeout(() => {
      const replies = [
        `Totally agree! So glad we connected as mutual friends 😊`,
        `That's awesome! How is your semester going so far?`,
        `Haha love that! Check out the announcement on our Campus Board too 📢`,
        `Spot on! Want to try a round of Would You Rather?`
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
        handleCreateAnnouncement,
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
        handleReportUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

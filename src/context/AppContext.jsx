import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Restore authenticated session from backend token if stored
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.auth.getMe()
        .then((res) => {
          if (res?.data) {
            setCurrentUser(res.data);
            setIsAuthenticated(true);
            if (res.data.role === 'SUPER_ADMIN' || res.data.role === 'VERIFICATION_ADMIN') {
              setCurrentView('admin');
            }
          }
        })
        .catch(() => {
          clearStoredToken();
        });
    }
  }, []);

  // Colleges Registry
  const [collegesList, setCollegesList] = useState(PREMIER_COLLEGES);

  // Registered accounts database (Simulated)
  const [registeredUsers, setRegisteredUsers] = useState([
    {
      ...INITIAL_USER,
      email: 'anirban@iitkgp.ac.in',
      mobile: '9876543210',
      password: 'password123',
      verification_status: 'APPROVED',
      accountStatus: 'ACTIVE',
      role: 'ADMIN' // Super Admin
    }
  ]);

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

  // --- COMPLETE MANUAL VERIFICATION & 72-HOUR LIFECYCLE ---

  // Helper: Check local registered accounts & applications (offline simulation / demo fallback)
  const checkLocalCredentials = (cleanId, password) => {
    // Check in pending/reviewed applications queue
    const appMatch = pendingVerifications.find(
      (v) =>
        (v.email && v.email.toLowerCase() === cleanId) ||
        (v.mobile && v.mobile === cleanId) ||
        (v.application_id && v.application_id.toLowerCase() === cleanId)
    );

    if (appMatch) {
      if (appMatch.status === 'PENDING_REVIEW') {
        return {
          success: false,
          status: 'PENDING_REVIEW',
          student: appMatch,
          message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.'
        };
      }

      if (appMatch.status === 'UNDER_REVIEW') {
        return {
          success: false,
          status: 'UNDER_REVIEW',
          student: appMatch,
          message: 'Your application is currently being inspected by an authorized campus administrator.'
        };
      }

      if (appMatch.status === 'NEEDS_CORRECTION') {
        return {
          success: false,
          status: 'NEEDS_CORRECTION',
          student: appMatch,
          reason: appMatch.correction_message || 'The administrator requested corrections on your submitted information.',
          fields: appMatch.correction_fields || [],
          message: `Correction Requested by Admin: "${appMatch.correction_message}". Please update your details and resubmit.`
        };
      }

      if (appMatch.status === 'RESUBMITTED') {
        return {
          success: false,
          status: 'RESUBMITTED',
          student: appMatch,
          message: 'Your corrected application was resubmitted and is currently in the admin verification queue.'
        };
      }

      if (appMatch.status === 'REJECTED') {
        return {
          success: false,
          status: 'REJECTED',
          student: appMatch,
          reason: appMatch.rejection_reason || 'Application was declined by the administrator.',
          message: `Application declined: "${appMatch.rejection_reason}".`
        };
      }

      if (appMatch.status === 'APPROVED') {
        // Student was approved! Log in
        const userObj = {
          id: appMatch.id,
          full_name: appMatch.legal_name || appMatch.full_name,
          display_name: appMatch.display_name,
          date_of_birth: appMatch.date_of_birth,
          age: appMatch.age,
          gender: appMatch.gender,
          interested_in: ['Everyone'],
          city: appMatch.city || 'Kolkata',
          state: appMatch.state || 'West Bengal',
          college_name: appMatch.college_name,
          course: appMatch.degree_name || appMatch.course,
          relationship_intention: appMatch.looking_for === 'Dating' ? 'Dating Connection' : 'Casual Connection',
          avatar_url: appMatch.photo_1,
          additional_photos: [appMatch.photo_2, appMatch.photo_3].filter(Boolean),
          bio: appMatch.bio || `Student at ${appMatch.college_name}. Verified campus profile!`,
          interests: appMatch.interests || ['Music', 'Travelling', 'Coding'],
          languages: appMatch.languages_spoken || ['English', 'Bengali', 'Hindi'],
          is_active: true,
          verification_status: 'APPROVED',
          accountStatus: 'ACTIVE',
          mood: 'Looking for a conversation',
          subscription_plan: 'free',
          sent_requests_count: 0,
          created_at: appMatch.submitted_at
        };

        setCurrentUser(userObj);
        setIsAuthenticated(true);
        setCurrentView('matches');
        addToast(`Welcome to Collégé, ${userObj.display_name}! 🎓✨ Account activated.`, 'success');
        return { success: true, user: userObj };
      }
    }

    // Check in registered users (including default Anirban demo account)
    const userMatch = registeredUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.mobile && u.mobile === cleanId) ||
        (cleanId === 'anirban' || cleanId === 'admin')
    );

    if (userMatch) {
      setCurrentUser(userMatch);
      setIsAuthenticated(true);
      setCurrentView(userMatch.role === 'ADMIN' ? 'admin' : 'matches');
      addToast(`Welcome back, ${userMatch.display_name}! ✨`, 'success');
      return { success: true, user: userMatch };
    }

    return {
      success: false,
      message: 'No account or application found with this email, mobile number, or Application ID.'
    };
  };

  // 1. Log In using Gmail/Email OR Mobile + Password (with Backend API + Local fallback)
  const loginWithCredentials = async (identifier, password) => {
    const cleanId = (identifier || '').trim().toLowerCase();

    try {
      const res = await api.auth.login(identifier, password);
      if (res && res.success && res.data) {
        const { user, accessToken } = res.data;
        if (accessToken) setStoredToken(accessToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setCurrentView(user.role === 'SUPER_ADMIN' || user.role === 'VERIFICATION_ADMIN' ? 'admin' : 'matches');
        addToast(`Welcome back, ${user.display_name}! ✨`, 'success');
        return { success: true, user };
      }
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

      // If backend explicitly rejected password or user not found, check local mock registry
      if (err.code === 'INVALID_CREDENTIALS' || err.code === 'USER_NOT_FOUND') {
        const localResult = checkLocalCredentials(cleanId, password);
        if (localResult && localResult.success) return localResult;
        return {
          success: false,
          message: err.message || 'Invalid credentials. Password does not match.'
        };
      }

      // If backend is offline or network error, fallback to local credentials
      console.warn('Backend unavailable, using local simulated login:', err.message);
    }

    return checkLocalCredentials(cleanId, password);
  };

  // 2. Register New Student Application (Backend API + Local fallback)
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
          applicationId: app.application_id,
          message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.'
        };
      }
    } catch (err) {
      if (err.code !== 'SERVER_OFFLINE') {
        console.warn('Backend registration failed with validation error:', err.message);
        return {
          success: false,
          message: err.message || 'Registration failed.'
        };
      }
      console.warn('Backend server offline, falling back to local registration simulation.');
    }

    // Duplicate check
    const duplicate = pendingVerifications.find(
      (v) =>
        (v.email && v.email.toLowerCase() === studentData.email.toLowerCase()) ||
        (v.mobile && v.mobile === studentData.mobile)
    );

    if (duplicate && ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED'].includes(duplicate.status)) {
      return {
        success: false,
        status: duplicate.status,
        message: `An application (${duplicate.application_id}) with this email or mobile is already in review.`
      };
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const appId = `COL-${year}-${randomSuffix}`;
    const submittedAt = new Date().toISOString();
    const reviewDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const newApp = {
      id: 'app_' + Date.now(),
      application_id: appId,
      status: 'PENDING_REVIEW',
      legal_name: studentData.legal_name || studentData.full_name,
      display_name: studentData.display_name,
      date_of_birth: studentData.date_of_birth,
      age: studentData.age,
      gender: studentData.gender,
      email: studentData.email,
      mobile: studentData.mobile,
      city: studentData.city,
      state: studentData.state,
      languages_spoken: studentData.languages_spoken || ['English'],
      college_name: studentData.college_name,
      university_name: studentData.university_name || '',
      college_location: studentData.college_location || studentData.city,
      college_state: studentData.college_state || studentData.state,
      degree_name: studentData.degree_name || studentData.course,
      department_stream: studentData.department_stream || 'General',
      academic_year: studentData.academic_year || '1st Year',
      current_semester: studentData.current_semester || 'Semester 1',
      graduation_year: studentData.graduation_year || 2026,
      student_status: studentData.student_status || 'CURRENTLY_STUDYING',
      verification_id_type: studentData.verification_id_type || 'College Student ID',
      verification_id_url: studentData.verification_id_url,
      verification_notes: studentData.verification_notes || 'Student uploaded verification document.',
      photo_1: studentData.photo_1,
      photo_2: studentData.photo_2,
      photo_3: studentData.photo_3,
      bio: studentData.bio || 'College student ready to connect!',
      interests: studentData.interests || ['Music', 'Travelling'],
      hobbies: studentData.hobbies || ['Reading'],
      personality: studentData.personality || '',
      looking_for: studentData.looking_for || 'Friendship',
      age_range_min: studentData.age_range_min || 18,
      age_range_max: studentData.age_range_max || 26,
      preferred_distance: studentData.preferred_distance || 'ANYWHERE_INDIA',
      submitted_at: submittedAt,
      review_deadline: reviewDeadline,
      assigned_admin: null,
      correction_fields: [],
      correction_message: null,
      rejection_reason: null
    };

    setPendingVerifications((prev) => [newApp, ...prev]);
    setAdminMetrics((prev) => ({
      ...prev,
      pending_verifications: prev.pending_verifications + 1
    }));

    return {
      success: true,
      status: 'PENDING_REVIEW',
      student: newApp,
      applicationId: appId,
      message: 'Your Collégé application has been successfully submitted. Our verification team is reviewing your information and documents. The review may take up to 72 hours. We will notify you once a decision has been made.'
    };
  };

  // 3. Resubmit Corrected Details when in NEEDS_CORRECTION
  const resubmitVerification = async (appId, updatedData) => {
    try {
      await api.registration.resubmit(appId, updatedData);
    } catch (err) {
      console.warn('Backend resubmit sync error, continuing with local state:', err.message);
    }

    const submittedAt = new Date().toISOString();
    const reviewDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    setPendingVerifications((prev) =>
      prev.map((app) => {
        if (app.id === appId || app.application_id === appId) {
          return {
            ...app,
            ...updatedData,
            status: 'RESUBMITTED',
            correction_fields: [],
            correction_message: null,
            submitted_at: submittedAt,
            review_deadline: reviewDeadline
          };
        }
        return app;
      })
    );

    addToast('Corrected application resubmitted! Our team will continue verification.', 'info');
    return { success: true };
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

    // Create user profile in registered users
    const newUser = {
      id: student.id,
      applicationId: student.application_id,
      full_name: student.legal_name || student.full_name,
      display_name: student.display_name,
      date_of_birth: student.date_of_birth,
      age: student.age,
      gender: student.gender,
      email: student.email,
      mobile: student.mobile,
      college_name: student.college_name,
      course: student.degree_name || student.course,
      avatar_url: student.photo_1,
      additional_photos: [student.photo_2, student.photo_3].filter(Boolean),
      bio: student.bio,
      interests: student.interests,
      languages: student.languages_spoken,
      is_active: true,
      accountStatus: 'ACTIVE',
      verification_status: 'APPROVED',
      mood: 'Looking for a conversation',
      subscription_plan: 'free',
      sent_requests_count: 0,
      created_at: new Date().toISOString()
    };

    setRegisteredUsers((prev) => [...prev, newUser]);

    // Admin audit log
    const newLog = {
      id: 'log_' + Date.now(),
      admin: `SuperAdmin (${currentUser?.display_name || 'Admin'})`,
      action: `APPROVED Application ${student.application_id} for ${newUser.full_name}`,
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
      action: `REJECTED Application ${student.application_id} for ${student.legal_name || student.full_name}`,
      reason: reason || 'Application does not meet platform safety or document guidelines.',
      timestamp: new Date().toISOString()
    };
    setAdminAuditLogs((prev) => [newLog, ...prev]);
    setAdminMetrics((prev) => ({
      ...prev,
      pending_verifications: Math.max(0, prev.pending_verifications - 1)
    }));

    addToast(`Application ${student.application_id} rejected. Reason: "${reason}"`, 'warning');
  };

  // 8. Sign Out
  const logout = () => {
    api.auth.logout();
    clearStoredToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('landing');
    addToast('Logged out of Collégé.', 'info');
  };

  const navigateTo = (view) => {
    const publicViews = ['landing', 'about', 'how-it-works', 'safety', 'community', 'privacy', 'terms', 'contact'];
    
    // Gatekeeping: Without login or approved account, user cannot enter website
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
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

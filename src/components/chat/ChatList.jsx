import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { resolvePhotoUrl } from '../../services/api';
import { MOOD_OPTIONS } from '../../services/mockData';
import ProfilePreviewModal from '../discover/ProfilePreviewModal';
import {
  Heart,
  UserCheck,
  X,
  Check,
  MessageCircle,
  Mic,
  Sparkles,
  Search,
  Lock,
  Crown,
  Users2,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserX,
  Ban,
  Flag,
  User,
  AlertTriangle,
  RotateCcw,
  GraduationCap
} from 'lucide-react';

export const ChatList = ({ onSelectMatch }) => {
  const {
    matches,
    incomingLikes,
    sentRequests,
    handleAcceptLike,
    handleRejectLike,
    handleCancelRequest,
    handleUnmatch,
    currentPlanConfig,
    setIsPremiumModalOpen,
    currentUser,
    navigateTo,
    setReportTarget,
    setBlockTarget
  } = useApp();

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'sent' | 'mutual'
  const [searchQuery, setSearchQuery] = useState('');
  const [sentFilter, setSentFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'

  // Modal inspection & confirmation state
  const [previewProfile, setPreviewProfile] = useState(null);
  const [confirmCancelReq, setConfirmCancelReq] = useState(null);
  const [confirmUnmatchMatch, setConfirmUnmatchMatch] = useState(null);
  const [activeMenuMatchId, setActiveMenuMatchId] = useState(null);

  // Filtered Mutual Matches
  const filteredMatches = matches.filter((m) => {
    const nameMatch = m.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const collegeMatch = m.user?.college_name && m.user?.college_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || collegeMatch;
  });

  // Filtered Sent Requests
  const filteredSentRequests = (sentRequests || []).filter((r) => {
    if (sentFilter === 'ALL') return true;
    return r.status === sentFilter;
  });

  const pendingSentCount = (sentRequests || []).filter((r) => r.status === 'PENDING').length;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Matches & Connections
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage incoming likes, sent requests and active mutual friends.
          </p>
        </div>

        {/* Subscription Plan Quota Badge */}
        <button
          onClick={() => setIsPremiumModalOpen(true)}
          className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-left hover:brightness-105 transition-all shrink-0"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white">
              <span>{currentPlanConfig.name}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase">
                {currentUser?.subscription_plan === 'free' ? 'Upgrade' : 'Active'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Matches: {matches.length}/{currentPlanConfig.max_mutual_matches === 9999 ? '∞' : currentPlanConfig.max_mutual_matches} • Sent: {currentUser?.sent_requests_count || 0}/{currentPlanConfig.max_sent_requests === 9999 ? '∞' : currentPlanConfig.max_sent_requests}
            </p>
          </div>
        </button>
      </div>

      {/* 3 Main Navigation Tabs: Incoming | Sent | Mutual */}
      <div className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto scrollbar-none">
        
        {/* Tab 1: Who Liked You */}
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 min-w-[105px] py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'incoming'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
          <span>Who Liked You</span>
          {incomingLikes.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full">
              {incomingLikes.length}
            </span>
          )}
        </button>

        {/* Tab 2: Outgoing Requests */}
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 min-w-[105px] py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sent'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Sent Requests</span>
          {pendingSentCount > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-500 text-white text-[10px] font-extrabold rounded-full">
              {pendingSentCount}
            </span>
          )}
        </button>

        {/* Tab 3: Mutual Friends & Chats */}
        <button
          onClick={() => setActiveTab('mutual')}
          className={`flex-1 min-w-[105px] py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'mutual'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Mutual Friends</span>
          {matches.length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full">
              {matches.length}
            </span>
          )}
        </button>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: WHO LIKED YOU (INCOMING REQUESTS) */}
      {/* ====================================================================== */}
      {activeTab === 'incoming' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex items-center justify-between text-xs text-rose-900 dark:text-rose-300">
            <span className="font-medium">
              Accepting a request makes them your <strong>Mutual Friend</strong> and unlocks private 1-on-1 chatting.
            </span>
            <span className="text-[11px] font-bold text-rose-600 shrink-0 ml-2">
              Free: 5 Max
            </span>
          </div>

          {incomingLikes.length > 0 ? (
            incomingLikes.map((likeItem) => (
              <div
                key={likeItem.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-rose-300 dark:hover:border-rose-800"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div
                    onClick={() => setPreviewProfile(likeItem.user)}
                    className="relative shrink-0 cursor-pointer group"
                    title="Click to view full profile"
                  >
                    <img
                      src={resolvePhotoUrl(likeItem.user.avatar_url || likeItem.user.avatarUrl)}
                      alt={likeItem.user.display_name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-rose-500/20 shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900" title="Verified Student">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        onClick={() => setPreviewProfile(likeItem.user)}
                        className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer truncate"
                      >
                        {likeItem.user.display_name}
                        {likeItem.user.age ? `, ${likeItem.user.age}` : ''}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                        {likeItem.user.relationship_intention || 'Dating Connection'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span>{likeItem.user.college_name || 'Campus Student'}</span>
                      {likeItem.user.course && <span>• {likeItem.user.course}</span>}
                    </p>

                    {likeItem.user.bio && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-1 mt-1">
                        "{likeItem.user.bio}"
                      </p>
                    )}

                    {likeItem.user.interests && likeItem.user.interests.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        {likeItem.user.interests.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-full text-slate-600 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 mt-1">
                      Received {new Date(likeItem.created_at || likeItem.likedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Accept / Reject / View Profile Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setPreviewProfile(likeItem.user)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
                    title="View Profile Details"
                  >
                    <User className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRejectLike(likeItem.id)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Decline request"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => handleAcceptLike(likeItem)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white gradient-brand-bg shadow-md hover:brightness-105 active:scale-95 transition-all"
                    title="Accept to become mutual friends"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Accept (Mutual Friend)</span>
                  </button>
                </div>

              </div>
            ))
          ) : (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500 mx-auto mb-3">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Pending Likes Right Now
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                When students like your profile in Discover, their requests will appear here for you to accept or decline.
              </p>
              <button
                onClick={() => navigateTo('discover')}
                className="px-5 py-2.5 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Campus Profiles</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: SENT REQUESTS (OUTGOING) */}
      {/* ====================================================================== */}
      {activeTab === 'sent' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Filter Chips */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setSentFilter(filterKey)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    sentFilter === filterKey
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filterKey === 'ALL'
                    ? 'All'
                    : filterKey === 'PENDING'
                    ? 'Pending'
                    : filterKey === 'ACCEPTED'
                    ? 'Accepted'
                    : 'Not Accepted'}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Showing {filteredSentRequests.length} outgoing requests
            </p>
          </div>

          {filteredSentRequests.length > 0 ? (
            filteredSentRequests.map((reqItem) => {
              const isPending = reqItem.status === 'PENDING';
              const isAccepted = reqItem.status === 'ACCEPTED';
              const isRejected = reqItem.status === 'REJECTED';

              return (
                <div
                  key={reqItem.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div
                      onClick={() => setPreviewProfile(reqItem.user)}
                      className="relative shrink-0 cursor-pointer group"
                      title="Click to view profile"
                    >
                      <img
                        src={resolvePhotoUrl(reqItem.user?.avatar_url || reqItem.user?.avatarUrl)}
                        alt={reqItem.user?.display_name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          onClick={() => setPreviewProfile(reqItem.user)}
                          className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
                        >
                          {reqItem.user?.display_name}
                          {reqItem.user?.age ? `, ${reqItem.user.age}` : ''}
                        </h4>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                            <Clock className="w-3 h-3" /> Awaiting Decision
                          </span>
                        )}
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Accepted!
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            <XCircle className="w-3 h-3" /> Not Accepted
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        <span>{reqItem.user?.college_name || 'Campus Student'}</span>
                        {reqItem.user?.course && <span>• {reqItem.user.course}</span>}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1">
                        Sent on {new Date(reqItem.created_at || reqItem.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Outgoing Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setPreviewProfile(reqItem.user)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
                      title="View Profile Details"
                    >
                      <User className="w-4 h-4" />
                    </button>

                    {isPending && (
                      <button
                        onClick={() => setConfirmCancelReq(reqItem)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 transition-colors"
                        title="Cancel sent request and recover quota"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel Request</span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => {
                          const m = matches.find((match) => match.user?.id === reqItem.user?.id);
                          if (m) {
                            onSelectMatch(m);
                          } else {
                            navigateTo('chats');
                          }
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white gradient-brand-bg shadow-md hover:brightness-105 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Open Chat</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-500 mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Outgoing Requests Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                You haven't sent any match requests under this filter. Discover peer students from your campus and send a like!
              </p>
              <button
                onClick={() => navigateTo('discover')}
                className="px-5 py-2.5 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Go to Discover Feed</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: MUTUAL FRIENDS & CHATS (MATCHES) */}
      {/* ====================================================================== */}
      {activeTab === 'mutual' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mutual friends by name or college..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            />
          </div>

          {filteredMatches.length > 0 ? (
            filteredMatches.map((m) => {
              const hasUnread = (m.unread_count || 0) > 0;
              const isMenuOpen = activeMenuMatchId === m.id;

              return (
                <div
                  key={m.id}
                  className={`relative p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    hasUnread
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div
                    onClick={() => onSelectMatch(m)}
                    className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={resolvePhotoUrl(m.user.avatar_url || m.user.avatarUrl)}
                        alt={m.user.display_name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900" title="Mutual Friend">
                        <UserCheck className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {m.user.display_name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                          {m.stage === 'Friend' ? 'Mutual Friend' : m.stage}
                        </span>
                        {hasUnread && (
                          <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full animate-pulse">
                            {m.unread_count} new
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 shrink-0" />
                        <span>{m.user.college_name || 'Campus Student'}</span>
                        {m.user.course && <span>• {m.user.course}</span>}
                      </p>

                      {/* Mood Tag */}
                      {m.user.mood && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50">
                            <span>{(() => { const raw = typeof m.user.mood === 'object' ? m.user.mood.label : m.user.mood; const matched = MOOD_OPTIONS.find((opt) => opt.label.toLowerCase() === String(raw || '').toLowerCase() || opt.id.toLowerCase() === String(raw || '').toLowerCase()); return matched?.emoji || '✨'; })()}</span>
                            <span className="truncate max-w-[160px]">
                              {typeof m.user.mood === 'object' ? m.user.mood.label : m.user.mood}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Last message preview */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm mt-1">
                        {m.last_message ? (
                          m.last_message.message_type === 'voice' ? (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                              <Mic className="w-3.5 h-3.5" /> Voice message
                            </span>
                          ) : (
                            m.last_message.content
                          )
                        ) : (
                          <span className="italic text-rose-500">Mutual match active! Start talking freely...</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setPreviewProfile(m.user)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
                      title="View Profile Details"
                    >
                      <User className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectMatch(m)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    {/* Overflow menu for Unmatch / Block / Report */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuMatchId(isMenuOpen ? null : m.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-fade-in text-xs">
                          <button
                            onClick={() => {
                              setActiveMenuMatchId(null);
                              setConfirmUnmatchMatch(m);
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <UserX className="w-4 h-4 text-rose-500" />
                            <span>Unmatch Friend</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuMatchId(null);
                              setBlockTarget(m.user);
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4 text-rose-500" />
                            <span>Block Student</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuMatchId(null);
                              setReportTarget(m.user);
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Flag className="w-4 h-4 text-amber-500" />
                            <span>Report Profile</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Users2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Mutual Friends Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                When you accept an incoming request or someone accepts your like, they become your Mutual Friend and unlock private messaging!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('incoming')}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  View Who Liked You ({incomingLikes.length})
                </button>
                <button
                  onClick={() => navigateTo('discover')}
                  className="px-4 py-2.5 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all"
                >
                  Discover Peers
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 1: PROFILE DETAIL INSPECTION MODAL */}
      {/* ====================================================================== */}
      {previewProfile && (
        <ProfilePreviewModal
          profile={previewProfile}
          isOpen={Boolean(previewProfile)}
          onClose={() => setPreviewProfile(null)}
          onAccept={
            activeTab === 'incoming'
              ? (p) => {
                  const item = incomingLikes.find((i) => i.user.id === p.id);
                  if (item) handleAcceptLike(item);
                }
              : null
          }
          onReject={
            activeTab === 'incoming'
              ? (p) => {
                  const item = incomingLikes.find((i) => i.user.id === p.id);
                  if (item) handleRejectLike(item.id);
                }
              : null
          }
          onChat={
            activeTab === 'mutual'
              ? (p) => {
                  const m = matches.find((match) => match.user.id === p.id);
                  if (m) onSelectMatch(m);
                }
              : null
          }
        />
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: CONFIRM CANCEL SENT REQUEST */}
      {/* ====================================================================== */}
      {confirmCancelReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-1">
              Cancel Match Request?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to cancel your request to <strong>{confirmCancelReq.user?.display_name}</strong>? Your plan quota for sent requests will be refunded.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmCancelReq(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keep Request
              </button>
              <button
                onClick={() => {
                  handleCancelRequest(confirmCancelReq.id);
                  setConfirmCancelReq(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: CONFIRM UNMATCH */}
      {/* ====================================================================== */}
      {confirmUnmatchMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-1">
              Unmatch {confirmUnmatchMatch.user?.display_name}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Unmatching will permanently disable 1-on-1 chatting between you two and remove this connection from your Mutual Friends list.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmUnmatchMatch(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUnmatch(confirmUnmatchMatch.id);
                  setConfirmUnmatchMatch(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md"
              >
                Confirm Unmatch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatList;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { resolvePhotoUrl } from '../../services/api';
import { MOOD_OPTIONS } from '../../services/mockData';
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
  ShieldCheck
} from 'lucide-react';

export const ChatList = ({ onSelectMatch }) => {
  const {
    matches,
    incomingLikes,
    handleAcceptLike,
    handleRejectLike,
    currentPlanConfig,
    setIsPremiumModalOpen,
    currentUser,
    navigateTo
  } = useApp();

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'mutual'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = matches.filter((m) =>
    m.user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.user.college_name && m.user.college_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Matches & Connections
          </h2>
          <p className="text-xs text-slate-500">
            Accept incoming likes to become mutual friends and unlock private messaging.
          </p>
        </div>

        {/* Subscription Plan Quota Badge */}
        <button
          onClick={() => setIsPremiumModalOpen(true)}
          className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-left"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white">
              <span>{currentPlanConfig.name}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase">
                {currentUser.subscription_plan === 'free' ? 'Upgrade' : 'Active'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Matches: {matches.length}/{currentPlanConfig.max_mutual_matches === 9999 ? '∞' : currentPlanConfig.max_mutual_matches} • Sent: {currentUser.sent_requests_count}/{currentPlanConfig.max_sent_requests === 9999 ? '∞' : currentPlanConfig.max_sent_requests}
            </p>
          </div>
        </button>
      </div>

      {/* Tabs: "Who Liked You (Requests)" vs "Mutual Friends (Chats)" */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'incoming'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span>Who Liked You</span>
          {incomingLikes.length > 0 && (
            <span className="px-2 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full">
              {incomingLikes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mutual')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'mutual'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users2 className="w-4 h-4 text-emerald-500" />
          <span>Mutual Friends & Chats</span>
          {matches.length > 0 && (
            <span className="px-2 py-0.2 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full">
              {matches.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: WHO LIKED YOU (MATCH REQUESTS WITH ACCEPT / REJECT) */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex items-center justify-between text-xs text-rose-900 dark:text-rose-300">
            <span className="font-medium">
              Accepting someone makes them your <strong>Mutual Friend</strong> and unlocks private 1-on-1 chatting.
            </span>
            <span className="text-[11px] font-bold text-rose-600 shrink-0 ml-2">
              Free: 5 Max
            </span>
          </div>

          {incomingLikes.length > 0 ? (
            incomingLikes.map((likeItem) => (
              <div
                key={likeItem.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-rose-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={resolvePhotoUrl(likeItem.user.avatar_url || likeItem.user.avatarUrl)}
                      alt={likeItem.user.display_name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/20 shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {likeItem.user.display_name}, <span className="font-normal text-slate-500">{likeItem.user.age}</span>
                      </h4>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                        {likeItem.user.relationship_intention || 'Dating Connection'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                      {likeItem.user.college_name} • {likeItem.user.city}
                    </p>
                    {likeItem.user.bio && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-1 mt-1">
                        "{likeItem.user.bio}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Accept / Reject Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleRejectLike(likeItem.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                    title="Decline request"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleAcceptLike(likeItem)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white gradient-brand-bg shadow-md hover:brightness-105 active:scale-95 transition-all"
                    title="Accept to become mutual friends"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Accept (Mutual Friend)</span>
                  </button>
                </div>

              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Heart className="w-10 h-10 text-rose-300 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No Pending Likes Right Now
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Explore campus profiles in Discover to send match requests!
              </p>
              <button
                onClick={() => navigateTo('discover')}
                className="px-5 py-2.5 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow"
              >
                Go to Discover
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MUTUAL FRIENDS (CONVERSATIONS) */}
      {activeTab === 'mutual' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mutual friends by name..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            />
          </div>

          {filteredMatches.length > 0 ? (
            filteredMatches.map((m) => {
              const hasUnread = (m.unread_count || 0) > 0;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    hasUnread
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={resolvePhotoUrl(m.user.avatar_url || m.user.avatarUrl)}
                        alt={m.user.display_name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/30"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {m.user.display_name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                          {m.stage === 'Friend' ? 'Mutual Friend (Talking)' : m.stage}
                        </span>
                      </div>

                      {m.user.mood && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50">
                            <span>{(() => { const raw = typeof m.user.mood === 'object' ? m.user.mood.label : m.user.mood; const matched = MOOD_OPTIONS.find((opt) => opt.label.toLowerCase() === String(raw || '').toLowerCase() || opt.id.toLowerCase() === String(raw || '').toLowerCase()); return matched?.emoji || '✨'; })()}</span>
                            <span className="truncate max-w-[140px]">
                              {typeof m.user.mood === 'object' ? m.user.mood.label : m.user.mood}
                            </span>
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-xs mt-1">
                        {m.last_message ? (
                          m.last_message.message_type === 'voice' ? (
                            <span className="inline-flex items-center gap-1 text-rose-500">
                              <Mic className="w-3.5 h-3.5" /> Audio Note
                            </span>
                          ) : (
                            m.last_message.content
                          )
                        ) : (
                          <span className="italic text-rose-500">Mutual friend unlocked! Start chatting...</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMatch(m);
                      }}
                      className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Chat
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Users2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No Mutual Friends Yet
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Accept match requests under "Who Liked You" to become mutual friends and start talking!
              </p>
              <button
                onClick={() => setActiveTab('incoming')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                View Who Liked You
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ChatList;

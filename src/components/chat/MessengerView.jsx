import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import ChatRoom from './ChatRoom';
import {
  Search,
  MessageCircle,
  Users2,
  Heart,
  Zap,
  Mic,
  ShieldCheck,
  Lock,
  ArrowRight,
  Filter,
  CheckCheck
} from 'lucide-react';

export const MessengerView = () => {
  const {
    matches,
    activeChatMatch,
    setActiveChatMatch,
    navigateTo,
    currentUser,
    currentPlanConfig,
    setIsPremiumModalOpen
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All'); // 'All' | 'Friend' | 'Dating' | 'Relationship'

  const filteredMatches = matches.filter((m) => {
    const matchesSearch =
      m.user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user.college_name && m.user.college_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = stageFilter === 'All' ? true : (m.stage || 'Friend') === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-4 h-[calc(100dvh-4rem)] md:h-[calc(100vh-5rem)]">
      
      {/* 2-COLUMN MESSENGER CONTAINER */}
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-none md:rounded-3xl border-0 md:border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT COLUMN: LIST OF PERSONAL CHATS ONE BY ONE */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 ${
            activeChatMatch ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-rose-500" />
                  <span>Personal Chats</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  {matches.length} Mutual {matches.length === 1 ? 'Friend' : 'Friends'}
                </p>
              </div>

              {/* Plan match counter pill */}
              <button
                onClick={() => setIsPremiumModalOpen(true)}
                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 rounded-full text-[10px] font-bold text-rose-600 dark:text-rose-400"
              >
                {matches.length}/{currentPlanConfig.max_mutual_matches === 9999 ? '∞' : currentPlanConfig.max_mutual_matches} Mutual
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search personal chats..."
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Stage Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
              {['All', 'Friend', 'Dating', 'Relationship'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                    stageFilter === stage
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {stage === 'Friend' ? 'Friends (Talking)' : stage}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Chat List Items (One by one) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((m) => {
                const isSelected = activeChatMatch?.id === m.id;
                const hasUnread = (m.unread_count || 0) > 0;
                const currentStage = m.stage || 'Friend';

                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveChatMatch(m)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-l-4 border-rose-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={m.user.avatar_url}
                        alt={m.user.display_name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-xs"
                      />
                    </div>

                    {/* Chat preview details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {m.user.display_name}
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                              currentStage === 'Friend'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                                : currentStage === 'Dating'
                                ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200'
                                : 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200'
                            }`}
                          >
                            {currentStage === 'Friend' ? 'Friend' : currentStage}
                          </span>
                        </div>

                        {m.last_message && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(m.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <p className={`truncate max-w-[190px] ${hasUnread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                          {m.last_message ? (
                            m.last_message.message_type === 'voice' ? (
                              <span className="inline-flex items-center gap-1 text-rose-500">
                                <Mic className="w-3 h-3" /> Audio Note
                              </span>
                            ) : (
                              m.last_message.content
                            )
                          ) : (
                            <span className="italic text-rose-500">New mutual friend! Say hi...</span>
                          )}
                        </p>

                        {hasUnread && (
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-500 text-white rounded-full">
                            {m.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <Users2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  No mutual chats found
                </p>
                <p className="text-[11px] text-slate-400 mb-4">
                  Accept pending likes under Matches to unlock personal chats!
                </p>
                <button
                  onClick={() => navigateTo('matches')}
                  className="px-4 py-1.5 gradient-brand-bg text-white rounded-xl font-bold shadow-xs"
                >
                  View Match Requests
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE PERSONAL CHAT ROOM OR PLACEHOLDER */}
        <div
          className={`flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 ${
            activeChatMatch ? 'fixed inset-0 z-50 md:static md:inset-auto md:z-auto flex' : 'hidden md:flex'
          }`}
        >
          {activeChatMatch ? (
            <ChatRoom match={activeChatMatch} onBack={() => setActiveChatMatch(null)} />
          ) : (
            /* Empty selection state on desktop */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle className="w-10 h-10" />
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">
                Personal Campus Chats
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                When you both accept each other, you become Mutual Friends and can chat one-on-one here. Use the <strong>"GO" button</strong> inside each conversation to transition to Dating!
              </p>

              {matches.length > 0 && (
                <button
                  onClick={() => setActiveChatMatch(matches[0])}
                  className="px-6 py-3 gradient-brand-bg text-white text-xs font-bold rounded-2xl shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Chat with {matches[0].user.display_name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default MessengerView;

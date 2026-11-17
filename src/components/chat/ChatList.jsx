import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Heart, MessageCircle, Mic, Sparkles } from 'lucide-react';

export const ChatList = ({ onSelectMatch }) => {
  const { matches, navigateTo } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = matches.filter((m) =>
    m.user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.user.college_name && m.user.college_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Conversations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Private chats with your mutual campus matches
          </p>
        </div>
        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full border border-rose-200/50">
          {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search matches by name or college..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
        />
      </div>

      {/* Horizontal Story-style Matches Strip */}
      {matches.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            New Mutual Matches
          </p>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 group-hover:scale-105 transition-transform">
                  <img
                    src={m.user.avatar_url}
                    alt={m.user.display_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                  {m.user.active_now && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 max-w-[64px] truncate">
                  {m.user.display_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Thread List */}
      <div className="space-y-2">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((m) => {
            const hasUnread = (m.unread_count || 0) > 0;
            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all ${
                  hasUnread
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={m.user.avatar_url}
                    alt={m.user.display_name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/20"
                  />
                  {m.user.active_now && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {m.user.display_name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {m.relationship_stage || 'Matched'}
                      </span>
                    </div>
                    {m.last_message && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <p className={`truncate max-w-[240px] sm:max-w-xs ${hasUnread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {m.last_message ? (
                        m.last_message.message_type === 'voice' ? (
                          <span className="inline-flex items-center gap-1 text-rose-500">
                            <Mic className="w-3.5 h-3.5" /> Audio Note
                          </span>
                        ) : (
                          m.last_message.content
                        )
                      ) : (
                        <span className="italic text-rose-500">Start the conversation! ✨</span>
                      )}
                    </p>

                    {hasUnread && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shrink-0">
                        {m.unread_count}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No chats found</h4>
            <p className="text-xs text-slate-500 mb-4">Discover new college peers and like their profiles to start chatting!</p>
            <button
              onClick={() => navigateTo('discover')}
              className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-semibold shadow"
            >
              Start Discovering
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatList;

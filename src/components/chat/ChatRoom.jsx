import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';
import {
  Send,
  Mic,
  Smile,
  MoreVertical,
  Flag,
  Ban,
  Gamepad2,
  Heart,
  Users2,
  Trash2,
  ArrowLeft,
  Check,
  CheckCheck,
  Sparkles,
  Info
} from 'lucide-react';

export const ChatRoom = ({ match, onBack }) => {
  const {
    currentUser,
    conversations,
    sendMessage,
    handleAddReaction,
    handleDeleteMessage,
    setReportTarget,
    setBlockTarget,
    sendRelationshipRequest,
    relationshipRequests,
    activeRelationship,
    confirmMutualRelationship,
    navigateTo,
    addToast
  } = useApp();

  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const thread = conversations[match.id] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.length]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    sendMessage(match.id, {
      message_type: 'text',
      content: textInput.trim()
    });
    setTextInput('');
    setShowEmojiPicker(false);
  };

  const handleSendVoice = (voicePayload) => {
    sendMessage(match.id, voicePayload);
    setIsRecording(false);
  };

  const emojiList = ['❤️', '😂', '🔥', '✨', '👏', '😍', '☕', '🎸', '💯', '🌸', '⚡', '🙌'];

  // Check relationship request status for this match
  const activeReq = relationshipRequests.find(
    (r) => r.matchId === match.id && (r.status === 'pending' || r.status === 'mutual_accepted')
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[680px] w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={match.user.avatar_url}
              alt={match.user.display_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/30"
            />
            {match.user.active_now && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {match.user.display_name}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/40">
                {match.relationship_stage || 'Matched'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[180px] sm:max-w-xs">
              {match.user.college_name || match.user.city}
            </p>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex items-center gap-1.5">
          {/* Quick Play Conversation Game button */}
          <button
            onClick={() => navigateTo('games')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 rounded-full text-xs font-semibold transition-colors"
            title="Launch Conversation Games"
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline">Play Game</span>
          </button>

          {/* Relationship Request Button (PRD 4.9) */}
          <button
            onClick={() => sendRelationshipRequest(match.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 gradient-brand-bg text-white rounded-full text-xs font-semibold shadow-sm hover:brightness-105 transition-all"
            title="Express Relationship Intention"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">Relationship</span>
          </button>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-1 z-30 animate-slide-up">
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setReportTarget({ user: match.user });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Flag className="w-3.5 h-3.5" /> Report User
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setBlockTarget(match.user);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Ban className="w-3.5 h-3.5" /> Block & Unmatch
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mutual Relationship Request Banner if Pending / Mutual */}
      {activeReq && (
        <div className="p-3 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border-b border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs animate-slide-up">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>
              {activeReq.status === 'mutual_accepted'
                ? `${match.user.display_name} reciprocated! Confirm relationship status:`
                : 'Mutual relationship request sent. Waiting for partner confirmation.'}
            </span>
          </div>
          {activeReq.status === 'mutual_accepted' && (
            <button
              onClick={() => confirmMutualRelationship(match.id)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold shadow-sm"
            >
              Confirm Official Status ❤️
            </button>
          )}
        </div>
      )}

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.map((msg) => {
          const isMe = msg.sender_id === currentUser.id;
          const isSystem = msg.message_type === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-4">
                <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="relative flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
                
                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-3xl shadow-sm text-xs leading-relaxed ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.message_type === 'voice' ? (
                    <VoicePlayer duration={msg.duration_seconds || 24} isSender={isMe} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Timestamp & Read Receipt */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                      isMe ? 'text-rose-200' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>

                {/* Quick Reaction Pill Bar (on hover) */}
                {hoveredMessageId === msg.id && (
                  <div className="absolute -top-7 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-0.5 z-20 animate-fade-in">
                    {['❤️', '😂', '🔥', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(match.id, msg.id, emoji)}
                        className="hover:scale-125 text-xs transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(match.id, msg.id)}
                        className="ml-1 text-slate-400 hover:text-rose-500"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Message Reactions */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex gap-1 mt-1 px-1">
                  {msg.reactions.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                    >
                      {r.reaction}
                    </span>
                  ))}
                </div>
              )}

            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recorder or Standard Input Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
        
        {isRecording ? (
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <div>
            {/* Emoji picker dropdown */}
            {showEmojiPicker && (
              <div className="p-2 mb-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 animate-slide-up">
                {emojiList.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setTextInput((prev) => prev + em);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Insert emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Message ${match.user.display_name}...`}
                className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              {textInput.trim() ? (
                <button
                  type="submit"
                  className="p-3 gradient-brand-bg text-white rounded-2xl shadow-md hover:brightness-105 active:scale-95 transition-all"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-2xl shadow-sm transition-colors"
                  title="Record Voice Note (60s max)"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        )}

      </div>

    </div>
  );
};

export default ChatRoom;

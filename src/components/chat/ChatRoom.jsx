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
  Zap,
  Clock,
  ThumbsDown,
  Coffee,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  MessageSquare,
  Activity,
  Info,
  MapPin,
  GraduationCap
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
    handleSendGoRequest,
    handleRespondToGoRequest,
    navigateTo,
    addToast
  } = useApp();

  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showGoModal, setShowGoModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refusalReason, setRefusalReason] = useState('I really value our friendship and want to take things slower.');
  const [customRefusalText, setCustomRefusalText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const thread = conversations[match.id] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.length, isPartnerTyping]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const messageContent = textInput.trim();
    sendMessage(match.id, {
      message_type: 'text',
      content: messageContent
    });
    setTextInput('');
    setShowEmojiPicker(false);

    // Simulate partner typing indicator before reply
    setTimeout(() => {
      setIsPartnerTyping(true);
      setTimeout(() => {
        setIsPartnerTyping(false);
      }, 1500);
    }, 600);
  };

  const handleSendVoice = (voicePayload) => {
    sendMessage(match.id, voicePayload);
    setIsRecording(false);
  };

  const emojiList = ['❤️', '😂', '🔥', '✨', '👏', '😍', '☕', '🎸', '💯', '🌸', '⚡', '🙌', '🎉', '🤝', '😉'];

  const currentStage = match.stage || 'Friend';
  const hasPendingGoRequest = Boolean(match.go_request);
  const isIncomingGoRequest = match.go_request && match.go_request.from !== currentUser.id;
  const isOutgoingGoRequest = match.go_request && match.go_request.from === currentUser.id;

  const icebreakerPrompts = [
    '☕ How is the campus canteen chai today?',
    '🎸 What song are you listening to right now?',
    '🎭 Want to play a quick round of Truth or Dare?'
  ];

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* 1. NATIVE MESSENGER TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md z-20 shadow-xs shrink-0">
        
        {/* Left: Back button & Partner Info (ONLY Name & Mood, Click to view full About profile) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              title="Back to Chats list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Clickable Name & Avatar -> Opens About Person modal */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 active:scale-98 transition-all group focus:outline-none"
            title={`Click to view about ${match.user.display_name}`}
          >
            <div className="relative shrink-0">
              <img
                src={match.user.avatar_url}
                alt={match.user.display_name}
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-xs group-hover:ring-rose-500 transition-all"
              />
            </div>

            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-none truncate max-w-[120px] sm:max-w-xs group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {match.user.display_name}
              </h3>

              {/* Partner's live Mood badge */}
              {match.user.mood && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 shrink-0 shadow-2xs"
                  title={`${match.user.display_name}'s current campus mood`}
                >
                  <span>{typeof match.user.mood === 'object' ? match.user.mood.emoji : '✨'}</span>
                  <span className="truncate max-w-[140px]">
                    {typeof match.user.mood === 'object' ? match.user.mood.label : match.user.mood}
                  </span>
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Right: Stage Trigger & Controls */}
        <div className="flex items-center gap-1.5">
          
          {/* THE "GO" BUTTON (Transition from Talking as Friend to Dating Stage) */}
          {currentStage === 'Friend' && (
            <button
              onClick={() => setShowGoModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-white rounded-full text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition-all animate-pulse-slow"
              title="Click 'GO' to advance from Friend to Dating stage"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>GO<span className="hidden sm:inline"> to Dating</span></span>
            </button>
          )}

          {currentStage === 'Dating' && (
            <button
              onClick={() => handleSendGoRequest(match.id, 'Relationship')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-xs font-black shadow-md hover:brightness-110"
              title="Confirm mutual Relationship stage"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span><span className="hidden sm:inline">GO </span>Relationship</span>
            </button>
          )}

          {/* Quick Games trigger */}
          <button
            onClick={() => navigateTo('games')}
            className="p-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-full transition-colors"
            title="Launch 6 Conversation Games"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* More options menu (Under the 3 dots) */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="More conversation options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 z-30 animate-slide-up text-xs">
                {/* 1. TRACK CONNECTION STATUS SECTION */}
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowTrackModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold"
                >
                  <Activity className="w-3.5 h-3.5" /> Track Connection Status
                </button>

                {/* 2. ABOUT PERSON */}
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowAboutModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  <Info className="w-3.5 h-3.5 text-blue-500" /> About {match.user.display_name}
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setReportTarget({ user: match.user });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Conversation
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setBlockTarget(match.user);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Ban className="w-3.5 h-3.5" /> Block & Unmatch
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 2. MESSAGE FEED AREA (LOOK LIKE REAL MESSENGER FEATURE) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/60">
        
        {/* End-to-end privacy notice */}
        <div className="text-center my-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-900/80 text-slate-500 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Private 1-on-1 personal chat • No video calls for safety</span>
          </span>
        </div>

        {thread.map((msg) => {
          const isMe = msg.sender_id === currentUser.id;
          const isSystem = msg.message_type === 'system';
          const isGoRequest = msg.message_type === 'go_request';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-4 animate-fade-in">
                <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium bg-rose-50/90 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 shadow-2xs max-w-md">
                  {msg.content}
                </span>
              </div>
            );
          }

          if (isGoRequest) {
            const isPending = msg.go_status === 'pending';
            const isAccepted = msg.go_status === 'accepted';
            const isRefused = msg.go_status === 'refused';
            const isSenderMe = msg.sender_id === currentUser.id;

            return (
              <div key={msg.id} className="my-3 flex justify-center animate-slide-up">
                <div className="w-full max-w-sm p-4 rounded-3xl bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-orange-500/10 dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900 border-2 border-rose-300/80 dark:border-rose-900/60 shadow-md text-center">
                  <div className="w-10 h-10 rounded-2xl gradient-brand-bg text-white flex items-center justify-center mx-auto mb-2 shadow-sm animate-bounce-soft">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                    Stage Transition Proposal: Friendship ➔ {msg.target_stage || 'Dating'}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3">
                    {msg.content}
                  </p>

                  {/* Actions when proposal is pending */}
                  {isPending && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRespondToGoRequest(match.id, 'accept')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          <span>Accept ({msg.target_stage || 'Dating'})</span>
                        </button>
                        <button
                          onClick={() => setShowRefuseModal(true)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Refuse</span>
                        </button>
                      </div>
                      {isSenderMe && (
                        <p className="text-[10px] text-slate-400">
                          (Waiting for {match.user.display_name} to respond. You can test either option above!)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Accepted Badge */}
                  {isAccepted && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Accepted! Transitioned to Dating Stage ❤️</span>
                    </div>
                  )}

                  {/* Refused Badge */}
                  {isRefused && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Refused • Staying as Mutual Friends 🤝</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              <div className="relative flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
                
                {/* Real Messenger Message Bubble */}
                <div
                  className={`p-3.5 shadow-sm text-xs leading-relaxed transition-all ${
                    isMe
                      ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white rounded-2xl rounded-br-xs shadow-rose-600/10'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-xs border border-slate-200/70 dark:border-slate-800 shadow-slate-900/5'
                  }`}
                >
                  {msg.message_type === 'voice' ? (
                    <VoicePlayer duration={msg.duration_seconds || 24} isSender={isMe} />
                  ) : (
                    <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                  )}

                  {/* Timestamp & Real Messenger Double Checks */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-medium ${
                      isMe ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-rose-200" />}
                  </div>
                </div>

                {/* Floating Reaction Pill Bar (on hover) */}
                {hoveredMessageId === msg.id && (
                  <div className="absolute -top-7 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-full px-2 py-0.5 z-20 animate-fade-in">
                    {['❤️', '😂', '🔥', '👏', '😮'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(match.id, msg.id, emoji)}
                        className="hover:scale-125 text-xs transition-transform p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(match.id, msg.id)}
                        className="ml-1 text-slate-400 hover:text-rose-500 p-0.5"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Message Reactions attached to bubble bottom */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex gap-1 mt-1 px-1">
                  {msg.reactions.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                      {r.reaction}
                    </span>
                  ))}
                </div>
              )}

            </div>
          );
        })}

        {/* Typing Indicator Bubble */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 animate-fade-in">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl rounded-bl-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {match.user.display_name} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Icebreaker Suggestion Chips */}
      {thread.length <= 4 && (
        <div className="px-4 py-2 bg-white/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Icebreakers:
          </span>
          {icebreakerPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setTextInput(prompt)}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-200/50 dark:border-slate-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* 4. COMPOSER / INPUT BAR */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        
        {isRecording ? (
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <div>
            {/* Emoji picker popup */}
            {showEmojiPicker && (
              <div className="p-2 mb-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 animate-slide-up shadow-xl">
                {emojiList.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setTextInput((prev) => prev + em);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg hover:scale-125 transition-transform p-1"
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
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Insert emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Message ${match.user.display_name}...`}
                className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
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
                  className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-2xl shadow-xs transition-colors"
                  title="Record Voice Note (60s max)"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        )}

      </div>

      {/* "GO" MODAL (Send stage progression request) */}
      {showGoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-200 dark:border-rose-900 animate-slide-up">
            <div className="w-14 h-14 rounded-2xl gradient-brand-bg text-white flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce-soft">
              <Zap className="w-7 h-7 fill-white" />
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
              Ready to "GO" to Dating Stage?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              You both started as mutual friends. Clicking <strong>GO</strong> sends an invitation to {match.user.display_name} to explore the Dating stage together. They can Accept, or Refuse with an explanation sent via chat.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowGoModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowGoModal(false);
                  handleSendGoRequest(match.id, 'Dating');
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white gradient-brand-bg rounded-xl shadow"
              >
                Send "GO" Request 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. ABOUT PERSON MODAL (Shown when clicking name/avatar in header) */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up max-h-[90vh] flex flex-col">
            {/* Header image banner */}
            <div className="relative h-44 w-full bg-slate-800 shrink-0">
              <img
                src={match.user.avatar_url}
                alt={match.user.display_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <button
                onClick={() => setShowAboutModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-display">{match.user.display_name}, {match.user.age}</h3>
                  {match.user.verification_status && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white">
                      <ShieldCheck className="w-3 h-3" />
                      {match.user.verification_status}
                    </span>
                  )}
                </div>
                {match.user.mood && (
                  <p className="text-xs text-rose-300 font-medium flex items-center gap-1 mt-0.5">
                    <span>{typeof match.user.mood === 'object' ? match.user.mood.emoji : '✨'}</span>
                    <span>{typeof match.user.mood === 'object' ? match.user.mood.label : match.user.mood}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Intention Pill */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 uppercase tracking-wide">
                  {match.user.relationship_intention || 'Dating Connection'}
                </span>
              </div>

              {/* College & Location */}
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {match.user.college_name && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{match.user.college_name} {match.user.course ? `• ${match.user.course}` : ''}</span>
                  </div>
                )}
                {match.user.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{match.user.city}{match.user.state ? `, ${match.user.state}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {match.user.bio && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed italic">
                    "{match.user.bio}"
                  </p>
                </div>
              )}

              {/* Interests */}
              {match.user.interests && match.user.interests.length > 0 && (
                <div>
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">Interests</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {match.user.interests.map((int) => (
                      <span
                        key={int}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRACK CONNECTION STATUS MODAL (Under the 3-dot menu) */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Track Connection Status</h3>
                  <p className="text-[10px] text-slate-500">With {match.user.display_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrackModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* CURRENT STATUS */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40">
                <p className="text-[10px] uppercase font-bold tracking-wider text-rose-500 mb-1">Current Status</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {currentStage === 'Friend' ? 'Mutual Friend (Talking)' : (currentStage === 'Dating' ? 'Dating Stage 🌹' : 'Committed Relationship ❤️')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {currentStage === 'Friend'
                    ? 'You are currently mutual friends talking casually with zero relationship pressure.'
                    : currentStage === 'Dating'
                    ? 'You both mutually agreed via the "GO" button to explore dating.'
                    : 'You both confirmed a serious committed relationship!'}
                </p>
              </div>

              {/* WHICH TYPE OF RELATIONSHIP */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Which Type of Relationship</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {match.user.relationship_intention || 'Dating Connection'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Both partners can update or transition stage at any time without pressure.
                </p>
              </div>

              {/* 3-STAGE PROGRESS TIMELINE */}
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Connection Journey Stages</p>
                <div className="space-y-2">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${currentStage === 'Friend' ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span className="font-bold">1. Mutual Friend (Talking)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Unlocked</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${currentStage === 'Dating' ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="font-bold">2. Dating Stage</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Via "GO" Button</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${currentStage === 'Relationship' ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="font-bold">3. Serious Relationship</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Mutual confirmation</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              {currentStage === 'Friend' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={() => {
                      setShowTrackModal(false);
                      handleSendGoRequest(match.id, 'Dating');
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white gradient-brand-bg shadow flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Send "GO to Dating" Request</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowTrackModal(false);
                      handleSendGoRequest(match.id, 'Dating', match.user.id);
                    }}
                    className="w-full py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-center"
                  >
                    Simulate {match.user.display_name} sending GO Request (Demo Test)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. REFUSE GO REQUEST WITH EXPLANATION MODAL (Explanation sent via chat per requirement) */}
      {showRefuseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Refuse Stage Transition</h3>
                  <p className="text-[10px] text-slate-500">Stay as mutual friends</p>
                </div>
              </div>
              <button
                onClick={() => setShowRefuseModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Let {match.user.display_name} know why you'd like to stay as friends. <strong>This explanation will be sent directly via chat:</strong>
            </p>

            {/* Quick Reason Options */}
            <div className="space-y-1.5 mb-3">
              {[
                'I really value our friendship and want to take things slower.',
                'I think we are great as friends right now.',
                'Not looking for dating at the moment, but enjoy chatting with you!',
                'Let’s get to know each other a bit more first.'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setRefusalReason(reason);
                    setCustomRefusalText('');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs border transition-all ${
                    refusalReason === reason && !customRefusalText
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Custom explanation text */}
            <div className="mb-4">
              <input
                type="text"
                value={customRefusalText}
                onChange={(e) => {
                  setCustomRefusalText(e.target.value);
                  setRefusalReason(e.target.value);
                }}
                placeholder="Or write custom explanation..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRefuseModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalExplanation = (customRefusalText.trim() || refusalReason).trim();
                  handleRespondToGoRequest(match.id, 'refuse', finalExplanation);
                  setShowRefuseModal(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white gradient-brand-bg rounded-xl shadow active:scale-95 transition-all"
              >
                Send via Chat 💬
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatRoom;

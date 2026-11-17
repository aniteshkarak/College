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
  MessageSquare
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
  const [isGoJourneyExpanded, setIsGoJourneyExpanded] = useState(true);
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
        
        {/* Left: Back button & Partner Info (No online/last-seen per requirement) */}
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

          <div className="relative shrink-0">
            <img
              src={match.user.avatar_url}
              alt={match.user.display_name}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-xs"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-none truncate max-w-[110px] sm:max-w-xs">
                {match.user.display_name}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 shrink-0">
                {currentStage === 'Friend' ? 'Mutual Friend' : `${currentStage}`}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate max-w-[130px] sm:max-w-xs">
              {match.user.college_name || match.user.city}
            </p>
          </div>
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

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 z-30 animate-slide-up text-xs">
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

      {/* 2. THE DEDICATED "GO SECTION" & STAGE JOURNEY (Expandable Roadmap) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-xs shadow-2xs z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5 fill-amber-500" />
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Connection Journey:
            </span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              Stage {currentStage === 'Friend' ? '1: Mutual Friend (Talking)' : (currentStage === 'Dating' ? '2: Dating' : '3: Relationship')}
            </span>
          </div>

          <button
            onClick={() => setIsGoJourneyExpanded(!isGoJourneyExpanded)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
          >
            <span>{isGoJourneyExpanded ? 'Hide' : 'Show Roadmap'}</span>
            {isGoJourneyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable 3-Stage Progress Timeline */}
        {isGoJourneyExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center animate-slide-up">
            
            {/* Step 1: Mutual Friend */}
            <div className={`p-2 rounded-xl border text-[11px] ${
              currentStage === 'Friend'
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span>1. Friend (Talking)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-normal">Active mutual chat</p>
            </div>

            {/* Step 2: Dating */}
            <div className={`p-2 rounded-xl border text-[11px] ${
              currentStage === 'Dating'
                ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold text-rose-700 dark:text-rose-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>2. Dating Stage</span>
              </div>
              <p className="text-[10px] text-slate-400 font-normal">Via "GO" Button</p>
            </div>

            {/* Step 3: Relationship */}
            <div className={`p-2 rounded-xl border text-[11px] ${
              currentStage === 'Relationship'
                ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 font-bold text-purple-700 dark:text-purple-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Heart className="w-3 h-3 text-rose-500" />
                <span>3. Relationship</span>
              </div>
              <p className="text-[10px] text-slate-400 font-normal">Mutual confirmation</p>
            </div>

          </div>
        )}
      </div>

      {/* OUTGOING "GO" REQUEST STATUS BANNER */}
      {isOutgoingGoRequest && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs animate-slide-up">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-medium">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            <span>
              You clicked <strong>"GO"</strong> to transition to Dating! Waiting for {match.user.display_name} to respond...
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-full">
            Pending Response
          </span>
        </div>
      )}

      {/* INCOMING "GO" REQUEST REACTION BANNER (THE 4 EXACT CHOICES) */}
      {isIncomingGoRequest && (
        <div className="p-4 bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-purple-500/15 border-b border-rose-300 dark:border-rose-900/60 shadow-inner animate-slide-up">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {match.user.display_name} clicked "GO" and wants to transition from Friend to Dating stage!
            </h4>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3">
            Select how you would like to react:
          </p>

          {/* THE 4 REQUIRED BUTTONS:
              1. Accept
              2. Reject
              3. Sometimes later
              4. We are good as a friend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleRespondToGoRequest(match.id, 'accept')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Accept (Date)</span>
            </button>

            <button
              onClick={() => handleRespondToGoRequest(match.id, 'reject')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => handleRespondToGoRequest(match.id, 'sometimes_later')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-900 flex items-center justify-center gap-1.5 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sometimes later</span>
            </button>

            <button
              onClick={() => handleRespondToGoRequest(match.id, 'we_are_good_as_a_friend')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900 flex items-center justify-center gap-1.5 transition-all"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Good as a friend</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MESSAGE FEED AREA (LOOK LIKE REAL MESSENGER FEATURE) */}
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

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-4 animate-fade-in">
                <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium bg-rose-50/90 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 shadow-2xs max-w-md">
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
              You both started as mutual friends. Clicking <strong>GO</strong> sends an invitation to {match.user.display_name} to explore the Dating stage together. They can Accept, Reject, Decide Later, or stay Friends.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowGoModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
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

    </div>
  );
};

export default ChatRoom;

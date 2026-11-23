import React from 'react';
import { useApp } from '../../context/AppContext';
import { resolvePhotoUrl } from '../../services/api';
import { Heart, MessageCircle, Gamepad2, X, Sparkles } from 'lucide-react';

export const MatchCelebrationModal = () => {
  const {
    matchedCelebrationUser,
    setMatchedCelebrationUser,
    currentUser,
    matches,
    setActiveChatMatch,
    navigateTo
  } = useApp();

  if (!matchedCelebrationUser) return null;

  const handleStartChat = () => {
    const match = matches.find((m) => m.user.id === matchedCelebrationUser.id);
    if (match) {
      setActiveChatMatch(match);
      setMatchedCelebrationUser(null);
      navigateTo('chats');
    }
  };

  const handlePlayGame = () => {
    const match = matches.find((m) => m.user.id === matchedCelebrationUser.id);
    if (match) {
      setActiveChatMatch(match);
      setMatchedCelebrationUser(null);
      navigateTo('games');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-8 text-center shadow-2xl border border-rose-500/30 relative overflow-hidden animate-slide-up max-h-[90dvh] overflow-y-auto">
        
        {/* Glow circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => setMatchedCelebrationUser(null)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" /> It's a Mutual Match!
        </div>

        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2">
          You & {matchedCelebrationUser.display_name}
        </h2>
        <p className="text-xs text-slate-300 mb-8 max-w-xs mx-auto">
          You both liked each other! There is zero pressure to rush into anything—start with a casual conversation.
        </p>

        {/* Dual Avatars */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="relative">
            <img
              src={resolvePhotoUrl(currentUser.avatar_url || currentUser.avatarUrl)}
              alt={currentUser.display_name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-rose-500/40 shadow-xl"
            />
            <span className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-slate-900 rounded-full text-[9px] font-bold border border-slate-700">
              You
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center text-white shadow-lg animate-bounce-soft">
            <Heart className="w-5 h-5 fill-white" />
          </div>

          <div className="relative">
            <img
              src={resolvePhotoUrl(matchedCelebrationUser.avatar_url || matchedCelebrationUser.avatarUrl)}
              alt={matchedCelebrationUser.display_name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-rose-500/40 shadow-xl"
            />
            <span className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-slate-900 rounded-full text-[9px] font-bold border border-slate-700">
              {matchedCelebrationUser.display_name}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleStartChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> Send First Message
          </button>

          <button
            onClick={handlePlayGame}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            <Gamepad2 className="w-4 h-4 text-rose-400" /> Play Conversation Game
          </button>

          <button
            onClick={() => setMatchedCelebrationUser(null)}
            className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Keep Exploring Profiles
          </button>
        </div>

      </div>
    </div>
  );
};

export default MatchCelebrationModal;

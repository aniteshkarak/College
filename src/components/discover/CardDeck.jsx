import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import ProfileCard from './ProfileCard';
import FilterModal from './FilterModal';
import { SlidersHorizontal, RefreshCw, Sparkles, MapPin, Heart, Send } from 'lucide-react';

export const CardDeck = () => {
  const {
    profiles,
    handleSendMatchRequest,
    handlePass,
    discoveryFilters,
    discoveryCycleInfo,
    isDiscoveryLoading,
    refreshDiscoveryProfiles,
    resetDiscoveryCycle,
    currentUser,
    currentPlanConfig,
    setIsPremiumModalOpen,
    navigateTo
  } = useApp();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Apply filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Age filter
      if (p.age < discoveryFilters.minAge || p.age > discoveryFilters.maxAge) return false;
      // Gender filter
      if (discoveryFilters.gender !== 'All' && p.gender !== discoveryFilters.gender) return false;
      // City filter
      if (discoveryFilters.city !== 'All' && p.city !== discoveryFilters.city) return false;
      // Intention filter
      if (discoveryFilters.intention !== 'All' && p.relationship_intention !== discoveryFilters.intention) return false;
      // Interests filter
      if (discoveryFilters.selectedInterests.length > 0) {
        const hasMatchingInterest = discoveryFilters.selectedInterests.some((int) =>
          (p.interests || []).includes(int)
        );
        if (!hasMatchingInterest) return false;
      }
      return true;
    });
  }, [profiles, discoveryFilters]);

  const currentCard = filteredProfiles[0];

  return (
    <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-2 sm:py-6">
      
      {/* Top Filter & Limit Status Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400">
            <Sparkles className="w-3.5 h-3.5" />
            {filteredProfiles.length} Profiles
          </span>

          {/* Discovery Cycle Badge */}
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Cycle #{discoveryCycleInfo?.currentCycleId || 1}
          </span>

          {/* Sent Request Quota Indicator */}
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-300"
            title="Click to upgrade request limit"
          >
            <Send className="w-3 h-3 text-amber-500" />
            <span>
              {currentUser.sent_requests_count}/{currentPlanConfig.max_sent_requests === 9999 ? '∞' : currentPlanConfig.max_sent_requests} Sent
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Feed */}
          <button
            onClick={() => refreshDiscoveryProfiles?.()}
            disabled={isDiscoveryLoading}
            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 rounded-full text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${isDiscoveryLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Profile Card Deck */}
      {currentCard ? (
        <div className="relative">
          <ProfileCard
            key={currentCard.id}
            profile={currentCard}
            onLike={handleSendMatchRequest}
            onPass={handlePass}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="w-full max-w-sm mx-auto h-[550px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center mb-4 shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
            You're All Caught Up!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-xs">
            You've explored all active profiles matching your current filters. Check "Who Liked You" to accept incoming requests!
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              onClick={() => resetDiscoveryCycle?.()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white gradient-brand-bg shadow-md hover:brightness-105 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start New Discovery Cycle
            </button>
            <button
              onClick={() => navigateTo('matches')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              Check Incoming Likes
            </button>
            <button
              onClick={() => navigateTo('campus-board')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
            >
              View Campus Board
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
};

export default CardDeck;

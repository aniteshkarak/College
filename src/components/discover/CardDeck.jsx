import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import ProfileCard from './ProfileCard';
import FilterModal from './FilterModal';
import { SlidersHorizontal, RefreshCw, Sparkles, MapPin, Heart } from 'lucide-react';

export const CardDeck = () => {
  const {
    profiles,
    handleLike,
    handlePass,
    discoveryFilters,
    currentUser,
    setProfiles,
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
    <div className="w-full max-w-md mx-auto px-4 py-4 sm:py-6">
      
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400">
            <Sparkles className="w-3.5 h-3.5" />
            {filteredProfiles.length} eligible {filteredProfiles.length === 1 ? 'person' : 'people'}
          </span>
          {discoveryFilters.city !== 'All' && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-rose-500" /> {discoveryFilters.city}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
          <span>Filters</span>
        </button>
      </div>

      {/* Profile Card Deck */}
      {currentCard ? (
        <div className="relative">
          <ProfileCard
            key={currentCard.id}
            profile={currentCard}
            onLike={handleLike}
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
            You've explored all active profiles matching your current filters in {discoveryFilters.city === 'All' ? 'your area' : discoveryFilters.city}. Check back soon or broaden your search!
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white gradient-brand-bg shadow-md hover:brightness-105 transition-all"
            >
              Adjust Discovery Filters
            </button>
            <button
              onClick={() => navigateTo('games')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              Play Conversation Games
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

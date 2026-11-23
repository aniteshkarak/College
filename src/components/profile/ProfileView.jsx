import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api, resolvePhotoUrl } from '../../services/api';
import { MOOD_OPTIONS } from '../../services/mockData';
import { MoodPickerModal } from '../daily/MoodPickerModal';
import {
  MapPin,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Edit3,
  Calendar,
  Languages,
  Heart,
  Crown
} from 'lucide-react';

export const ProfileView = () => {
  const {
    currentUser,
    setCurrentUser,
    navigateTo,
    activeRelationship,
    setIsPremiumModalOpen,
    currentPlanConfig,
    matches,
    currentMood
  } = useApp();

  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  // Whenever student opens their profile, refresh latest mood and profile from PostgreSQL
  useEffect(() => {
    if (typeof api?.auth?.getMe === 'function') {
      api.auth.getMe()
        .then((res) => {
          if (res && res.data) {
            const userObj = res.data.user || res.data;
            if (userObj) {
              setCurrentUser(userObj);
            }
          }
        })
        .catch((err) => console.warn('Could not refresh profile on open:', err.message));
    }
  }, []);

  // Safe Guard: If currentUser is loading or not yet available, show a clean skeleton loader instead of white screen
  if (!currentUser) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="inline-block p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 animate-spin mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  // Safe Fallbacks for Plan & Matches
  const planConfig = currentPlanConfig || {
    name: 'Free Plan',
    period: 'Always Free',
    max_mutual_matches: 5,
    max_sent_requests: 50,
  };
  const matchesList = Array.isArray(matches) ? matches : [];

  // Extract all photos (Photo 1 / Main Avatar + Photo 2 + Photo 3)
  const allUserPhotos = (
    currentUser?.photos && currentUser.photos.length > 0
      ? currentUser.photos.map((p) => (typeof p === 'string' ? p : (p?.url || p?.photoUrl)))
      : [
          currentUser?.avatar_url || currentUser?.avatarUrl,
          ...(currentUser?.additional_photos || currentUser?.additionalPhotos || [])
        ]
  ).filter(Boolean);

  const resolvedAvatar = resolvePhotoUrl(
    currentUser?.avatar_url || currentUser?.avatarUrl || allUserPhotos[0]
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      
      {/* Top Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          {/* Avatar with status badges */}
          <div className="relative shrink-0">
            <img
              src={resolvedAvatar}
              alt={currentUser?.display_name || currentUser?.displayName || 'My Profile'}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-rose-500/30 shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
              }}
            />
            <span className="absolute bottom-1 right-1 p-1 bg-white dark:bg-slate-900 text-emerald-500 rounded-full shadow border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                  {currentUser?.display_name || currentUser?.displayName || 'Student'}, <span className="font-sans font-medium text-slate-500">{currentUser?.age || 21}</span>
                </h2>
                <p className="text-xs text-slate-400">Full Name: {currentUser?.full_name || currentUser?.fullName || 'College Student'}</p>
              </div>

              <button
                onClick={() => navigateTo('edit-profile')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>

            {/* Verification Badge & Campus Mood */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                <ShieldCheck className="w-3.5 h-3.5" /> {currentUser?.verification_status || currentUser?.verificationStatus || 'APPROVED'}
              </span>

              {(() => {
                const raw = currentMood?.label || currentUser?.currentMood || currentUser?.mood || currentUser?.current_mood;
                const matched = MOOD_OPTIONS.find((m) => m.label.toLowerCase() === String(raw || '').toLowerCase() || m.id.toLowerCase() === String(raw || '').toLowerCase());
                const emoji = matched?.emoji || currentMood?.emoji || '✨';
                const label = matched?.label || raw || 'Set Mood';
                return (
                  <button
                    onClick={() => setIsMoodModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 hover:border-rose-400 dark:hover:border-rose-700 transition-all shadow-2xs cursor-pointer group"
                    title="Click to update your Campus Mood in PostgreSQL database"
                  >
                    <span className="group-hover:scale-125 transition-transform">{emoji}</span>
                    <span>Mood: {label}</span>
                  </button>
                );
              })()}

              {activeRelationship?.partner && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">
                  ❤️ In Relationship with {activeRelationship.partner.display_name || activeRelationship.partner.displayName || 'Partner'}
                </span>
              )}
            </div>

            {/* College & Location */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <GraduationCap className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {currentUser?.college_name || currentUser?.collegeName || 'Premier College'}
                  {(currentUser?.course || currentUser?.degreeName) ? ` • ${currentUser.course || currentUser.degreeName}` : ''}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{currentUser?.city || 'Kharagpur'}, {currentUser?.state || 'West Bengal'}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Intention & Bio Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Current Connection Intention
        </h3>
        <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/40 rounded-2xl mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
              {currentUser?.relationship_intention || currentUser?.relationshipIntention || 'Casual Connection'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
            {(currentUser?.relationship_intention === 'Casual Connection' || currentUser?.relationshipIntention === 'Casual Connection' || (!currentUser?.relationship_intention && !currentUser?.relationshipIntention)) && 'Looking for casual chats, shared hobbies and campus friendships.'}
            {(currentUser?.relationship_intention === 'Dating Connection' || currentUser?.relationshipIntention === 'Dating Connection') && 'Exploring romantic connections organically without rush or pressure.'}
            {(currentUser?.relationship_intention === 'Serious Relationship' || currentUser?.relationshipIntention === 'Serious Relationship') && 'Looking for a committed long-term connection built on mutual understanding.'}
          </p>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          About Me
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mb-6 whitespace-pre-wrap">
          {currentUser?.bio || 'Verified college student profile.'}
        </p>

        {/* Interests */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Interests & Passions
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {(currentUser?.interests || []).map((int) => (
            <span
              key={int}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              {int}
            </span>
          ))}
          {(!currentUser?.interests || currentUser.interests.length === 0) && (
            <span className="text-xs text-slate-400 italic">No interests added yet</span>
          )}
        </div>

        {/* Languages */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5" /> Languages Spoken
        </h3>
        <div className="flex flex-wrap gap-2">
          {(currentUser?.languages || []).map((lang) => (
            <span
              key={lang}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {lang}
            </span>
          ))}
          {(!currentUser?.languages || currentUser.languages.length === 0) && (
            <span className="text-xs text-slate-400 italic">English</span>
          )}
        </div>

      </div>

      {/* Verified Photographs Gallery (Displaying all Photos from Database) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Verified Photographs ({allUserPhotos.length} / 3)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              All photos are human-verified and visible to active students on Collage Story.
            </p>
          </div>
          <button
            onClick={() => navigateTo('edit-profile')}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Manage Photos
          </button>
        </div>

        {allUserPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allUserPhotos.map((url, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={resolvePhotoUrl(url)}
                  alt={`Profile Photo ${i + 1}`}
                  className="w-full h-48 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-md">
                  {i === 0 ? '★ Main Photo' : `Photo ${i + 1}`}
                </span>
                <span className="absolute top-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow text-[10px]">
                  <ShieldCheck className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500 mb-2">No photographs uploaded yet.</p>
            <button
              onClick={() => navigateTo('edit-profile')}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-semibold"
            >
              Upload Photographs
            </button>
          </div>
        )}
      </div>

      {/* Membership & Subscription Banner */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/40 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {planConfig.name} ({planConfig.period})
            </h4>
            <p className="text-[11px] text-slate-500">
              Matches: {matchesList.length}/{planConfig.max_mutual_matches === 9999 ? '∞' : planConfig.max_mutual_matches} • Sent: {currentUser?.sent_requests_count ?? currentUser?.sentRequestsCount ?? 0}/{planConfig.max_sent_requests === 9999 ? '∞' : planConfig.max_sent_requests}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsPremiumModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow hover:brightness-105 cursor-pointer"
        >
          {currentUser?.subscription_plan === 'free' || !currentUser?.subscription_plan ? 'Upgrade to ₹49' : 'Manage Plan'}
        </button>
      </div>

      {/* Interactive Mood Picker Modal */}
      <MoodPickerModal
        isOpen={isMoodModalOpen}
        onClose={() => setIsMoodModalOpen(false)}
      />

    </div>
  );
};

export default ProfileView;

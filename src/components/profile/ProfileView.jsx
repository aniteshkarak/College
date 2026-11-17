import React from 'react';
import { useApp } from '../../context/AppContext';
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
  const { currentUser, navigateTo, activeRelationship, setIsPremiumModalOpen } = useApp();

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
              src={currentUser.avatar_url}
              alt={currentUser.display_name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-rose-500/30 shadow-md"
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
                  {currentUser.display_name}, <span className="font-sans font-medium text-slate-500">{currentUser.age}</span>
                </h2>
                <p className="text-xs text-slate-400">Full Name: {currentUser.full_name}</p>
              </div>

              <button
                onClick={() => navigateTo('edit-profile')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>

            {/* Verification Badge */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                <ShieldCheck className="w-3.5 h-3.5" /> {currentUser.verification_status}
              </span>

              {currentUser.mood && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200/60">
                  ✨ Mood: {currentUser.mood}
                </span>
              )}

              {activeRelationship && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">
                  ❤️ In Relationship with {activeRelationship.partner.display_name}
                </span>
              )}
            </div>

            {/* College & Location */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <GraduationCap className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{currentUser.college_name} • {currentUser.course}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{currentUser.city}, {currentUser.state}</span>
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
        <div className="p-3 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl mb-4">
          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block mb-0.5">
            {currentUser.relationship_intention}
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {currentUser.relationship_intention === 'Casual Connection' && 'Looking for casual chats, shared hobbies and campus friendships.'}
            {currentUser.relationship_intention === 'Dating Connection' && 'Exploring romantic connections organically without rush or pressure.'}
            {currentUser.relationship_intention === 'Serious Relationship' && 'Looking for a committed long-term connection built on mutual understanding.'}
          </p>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          About Me
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mb-6 whitespace-pre-wrap">
          {currentUser.bio}
        </p>

        {/* Interests */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Interests & Passions
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {currentUser.interests.map((int) => (
            <span
              key={int}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              {int}
            </span>
          ))}
        </div>

        {/* Languages */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5" /> Languages Spoken
        </h3>
        <div className="flex flex-wrap gap-2">
          {currentUser.languages.map((lang) => (
            <span
              key={lang}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {lang}
            </span>
          ))}
        </div>

      </div>

      {/* Additional Photos Gallery */}
      {currentUser.additional_photos && currentUser.additional_photos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Photo Gallery
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentUser.additional_photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-36 object-cover rounded-2xl shadow-sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Collégé Premium Banner */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/40 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Collégé Free Plan</h4>
            <p className="text-[11px] text-slate-500">{currentUser.daily_likes_remaining} daily likes remaining today</p>
          </div>
        </div>
        <button
          onClick={() => setIsPremiumModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow hover:brightness-105"
        >
          Upgrade
        </button>
      </div>

    </div>
  );
};

export default ProfileView;

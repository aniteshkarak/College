import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  X,
  MapPin,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  MoreVertical,
  Flag,
  Ban,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

export const ProfileCard = ({ profile, onLike, onPass }) => {
  const { setReportTarget, setBlockTarget } = useApp();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  const photos = [profile.avatar_url, ...(profile.additional_photos || [])];

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Relationship intention colors
  const intentionStyles = {
    'Casual Connection': 'bg-emerald-500/90 text-white border-emerald-400/40',
    'Dating Connection': 'bg-rose-500/90 text-white border-rose-400/40',
    'Serious Relationship': 'bg-purple-600/90 text-white border-purple-400/40'
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[calc(100vh-11rem)] min-h-[500px] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 text-white select-none transition-all">
      
      {/* Background Image Carousel */}
      <div className="relative w-full h-full">
        <img
          src={photos[photoIndex]}
          alt={profile.display_name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Dark gradient overlay for readable text */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Carousel indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-4 right-4 flex gap-1 z-20">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all ${
                  i === photoIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo navigation click zones */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/3 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white opacity-0 hover:opacity-100 transition-opacity z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/3 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white opacity-0 hover:opacity-100 transition-opacity z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Top Badges (Verification, Intention, Actions) */}
        <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex flex-wrap items-center gap-1.5">
            {profile.verification_status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/80 backdrop-blur-md text-white shadow">
                <ShieldCheck className="w-3.5 h-3.5" />
                {profile.verification_status}
              </span>
            )}
            {profile.mood && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/50 backdrop-blur-md text-rose-200 border border-white/10 shadow">
                <span>✨</span> {profile.mood}
              </span>
            )}
          </div>

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-1 z-30 animate-slide-up">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setReportTarget({ user: profile });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 rounded-xl"
                >
                  <Flag className="w-3.5 h-3.5" /> Report User
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setBlockTarget(profile);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  <Ban className="w-3.5 h-3.5" /> Block Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Content Overlay */}
        <div className="absolute bottom-20 left-0 right-0 p-5 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            
            {/* Intention Pill */}
            <div className="mb-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow border ${
                  intentionStyles[profile.relationship_intention] || 'bg-rose-500 text-white'
                }`}
              >
                {profile.relationship_intention}
              </span>
            </div>

            {/* Name, Age, Distance */}
            <div className="flex items-baseline gap-2.5 mb-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                {profile.display_name}
              </h2>
              <span className="text-xl font-medium text-slate-300">
                {profile.age}
              </span>
            </div>

            {/* College & City */}
            <div className="space-y-1 text-xs text-slate-300 drop-shadow-sm mb-3">
              {profile.college_name && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{profile.college_name} {profile.course ? `• ${profile.course}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{profile.city}, {profile.state} {profile.distance_km ? `(${profile.distance_km} km away)` : ''}</span>
              </div>
            </div>

            {/* Bio with expand */}
            {profile.bio && (
              <p
                onClick={() => setShowFullBio(!showFullBio)}
                className={`text-xs text-slate-200/90 leading-relaxed mb-3 cursor-pointer ${
                  showFullBio ? '' : 'line-clamp-2'
                }`}
              >
                {profile.bio}
              </p>
            )}

            {/* Interests tags */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/15 backdrop-blur-md text-white border border-white/10"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Action Controls (Pass / Like) */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-20">
          
          {/* Pass Button */}
          <button
            onClick={() => onPass(profile)}
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/20 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
            title="Pass (Kept strictly private)"
          >
            <X className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* Like Button */}
          <button
            onClick={() => onLike(profile)}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-orange-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 hover:scale-110 active:scale-95 transition-all"
            title="Like Profile"
          >
            <Heart className="w-8 h-8 fill-white stroke-none" />
          </button>

        </div>

      </div>
    </div>
  );
};

export default ProfileCard;

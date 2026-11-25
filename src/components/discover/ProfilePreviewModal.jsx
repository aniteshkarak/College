import React, { useState } from 'react';
import { resolvePhotoUrl } from '../../services/api';
import { MOOD_OPTIONS } from '../../services/mockData';
import {
  X,
  MapPin,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const ProfilePreviewModal = ({ profile, isOpen, onClose, onAccept, onReject, onChat }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!isOpen || !profile) return null;

  // Extract photos
  const rawPhotos = (
    profile.photos && profile.photos.length > 0
      ? profile.photos.map((p) => (typeof p === 'string' ? p : p.url))
      : [
          profile.avatar_url || profile.avatarUrl,
          ...(profile.additional_photos || profile.additionalPhotos || [])
        ]
  ).filter(Boolean);

  const photos = rawPhotos.length > 0
    ? rawPhotos.map(resolvePhotoUrl)
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'];

  const nextPhoto = (e) => {
    e?.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e?.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Resolve mood
  const rawMood = typeof profile.mood === 'object' ? profile.mood?.label : profile.mood;
  const matchedMood = MOOD_OPTIONS.find(
    (opt) => opt.label.toLowerCase() === String(rawMood || '').toLowerCase() ||
             opt.id.toLowerCase() === String(rawMood || '').toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-rose-100 dark:border-rose-950/40 relative animate-slide-up max-h-[92dvh] flex flex-col">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
          title="Close profile"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Photo Carousel Header */}
          <div className="relative w-full aspect-4/3 sm:aspect-square bg-slate-950">
            <img
              src={photos[photoIndex]}
              alt={profile.display_name}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Carousel Indicators */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-4 right-14 flex gap-1 z-20">
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

            {/* Carousel Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white z-20 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white z-20 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Basic Info on Photo Bottom */}
            <div className="absolute bottom-3 left-4 right-4 z-20 text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-xl sm:text-2xl drop-shadow-sm">
                  {profile.display_name}
                  {profile.age ? `, ${profile.age}` : ''}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white shadow-xs">
                  <ShieldCheck className="w-3 h-3" /> Verified Student
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 flex items-center gap-1.5 drop-shadow-xs">
                <GraduationCap className="w-3.5 h-3.5 shrink-0 text-rose-300" />
                <span>{profile.college_name || 'Campus Student'}</span>
                {profile.course && <span>• {profile.course}</span>}
              </p>
            </div>
          </div>

          {/* Profile Details Body */}
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            
            {/* Mood / Intention Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              {matchedMood && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-semibold">
                  <span>{matchedMood.emoji || '✨'}</span>
                  <span>{matchedMood.label}</span>
                </div>
              )}
              {profile.relationship_intention && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{profile.relationship_intention}</span>
                </div>
              )}
              {profile.city && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{profile.city}</span>
                </div>
              )}
            </div>

            {/* About Me / Bio */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                About Me
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                {profile.bio ? `"${profile.bio}"` : 'No bio provided yet.'}
              </p>
            </div>

            {/* Interests & Hobbies */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
                  Interests & Passions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Privacy Notice */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-[11px]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Verified Student Identity under Indian DPDP Act. Contact details remain strictly private.
              </span>
            </div>

          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          {onReject && (
            <button
              onClick={() => {
                onReject(profile);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Decline
            </button>
          )}

          {onAccept && (
            <button
              onClick={() => {
                onAccept(profile);
                onClose();
              }}
              className="flex-1 px-5 py-2.5 rounded-xl font-bold text-xs text-white gradient-brand-bg shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Accept (Mutual Friend)</span>
            </button>
          )}

          {onChat && (
            <button
              onClick={() => {
                onChat(profile);
                onClose();
              }}
              className="flex-1 px-5 py-2.5 rounded-xl font-bold text-xs text-white gradient-brand-bg shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open Conversation</span>
            </button>
          )}

          {!onAccept && !onChat && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePreviewModal;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MOOD_OPTIONS } from '../../services/mockData';
import { Smile, Sparkles, X, Check, Loader2 } from 'lucide-react';

export const MoodPickerModal = ({ isOpen, onClose }) => {
  const { currentMood, updateUserMood, addToast } = useApp();
  const [savingMoodId, setSavingMoodId] = useState(null);

  if (!isOpen) return null;

  const handleSelectMood = async (mood) => {
    if (savingMoodId) return; // Prevent duplicate submissions

    // If same mood already active, just close
    if (currentMood?.id === mood.id || currentMood?.label?.toLowerCase() === mood.label?.toLowerCase()) {
      onClose();
      return;
    }

    setSavingMoodId(mood.id);
    try {
      const saved = await updateUserMood(mood);
      addToast(`Campus Mood saved to PostgreSQL: ${saved.label} ${saved.emoji}`, 'success');
      onClose();
    } catch (err) {
      console.error('Mood save error:', err);
      addToast(err.message || 'Failed to save mood in PostgreSQL database. Please try again.', 'error');
    } finally {
      setSavingMoodId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up flex flex-col max-h-[88vh]">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Campus Mood</h3>
              <p className="text-[11px] text-slate-500">How are you feeling right now?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={savingMoodId !== null}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4 overflow-y-auto pr-1 flex-1">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = currentMood?.id === mood.id || currentMood?.label?.toLowerCase() === mood.label?.toLowerCase();
            const isSavingThis = savingMoodId === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleSelectMood(mood)}
                disabled={savingMoodId !== null}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center group disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800/80 hover:border-rose-200 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                } ${isSavingThis ? 'ring-2 ring-rose-500 opacity-90' : ''}`}
              >
                {isSavingThis ? (
                  <Loader2 className="w-6 h-6 mb-1 text-rose-600 dark:text-rose-400 animate-spin" />
                ) : (
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{mood.emoji}</span>
                )}
                <span className="text-[11px] font-semibold leading-tight">{mood.label}</span>
                {isSavingThis ? (
                  <span className="mt-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                    Saving...
                  </span>
                ) : isSelected ? (
                  <span className="mt-1 flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    <Check className="w-3 h-3" /> Active
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Permanently saved to PostgreSQL database & synced live across devices.</span>
        </div>

      </div>
    </div>
  );
};

export default MoodPickerModal;

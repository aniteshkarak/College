import React from 'react';
import { useApp } from '../../context/AppContext';
import { MOOD_OPTIONS } from '../../services/mockData';
import { Smile, Clock, X, Check } from 'lucide-react';

export const MoodPickerModal = ({ isOpen, onClose }) => {
  const { currentMood, setCurrentMood, addToast } = useApp();

  if (!isOpen) return null;

  const handleSelectMood = (mood) => {
    setCurrentMood(mood);
    addToast(`Mood updated to: ${mood.label} ${mood.emoji}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Smile className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Campus Mood</h3>
              <p className="text-[11px] text-slate-500">What are you feeling today?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 my-5">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = currentMood?.id === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleSelectMood(mood)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-xs font-semibold">{mood.label}</span>
                {isSelected && (
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Clock className="w-3.5 h-3.5" />
          <span>Mood status automatically resets after 24 hours.</span>
        </div>

      </div>
    </div>
  );
};

export default MoodPickerModal;

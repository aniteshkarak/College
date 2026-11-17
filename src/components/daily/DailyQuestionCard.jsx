import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Send, Globe, Lock, CheckCircle2, MessageSquare } from 'lucide-react';

export const DailyQuestionCard = () => {
  const {
    todayQuestion,
    userDailyAnswer,
    setUserDailyAnswer,
    dailyAnswerVisibility,
    setDailyAnswerVisibility,
    addToast
  } = useApp();

  const [inputVal, setInputVal] = useState(userDailyAnswer);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(userDailyAnswer));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setUserDailyAnswer(inputVal.trim());
    setIsSubmitted(true);
    addToast('Answer posted to today\'s campus board! ✨', 'success');
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-orange-500/10 border border-rose-200/80 dark:border-rose-900/50 shadow-sm relative overflow-hidden">
      
      {/* Top Tag */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-xs">
          <Sparkles className="w-3 h-3" /> Campus Question of the Day
        </span>
        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
          {todayQuestion.total_answers} Answers
        </span>
      </div>

      {/* Question Prompt */}
      <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-4">
        "{todayQuestion.question}"
      </h3>

      {/* Answer Form */}
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={2}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Share your thought with your campus peers..."
            className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />

          <div className="flex items-center justify-between">
            {/* Visibility Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setDailyAnswerVisibility('public')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  dailyAnswerVisibility === 'public'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Globe className="w-3 h-3" /> Public
              </button>
              <button
                type="button"
                onClick={() => setDailyAnswerVisibility('private')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  dailyAnswerVisibility === 'private'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Lock className="w-3 h-3" /> Private
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-semibold shadow hover:brightness-105 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Post Answer
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Your Answer ({dailyAnswerVisibility})
            </span>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 underline"
            >
              Edit
            </button>
          </div>
          <p className="text-slate-700 dark:text-slate-200 italic">"{userDailyAnswer}"</p>
        </div>
      )}

      {/* Community sample answers snippet */}
      {todayQuestion.sample_answers && (
        <div className="mt-4 pt-4 border-t border-rose-200/50 dark:border-rose-900/30 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400">Recent Campus Answers</p>
          {todayQuestion.sample_answers.map((ans, i) => (
            <div key={i} className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{ans.user}:</span> {ans.text}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default DailyQuestionCard;

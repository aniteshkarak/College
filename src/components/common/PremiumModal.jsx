import React from 'react';
import { useApp } from '../../context/AppContext';
import { Crown, Check, Sparkles, X, Heart, Zap, Sliders, ShieldCheck } from 'lucide-react';

export const PremiumModal = () => {
  const { isPremiumModalOpen, setIsPremiumModalOpen, addToast } = useApp();

  if (!isPremiumModalOpen) return null;

  const features = [
    { title: 'Unlimited Daily Likes', desc: 'Browse and connect without 15 daily limits' },
    { title: 'See Who Liked You', desc: 'Instantly view interested peers before matching' },
    { title: 'Campus Boost (1x / week)', desc: 'Top visibility in your college town feed for 1 hour' },
    { title: 'Advanced Filters', desc: 'Filter by specific majors, distance radius, and hobbies' },
    { title: 'Deep Compatibility Insights', desc: 'Full answer breakdowns on Conversation Games' }
  ];

  const handleUpgrade = (tier) => {
    addToast(`Subscribed to Collégé ${tier}! Enjoy your premium perks 👑`, 'success');
    setIsPremiumModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-900/50 animate-slide-up relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                Collégé Premium
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Elevate your campus networking experience
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPremiumModalOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features checklist */}
        <div className="my-6 space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{f.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing tiers */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            onClick={() => handleUpgrade('Monthly')}
            className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer text-center transition-all bg-white dark:bg-slate-900"
          >
            <span className="text-[10px] uppercase font-bold text-slate-500">1 Month</span>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">₹149</div>
            <span className="text-[10px] text-slate-400">Cancel anytime</span>
          </div>
          <div
            onClick={() => handleUpgrade('Semester Pass')}
            className="p-4 rounded-2xl border-2 border-amber-500 relative cursor-pointer text-center transition-all bg-gradient-to-b from-amber-500/5 to-rose-500/5 dark:bg-slate-800/80 shadow-md"
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-[9px] font-bold">
              BEST VALUE
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Semester (6 Mos)</span>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">₹499</div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Save 45%</span>
          </div>
        </div>

        {/* Safety pledge notice per PRD */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Collégé Pledge: We never charge for user safety, reporting, unmatching, blocking, or privacy controls.
          </span>
        </div>

      </div>
    </div>
  );
};

export default PremiumModal;

import React from 'react';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION_PLANS } from '../../services/mockData';
import { Crown, Check, X, ShieldCheck, Zap, Sparkles, Heart } from 'lucide-react';

export const PremiumModal = () => {
  const { isPremiumModalOpen, setIsPremiumModalOpen, currentUser, handleUpgradePlan } = useApp();

  if (!isPremiumModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-900/50 animate-slide-up relative overflow-hidden max-h-[90dvh] overflow-y-auto">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-rose-400/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                Collage Story Membership Plans
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                Transparent campus plans • 28-day billing cycles
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPremiumModalOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tier Cards: Free, ₹49 / 28 days, ₹99 / 28 days */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
          
          {/* FREE PLAN */}
          <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Free Plan</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹0</div>
              <span className="text-[10px] text-slate-400">Always Free</span>

              <div className="mt-4 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  5 Mutual Matches
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  50 Sent Requests
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Campus Board Access
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Voice Notes & Games
                </p>
              </div>
            </div>

            <div className="mt-5">
              {currentUser.subscription_plan === 'free' ? (
                <span className="block text-center py-2 text-[11px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 rounded-xl">
                  Current Plan
                </span>
              ) : (
                <button
                  onClick={() => handleUpgradePlan('free')}
                  className="w-full py-2 text-[11px] font-semibold text-slate-700 bg-slate-200 rounded-xl"
                >
                  Downgrade
                </button>
              )}
            </div>
          </div>

          {/* ₹49 PLAN (28 DAYS) */}
          <div className="p-4 rounded-2xl border-2 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between relative shadow-md">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-extrabold uppercase tracking-wider">
              POPULAR
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Campus Pro</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹49</div>
              <span className="text-[10px] font-bold text-rose-500">Per 28 Days</span>

              <div className="mt-4 space-y-2 text-[11px] text-slate-700 dark:text-slate-200">
                <p className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 stroke-[2.5]" />
                  20 Mutual Matches
                </p>
                <p className="flex items-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 stroke-[2.5]" />
                  100 Sent Requests
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Instant Likes View
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Campus Board Badge
                </p>
              </div>
            </div>

            <div className="mt-5">
              {currentUser.subscription_plan === 'pro_49' ? (
                <span className="block text-center py-2 text-[11px] font-bold text-emerald-600 bg-emerald-100 rounded-xl">
                  Active (₹49)
                </span>
              ) : (
                <button
                  onClick={() => handleUpgradePlan('pro_49')}
                  className="w-full py-2.5 text-xs font-bold text-white gradient-brand-bg rounded-xl shadow hover:brightness-105 active:scale-95 transition-all"
                >
                  Upgrade to ₹49
                </button>
              )}
            </div>
          </div>

          {/* ₹99 PLAN (28 DAYS) */}
          <div className="p-4 rounded-2xl border-2 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between relative shadow-md">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-[9px] font-extrabold uppercase tracking-wider">
              UNLIMITED
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Campus VIP</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹99</div>
              <span className="text-[10px] font-bold text-amber-600">Per 28 Days</span>

              <div className="mt-4 space-y-2 text-[11px] text-slate-700 dark:text-slate-200">
                <p className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  Unlimited Matches
                </p>
                <p className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  Unlimited Requests
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Top Campus Spotlight
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  VIP Gold Profile Badge
                </p>
              </div>
            </div>

            <div className="mt-5">
              {currentUser.subscription_plan === 'unlimited_99' ? (
                <span className="block text-center py-2 text-[11px] font-bold text-amber-600 bg-amber-100 rounded-xl">
                  Active (₹99)
                </span>
              ) : (
                <button
                  onClick={() => handleUpgradePlan('unlimited_99')}
                  className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow hover:brightness-105 active:scale-95 transition-all"
                >
                  Upgrade to ₹99
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Safety & Compliance Pledge */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Collage Story Safety Commitment: Reporting, blocking, unmatching, and DPDP privacy controls are ALWAYS 100% free for everyone.
          </span>
        </div>

      </div>
    </div>
  );
};

export default PremiumModal;

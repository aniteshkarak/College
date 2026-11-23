import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, UserCheck, Flame, MessageCircle, Gamepad2, Heart, ShieldCheck } from 'lucide-react';

export const HowItWorksPage = () => {
  const { navigateTo, setIsAuthenticated } = useApp();

  const steps = [
    {
      num: '01',
      title: 'Sign Up & Age Verification',
      desc: 'Register with your email, mobile OTP, or Google. Enter your Date of Birth to confirm 18+ eligibility. Add your college, course, and interests.',
      icon: <UserCheck className="w-5 h-5 text-rose-600" />
    },
    {
      num: '02',
      title: 'Choose Your Intention',
      desc: 'Select whether you want a Casual Connection, Dating Connection, or Serious Relationship. Update this anytime as your goals evolve.',
      icon: <Heart className="w-5 h-5 text-purple-600" />
    },
    {
      num: '03',
      title: 'Discover & Match Mutually',
      desc: 'Browse verified profiles from nearby campuses. When both users like each other, a match is created! Passed profiles are never revealed.',
      icon: <Flame className="w-5 h-5 text-orange-600" />
    },
    {
      num: '04',
      title: 'Chat & Send Voice Notes',
      desc: 'Enjoy private text messaging and 60-second voice notes with preview and waveforms. No video calling or location tracking.',
      icon: <MessageCircle className="w-5 h-5 text-blue-600" />
    },
    {
      num: '05',
      title: 'Play Conversation Games',
      desc: 'Break small talk with 6 signature games: Truth or Dare, Would You Rather, This or That, 20 Questions, Compatibility Quiz, and Never Have I Ever.',
      icon: <Gamepad2 className="w-5 h-5 text-emerald-600" />
    },
    {
      num: '06',
      title: 'Mutual Relationship Mode',
      desc: 'If sparks fly and both want to take things further, either user can send a Relationship Request. Only with mutual double confirmation does the official status activate.',
      icon: <ShieldCheck className="w-5 h-5 text-pink-600" />
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigateTo('landing')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2 block">
          Simple, Safe & Transparent
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-3">
          How Collage Story Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          From your first campus icebreaker to mutual relationship confirmation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 font-mono">
                STEP {step.num}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            setIsAuthenticated(true);
            navigateTo('discover');
          }}
          className="px-8 py-3.5 gradient-brand-bg text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-600/30 hover:brightness-105"
        >
          Start Exploring Now
        </button>
      </div>
    </div>
  );
};

export default HowItWorksPage;

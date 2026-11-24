import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Heart,
  MessageCircle,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Users2,
  VideoOff,
  Lock,
  ArrowRight,
  GraduationCap,
  MapPin,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const LandingPage = () => {
  const { navigateTo, setIsAuthModalOpen, setAuthModalMode } = useApp();

  const handleJoin = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const handleLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const connectionPillars = [
    {
      title: 'Casual Connection',
      desc: 'For students who want to chat, discuss college life, share playlist recommendations, and pass some free time without awkward pressure.',
      badge: 'Zero Pressure',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Dating Connection',
      desc: 'For people interested in exploring romantic vibes, bantering through voice notes, and seeing if mutual sparks fly naturally.',
      badge: 'Organic Dating',
      color: 'from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
    },
    {
      title: 'Serious Relationship',
      desc: 'For students looking for an authentic, committed partner after understanding and respecting each other deeply.',
      badge: 'Mutual Intent',
      color: 'from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="w-full overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-rose-500/20 via-orange-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Launch Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-6 shadow-xs animate-slide-up">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-rose-600 to-orange-500 p-0.5 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[3px] p-0.5 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Collage Story" className="w-full h-full object-contain" />
            </div>
          </div>
          <span>Now Live in Kharagpur, Kolkata & Midnapore Campuses</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Meet College Peers. <br />
          <span className="gradient-brand-text">Start With a Conversation.</span>
        </h1>

        {/* Tagline / Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Not everyone comes here looking for immediate love. Some want friendship, some want casual banter, some want to fall in love. Whatever your intention, there is zero pressure.
        </p>

        {/* Main CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={handleJoin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm text-white gradient-brand-bg shadow-xl shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Join Your Campus Community</span>
          </button>

          <button
            onClick={() => navigateTo('how-it-works')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>How Collage Story Works</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
              <VideoOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">No Video Calls</p>
              <p className="text-[11px] text-slate-500">Text & voice notes only</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">6 Icebreaker Games</p>
              <p className="text-[11px] text-slate-500">Break the ice naturally</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">18+ Age Verified</p>
              <p className="text-[11px] text-slate-500">DOB validation & DPDP Act</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center text-orange-600 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Mutual Double Choice</p>
              <p className="text-[11px] text-slate-500">No forced commitments</p>
            </div>
          </div>
        </div>

      </section>

      {/* THREE CONNECTION PATHS (PRD SECTION 3) */}
      <section className="py-16 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2 block">
              Product Philosophy
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 dark:text-white mb-3">
              One App. Three Mutual Intentions.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Unlike traditional dating apps that push users into rapid romance, Collage Story respects where you are in life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {connectionPillars.map((pillar, i) => (
              <div
                key={i}
                className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-b ${pillar.color} bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between`}
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4 border">
                    {pillar.badge}
                  </span>
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center gap-1.5 text-xs font-bold">
                  <span>Explore intention</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SIGNATURE FEATURE: CONVERSATION GAMES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold mb-3">
              <Gamepad2 className="w-3.5 h-3.5" /> Collage Story Signature Feature
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-4 leading-tight">
              Say Goodbye to Boring "Hey, What's Up?" Small Talk.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Break the silence with 6 built-in, college-friendly conversation games inside every match. Share hilarious campus memories, discover niche shared music tastes, and compare fun dilemmas.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { name: 'Truth or Dare', desc: 'College-safe truths & witty dares' },
                { name: 'Would You Rather?', desc: 'Compare quirky lifestyle picks' },
                { name: 'This or That', desc: 'Fast-paced lightning choices' },
                { name: '20 Questions', desc: 'Deduce mystery spots on campus' },
                { name: 'Compatibility Quiz', desc: 'Answer 5 lifestyle questions' },
                { name: 'Never Have I Ever', desc: 'Hostel & lecture icebreakers' }
              ].map((g, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</p>
                  <p className="text-[10px] text-slate-500">{g.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleJoin}
              className="px-6 py-3 rounded-2xl gradient-brand-bg text-white text-xs font-bold shadow-md hover:brightness-105"
            >
              Try Games With Campus Matches
            </button>
          </div>

          {/* Interactive Mock Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 relative">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-2">
              LIVE GAME PREVIEW
            </span>
            <h3 className="text-xl font-display font-bold mb-4">
              "Would You Rather?"
            </h3>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-2xl bg-slate-800 border-2 border-rose-500 text-xs font-semibold">
                ☕ Kulhad chai at 2:00 AM near campus tapri (74% agreed)
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs font-medium text-slate-400">
                📚 8:00 AM breakfast at hostel mess with fresh dosas (26%)
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl text-[11px] text-slate-300">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <span>You and Tanvi both picked Option A! Compatibility +15%</span>
            </div>
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
              Ready to Meet Genuine College People?
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 mb-8 leading-relaxed">
              No pressure. No awkward video calls. Just authentic profiles, private voice notes, and mutual decisions.
            </p>
            <button
              onClick={handleJoin}
              className="px-8 py-3.5 bg-white text-rose-600 rounded-2xl font-bold text-sm shadow-xl hover:bg-rose-50 transition-all transform hover:scale-105"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

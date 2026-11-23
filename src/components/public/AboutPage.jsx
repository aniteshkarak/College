import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Heart, Users2, Sparkles, VideoOff, ArrowLeft } from 'lucide-react';

export const AboutPage = () => {
  const { navigateTo } = useApp();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigateTo('landing')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <span className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2 block">
        Our Story & Mission
      </span>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-4">
        About Collage Story
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
        Collage Story was created for college students and young adults across India who are tired of high-pressure dating apps and superficial swiping culture.
      </p>

      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-2">
            Why Collage Story is Different
          </h3>
          <p className="mb-3">
            On most mainstream dating apps, users feel rushed into defining a relationship or face uncomfortable video calls. Collage Story takes a completely different path:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>Zero Pressure:</strong> You can choose Casual Connection (just talking), Dating Connection (exploring romance), or Serious Relationship (deep commitment).</li>
            <li><strong>No Video Calling:</strong> The platform will strictly not provide video calling or live video, protecting user comfort and privacy.</li>
            <li><strong>Mutual Double-Confirmation:</strong> A relationship status changes only after both individuals independently confirm it.</li>
            <li><strong>Interactive Conversation Games:</strong> Built-in Truth or Dare, 20 Questions, Compatibility Quiz, and more to break the ice effortlessly.</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-2">
            Target Market & Geographic Roadmap
          </h3>
          <p className="mb-3">
            Our initial focus begins in major college ecosystems in West Bengal—including Kharagpur, Kolkata, Midnapore, and neighboring university towns—before expanding to student hubs in Delhi, Mumbai, Bengaluru, Pune, Hyderabad, and across India.
          </p>
          <p>
            Collage Story is India-wide and welcomes adults aged 18+ from any college or university.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border border-rose-200 dark:border-rose-900/40">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            Our Final Principle (PRD Section 16)
          </h4>
          <p className="italic text-slate-700 dark:text-slate-300">
            "A match is not a commitment. A conversation is not a promise. A relationship happens only when both people freely choose it."
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

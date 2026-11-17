import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage = () => {
  const { navigateTo } = useApp();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigateTo('landing')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">
        Agreement
      </span>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-2">
        Terms & Conditions
      </h1>
      <p className="text-xs text-slate-500 mb-8">
        Version 1.0 • Effective November 2026
      </p>

      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. 18+ Age Requirement</h3>
          <p>
            You must be at least 18 years of age to register and use Collégé. Age is validated strictly through Date of Birth. Providing fraudulent age information is a violation of these terms and will result in immediate termination of the account.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">2. Non-Binding Relationship Principle (PRD 4.9 & 16)</h3>
          <p className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 font-medium text-rose-800 dark:text-rose-300">
            A digital match, mutual conversation, or in-app relationship status does NOT represent a legally binding or real-world civil commitment. Either user may end the relationship status on the platform independently at any time.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. Prohibited Conduct</h3>
          <p className="mb-2">Users agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Harass, stalk, intimidate, or send non-consensual content.</li>
            <li>Impersonate another individual or use commercial stock photography.</li>
            <li>Promote commercial spam, investments, crypto schemes, or external services.</li>
            <li>Attempt to bypass security boundaries, RLS policies, or rate limits.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">4. Freemium Service & Subscriptions</h3>
          <p>
            Essential discovery, messaging, matching, voice notes, conversation games, and safety functions are completely free. Collégé Premium offers optional perks (such as additional daily likes and boosts). We never charge for user safety, consent controls, blocking, or reporting.
          </p>
        </section>

      </div>
    </div>
  );
};

export default TermsPage;

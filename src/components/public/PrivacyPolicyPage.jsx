import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ShieldCheck, Lock, FileText } from 'lucide-react';

export const PrivacyPolicyPage = () => {
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
        Legal & Compliance
      </span>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-2">
        Privacy Policy (DPDP Act, 2023)
      </h1>
      <p className="text-xs text-slate-500 mb-8">
        Last updated: November 2026 • Compliant with Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025.
      </p>

      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. Data Minimisation Principle</h3>
          <p>
            Collégé collects only the minimum necessary information required to facilitate authentic college networking. We do not collect Aadhaar numbers, PAN cards, or sensitive identity documents unless mandated by explicit statutory requirements through certified verification providers.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">2. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Display name, full name (confidential for safety), Date of Birth for 18+ age assurance.</li>
            <li>Gender and connection intention (Casual, Dating, or Serious).</li>
            <li>Optional college name, course, and selected interest tags.</li>
            <li>Profile photos (stored in secured storage).</li>
            <li>Encrypted voice notes (accessed only via private buckets with short-lived signed URLs).</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. No Unrestricted Admin Access to Chats</h3>
          <p>
            Private messages and audio notes are accessible only to authorised chat participants. Administrative and moderation staff have access only to specific reported snippets when an investigation is opened under mandatory audit logging.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">4. User Rights under DPDP Act</h3>
          <p className="mb-2">As a registered user, you hold statutory rights to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access a summary of your personal data processed by Collégé.</li>
            <li>Request correction or updating of inaccurate data.</li>
            <li>Withdraw consent at any time through Account Settings.</li>
            <li>Erase and delete your account and all associated communication history.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">5. Grievance Redressal Officer</h3>
          <p>
            In accordance with the DPDP Act 2023, complaints or privacy inquiries may be directed to our designated Grievance Officer at <code>grievance@college-india.app</code>.
          </p>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

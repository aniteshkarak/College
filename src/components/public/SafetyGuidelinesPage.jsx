import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, AlertTriangle, UserX, Flag, CheckCircle, ArrowLeft } from 'lucide-react';

export const SafetyGuidelinesPage = () => {
  const { navigateTo } = useApp();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigateTo('landing')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2 block">
        Trust & Safety
      </span>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-4">
        Community Safety Guidelines
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
        Your safety, comfort, and peace of mind come before everything else on Collégé. Here is how we protect our community.
      </p>

      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <Lock className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              No Video Calls & No Live Location
            </h3>
          </div>
          <p>
            Collégé strictly disables video calls and video messaging. You will never receive unsolicited video calls. Furthermore, your exact live GPS location is never shared with other users—only your self-reported campus city and approximate distance band.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-600">
            <UserX className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Instant Block & Silent Pass
            </h3>
          </div>
          <p className="mb-2">
            You can block any user at any moment. Blocking immediately deletes the chat thread and prevents both of you from ever seeing each other on Discover.
          </p>
          <p>
            When you Pass on a profile in Discover, the platform will <strong>never</strong> reveal that you passed.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              India DPDP Act (2023) Compliance
            </h3>
          </div>
          <p className="mb-2">
            We follow the principle of data minimisation. We <strong>never collect Aadhaar numbers</strong> or unnecessary government documents.
          </p>
          <p>
            Voice notes are stored in private storage buckets and accessible only via short-lived signed URLs. Admins do not have unrestricted access to your private conversations.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Flag className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Zero Tolerance for Harassment
            </h3>
          </div>
          <p>
            Harassment, coercive messages, threats, fake profiles, and commercial spam result in immediate suspension or permanent bans. Reports are investigated under documented audit logging.
          </p>
        </div>

      </div>
    </div>
  );
};

export default SafetyGuidelinesPage;

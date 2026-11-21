import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  FileText,
  AlertCircle,
  EyeOff,
  UserCheck,
  Database,
  Trash2,
  Send,
  Printer,
  Scale,
  CheckCircle2,
  Mail,
  Info
} from 'lucide-react';
import PrivacyRequestModal from './PrivacyRequestModal';
import AkitsModal from '../layout/AkitsModal';

export const PrivacyPolicyPage = () => {
  const { navigateTo } = useApp();
  const [activeSection, setActiveSection] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAkitsModalOpen, setIsAkitsModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'sec-1', number: '1', title: 'Our Privacy Commitment' },
    { id: 'sec-2', number: '2', title: 'Information We Collect' },
    { id: 'sec-3', number: '3', title: 'Why We Collect Your Information' },
    { id: 'sec-4', number: '4', title: 'How We Store Your Information' },
    { id: 'sec-5', number: '5', title: 'Do We Share Your Personal Information?' },
    { id: 'sec-6', number: '6', title: 'Profile Privacy' },
    { id: 'sec-7', number: '7', title: 'College Verification Documents' },
    { id: 'sec-8', number: '8', title: 'Messages and Voice Recordings' },
    { id: 'sec-9', number: '9', title: 'Data Security' },
    { id: 'sec-10', number: '10', title: 'Data Retention and Deletion' },
    { id: 'sec-11', number: '11', title: 'Your Privacy Rights' },
    { id: 'sec-12', number: '12', title: 'Cookies and Similar Technologies' },
    { id: 'sec-13', number: '13', title: 'Third-Party Services' },
    { id: 'sec-14', number: '14', title: "Children's Privacy" },
    { id: 'sec-15', number: '15', title: 'Changes to This Privacy Policy' },
    { id: 'sec-16', number: '16', title: 'Contact and Privacy Complaints' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-fade-in text-slate-800 dark:text-slate-200">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={() => navigateTo('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('terms')}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            View Terms & Conditions
          </button>
          <span className="text-slate-400">•</span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Print Policy"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Document</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl mb-8 overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Digital Personal Data Protection Act (2023) Compliance</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Collégé is committed to protecting the privacy, dignity and personal data of our student community. This Privacy Policy details our lawful data collection, strict verification safeguards, storage standards and your statutory privacy rights.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span><strong>Version:</strong> 2.4</span>
              <span>•</span>
              <span><strong>Effective Date:</strong> November 21, 2026</span>
              <span>•</span>
              <span><strong>Jurisdiction:</strong> India (DPDP Act, 2023)</span>
            </div>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Privacy / Deletion Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Quick Navigation Sticky Sidebar */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-20 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-200 dark:border-slate-800">
              Contents (16 Sections)
            </span>
            <nav className="max-h-[65vh] overflow-y-auto space-y-1 text-xs pr-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`block px-2.5 py-1.5 rounded-lg transition-colors truncate ${
                    activeSection === sec.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-indigo-500 mr-1.5">{sec.number}.</span>
                  <span>{sec.title}</span>
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Request Data Erasure</span>
              </button>
            </div>
          </div>
        </div>

        {/* Policy Text Body */}
        <div className="lg:col-span-3 space-y-8 bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          
          {/* SECTION 1 */}
          <section id="sec-1" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                01
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                1. Our Privacy Commitment
              </h2>
            </div>
            <p>At Collégé, we respect your privacy.</p>
            <p>
              We collect and process personal information only for specified purposes connected with registration, college verification, profile functionality, communication, safety and platform operations.
            </p>
            
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 font-medium">
              <strong>We do not sell your personal information, rent your personal data to advertisers or reuse your photographs for unrelated purposes or advertising without appropriate permission.</strong>
            </div>

            <p>Your personal information is not publicly displayed just because you register.</p>
            <p>
              We take reasonable technical and organisational measures to protect information under our control.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              However, no online platform can guarantee absolute security.
            </p>
          </section>

          {/* SECTION 2 */}
          <section id="sec-2" className="scroll-mt-24 space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                02
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                2. Information We Collect
              </h2>
            </div>
            <p>Depending on the features you use, we may collect:</p>

            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-500" />
                  <span>A. Personal Information</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Full name.</li>
                  <li>Email address.</li>
                  <li>Mobile number.</li>
                  <li>Date of birth or age.</li>
                  <li>Gender, where provided.</li>
                  <li>Profile details.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>B. Educational Information</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>College or university name.</li>
                  <li>Course or department.</li>
                  <li>Academic year.</li>
                  <li>Student verification information.</li>
                  <li>College verification documents.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>C. Photographs and Media</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Three profile photographs submitted during registration.</li>
                  <li>Additional profile photographs, where supported.</li>
                  <li>Images uploaded to Campus Board.</li>
                  <li>Voice recordings and voice messages, where supported.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>D. Preferences and Profile Information</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Discovery preferences.</li>
                  <li>Interests.</li>
                  <li>Hobbies.</li>
                  <li>Biography.</li>
                  <li>Connection preferences.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>E. Communication Information</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Messages exchanged through Collégé.</li>
                  <li>Voice-message metadata and stored audio.</li>
                  <li>Conversation and delivery information.</li>
                  <li>Reports and moderation information.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-rose-500" />
                  <span>F. Technical Information</span>
                </h3>
                <p className="text-xs mb-1.5">We may collect necessary technical information such as:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>IP address.</li>
                  <li>Browser type.</li>
                  <li>Device information.</li>
                  <li>Login and session information.</li>
                  <li>Security logs.</li>
                  <li>Error and diagnostic information.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="sec-3" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                03
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                3. Why We Collect Your Information
              </h2>
            </div>
            <p>We use personal information for the following purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                1. To create and manage student registrations.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                2. To verify college-related information.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                3. To review and approve student accounts.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                4. To create and manage student profiles.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                5. To provide discovery and matching features.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                6. To enable text and voice messaging.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                7. To operate Campus Board.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                8. To prevent fake accounts, spam and abuse.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                9. To investigate reports and safety incidents.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                10. To maintain platform security.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                11. To provide customer support.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                12. To comply with applicable legal obligations.
              </div>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white pt-2">
              We do not use personal information for unrelated purposes without an appropriate lawful basis.
            </p>
          </section>

          {/* SECTION 4 */}
          <section id="sec-4" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                04
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                4. How We Store Your Information
              </h2>
            </div>
            <p>Collégé stores relevant information in its database and associated storage systems.</p>
            <p className="font-semibold text-slate-900 dark:text-white">This may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name and contact details.</li>
              <li>College and academic information.</li>
              <li>Profile photographs.</li>
              <li>Verification documents.</li>
              <li>Messages and voice-message files.</li>
              <li>Account and security information.</li>
            </ul>
            <p>
              We use appropriate access controls and security measures designed to protect this information.
            </p>
            <p className="font-semibold text-purple-600 dark:text-purple-400">
              Private documents and account details should only be accessible to authorized personnel and systems for permitted purposes.
            </p>
          </section>

          {/* SECTION 5 */}
          <section id="sec-5" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                05
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                5. Do We Share Your Personal Information?
              </h2>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-200 font-bold space-y-2">
              <p>
                We do not sell your personal information. We do not provide your private contact details to other students, advertisers or unrelated third parties for their own marketing purposes.
              </p>
              <p>
                We do not reuse your personal photographs for unrelated advertising or promotional purposes without appropriate permission.
              </p>
            </div>

            <p className="font-semibold text-slate-900 dark:text-white">
              However, limited processing or disclosure may be necessary in these circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Service providers that provide hosting, database, file storage, security or technical infrastructure under appropriate arrangements.</li>
              <li>Authorized personnel who perform account verification, moderation or support.</li>
              <li>Other students who can see the profile information you choose to make visible.</li>
              <li>Message recipients who receive messages and voice recordings you send.</li>
              <li>Government authorities or other parties where disclosure is required or permitted by applicable law.</li>
            </ul>
            <p className="text-xs text-slate-500">
              We aim to limit such processing and disclosure to what is necessary for the relevant purpose.
            </p>
          </section>

          {/* SECTION 6 */}
          <section id="sec-6" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                06
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                6. Profile Privacy
              </h2>
            </div>
            <p>
              Your approved profile may be visible to eligible Collégé users according to the platform's discovery and privacy settings.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              Your email address, mobile number, password and private college verification documents are not intended to appear in public profiles.
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs">
              <strong>User Caution:</strong> Never publish contact information in your public biography if you do not want other users to see it.
            </div>
          </section>

          {/* SECTION 7 */}
          <section id="sec-7" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                07
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                7. College Verification Documents
              </h2>
            </div>
            <p>
              College verification documents are collected to review eligibility and authenticity.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              They are not intended to be displayed publicly or shared with other students.
            </p>
            <p>
              Access should be restricted to authorized verification personnel and systems.
            </p>
          </section>

          {/* SECTION 8 */}
          <section id="sec-8" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                08
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                8. Messages and Voice Recordings
              </h2>
            </div>
            <p>
              Messages and voice recordings are processed to provide communication services.
            </p>
            <p>
              Messages are intended to be accessible to the relevant conversation participants, subject to applicable safety, moderation and legal requirements.
            </p>
            <p className="text-rose-600 dark:text-rose-400 font-medium">
              Do not send sensitive information to another person unless you are comfortable sharing it with that person.
            </p>
          </section>

          {/* SECTION 9 */}
          <section id="sec-9" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                09
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                9. Data Security
              </h2>
            </div>
            <p>
              We take reasonable measures to protect user information, including appropriate authentication, access restrictions, secure communication and protected storage where implemented.
            </p>
            <p>
              We regularly aim to improve the security of our services.
            </p>
            <p className="italic text-slate-500">
              Despite these measures, internet-based systems cannot be guaranteed to be completely secure.
            </p>
            <p>
              If a personal data breach occurs, we will handle notifications and other required actions in accordance with applicable law.
            </p>
          </section>

          {/* SECTION 10 */}
          <section id="sec-10" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                10
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                10. Data Retention and Deletion
              </h2>
            </div>
            <p>
              We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, subject to applicable legal requirements.
            </p>
            <p>
              If you request account deletion or withdraw consent where applicable, we will process the request according to applicable law.
            </p>
            <p>
              Some information may need to be retained for legal obligations, dispute resolution, security investigations or other lawful purposes.
            </p>
            <p>
              Where appropriate, information will be erased or access restricted when it is no longer required.
            </p>
          </section>

          {/* SECTION 11 */}
          <section id="sec-11" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                11
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                11. Your Privacy Rights
              </h2>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Subject to applicable law, you may have rights to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Request information about personal data we process.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request updating of incomplete information.</li>
              <li>Request erasure of personal information where applicable.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Raise privacy complaints.</li>
              <li>Nominate another person where provided by applicable law.</li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Exercise Your Privacy Rights Now</span>
              </button>
            </div>
          </section>

          {/* SECTION 12 */}
          <section id="sec-12" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                12
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                12. Cookies and Similar Technologies
              </h2>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Collégé may use cookies or similar technologies where necessary for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Login sessions.</li>
              <li>Account security.</li>
              <li>Website functionality.</li>
              <li>User preferences.</li>
              <li>Technical diagnostics.</li>
            </ul>
            <p>
              Any optional analytics or marketing technologies should be disclosed and managed according to applicable requirements.
            </p>
          </section>

          {/* SECTION 13 */}
          <section id="sec-13" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                13
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                13. Third-Party Services
              </h2>
            </div>
            <p>Some platform services may depend on third-party infrastructure providers.</p>
            <p>Such providers may process limited information necessary to provide their services.</p>
            <p>Their processing is subject to applicable contracts, security arrangements and privacy requirements.</p>
            <p className="text-xs text-slate-500">
              Collégé is not responsible for the independent privacy practices of external websites you choose to visit.
            </p>
          </section>

          {/* SECTION 14 */}
          <section id="sec-14" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                14
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                14. Children's Privacy
              </h2>
            </div>
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-semibold">
              Collégé is intended exclusively for individuals aged 18 years or older.
            </div>
            <p>We do not knowingly permit individuals under 18 to register or use the platform.</p>
            <p>
              If we discover an account belonging to an underage individual, we may restrict or remove it and handle associated information in accordance with applicable law.
            </p>
          </section>

          {/* SECTION 15 */}
          <section id="sec-15" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                15
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                15. Changes to This Privacy Policy
              </h2>
            </div>
            <p>We may update this Privacy Policy to reflect changes in our services, technology or applicable legal requirements.</p>
            <p>The latest version will be published on this page with its effective date.</p>
          </section>

          {/* SECTION 16 */}
          <section id="sec-16" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                16
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                16. Contact and Privacy Complaints
              </h2>
            </div>
            <p>
              For privacy questions, data correction requests, account deletion requests or complaints, contact the Collégé support team through the official support details published on the website.
            </p>
            
            <div className="p-5 bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 dark:from-purple-950/30 dark:via-slate-800 dark:to-indigo-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/50 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Designated Grievance & Privacy Officer
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    India DPDP Act (2023) Statutory Compliance Desk
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Open Request Form
                </button>
              </div>
              <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 pt-2 border-t border-purple-100 dark:border-purple-900/40">
                <p className="flex items-center flex-wrap gap-1 font-medium">
                  <span>Official Collégé Helpdesk & Legal Cell: contact</span>
                  <button
                    type="button"
                    onClick={() => setIsAkitsModalOpen(true)}
                    className="font-bold text-purple-600 dark:text-purple-400 underline decoration-purple-500/50 hover:decoration-purple-300 underline-offset-2 transition-all cursor-pointer inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 bg-purple-100/70 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60"
                    title="Click to view AKITS contact info, phone and WhatsApp"
                  >
                    <span>AKITS</span>
                  </button>
                  <span>Team</span>
                </p>
                <p>Direct Contact Phone: <a href="tel:8972460400" className="text-purple-600 dark:text-purple-400 font-semibold underline">8972460400</a> • Official WhatsApp: <a href="https://wa.me/918972460400" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 font-semibold underline">918972460400</a></p>
                <p>Statutory Resolution Timeframe: Within 72 hours of registered ticket receipt.</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Interactive Privacy Request / Account Deletion Modal */}
      <PrivacyRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* AKITS Company Information, Contact & Portfolio Modal */}
      <AkitsModal
        isOpen={isAkitsModalOpen}
        onClose={() => setIsAkitsModalOpen(false)}
      />

    </div>
  );
};

export default PrivacyPolicyPage;

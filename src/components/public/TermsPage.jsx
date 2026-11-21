import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Clock,
  Printer,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Users
} from 'lucide-react';
import AkitsModal from '../layout/AkitsModal';

export const TermsPage = () => {
  const { navigateTo } = useApp();
  const [activeSection, setActiveSection] = useState(null);
  const [isAkitsModalOpen, setIsAkitsModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'sec-1', number: '1', title: 'Introduction' },
    { id: 'sec-2', number: '2', title: 'Eligibility' },
    { id: 'sec-3', number: '3', title: 'Registration and Account Verification' },
    { id: 'sec-4', number: '4', title: 'Account Responsibility' },
    { id: 'sec-5', number: '5', title: 'Profile Information and Visibility' },
    { id: 'sec-6', number: '6', title: 'Discovery, Likes and Matching' },
    { id: 'sec-7', number: '7', title: 'Messaging and Voice Messages' },
    { id: 'sec-8', number: '8', title: 'Campus Board' },
    { id: 'sec-9', number: '9', title: 'Blocking and Reporting' },
    { id: 'sec-10', number: '10', title: 'Prohibited Activities' },
    { id: 'sec-11', number: '11', title: 'User-Generated Content' },
    { id: 'sec-12', number: '12', title: 'Account Suspension and Termination' },
    { id: 'sec-13', number: '13', title: 'Service Availability' },
    { id: 'sec-14', number: '14', title: 'Limitation of Responsibility' },
    { id: 'sec-15', number: '15', title: 'Changes to Terms' },
    { id: 'sec-16', number: '16', title: 'Governing Law' },
    { id: 'sec-17', number: '17', title: 'Contact' },
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
            onClick={() => navigateTo('privacy')}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            View Privacy Policy
          </button>
          <span className="text-slate-400">•</span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Print Terms"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Document</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white border border-slate-800 shadow-xl mb-8 overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Scale className="w-3.5 h-3.5" />
            <span>Binding Legal Agreement • Adult Student Platform</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
            Terms & Conditions
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Please read these Terms carefully before registering with or using Collégé. These Terms define the mutual rights, responsibilities and rules governing student access, discovery, messaging and verification.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-[11px] text-slate-400 border-t border-slate-800/80">
            <span><strong>Document Version:</strong> 2.4</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> November 21, 2026</span>
            <span>•</span>
            <span><strong>Jurisdiction:</strong> India</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Quick Navigation Sticky Sidebar */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-20 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-200 dark:border-slate-800">
              Contents (17 Sections)
            </span>
            <nav className="max-h-[70vh] overflow-y-auto space-y-1 text-xs pr-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`block px-2.5 py-1.5 rounded-lg transition-colors truncate ${activeSection === sec.id
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span className="font-mono text-purple-500 mr-1.5">{sec.number}.</span>
                  <span>{sec.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Legal Text Body */}
        <div className="lg:col-span-3 space-y-8 bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed text-xs sm:text-sm text-slate-700 dark:text-slate-300">

          {/* SECTION 1 */}
          <section id="sec-1" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                01
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                1. Introduction
              </h2>
            </div>
            <p>Welcome to Collégé, a college-focused social networking and student connection platform.</p>
            <p>These Terms & Conditions govern your access to and use of the Collégé website, applications, features and services.</p>
            <p>By registering, accessing or using Collégé, you agree to these Terms & Conditions and our Privacy Policy.</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              If you do not agree, please do not use the platform.
            </p>
          </section>

          {/* SECTION 2 */}
          <section id="sec-2" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                02
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                2. Eligibility
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>You must be at least 18 years old to register.</strong></li>
              <li>You must provide accurate and genuine information.</li>
              <li>You must use your own account.</li>
              <li>You must not impersonate another student.</li>
              <li>You must not create accounts using fake or misleading identities.</li>
              <li>Collégé may request college verification documents to establish eligibility.</li>
            </ul>
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Users below 18 years of age are not permitted to register.</span>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="sec-3" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                03
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                3. Registration and Account Verification
              </h2>
            </div>
            <p>
              Registration requires the information requested in the registration form, including your name, email, mobile number, college details, profile information, three profile photographs and a college verification document.
            </p>
            <p>
              Submitting registration does not automatically create an active student account.
            </p>
            <p>
              Your application will initially remain pending until an authorized Collégé administrator reviews it.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">The administrator may:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Approve your application.</li>
              <li>Reject your application.</li>
              <li>Request additional or corrected information.</li>
            </ul>
            <p>
              Only approved accounts can access protected student features.
            </p>
            <p className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/30 text-xs">
              Collégé does not require OTP verification for its standard registration approval and login workflow. Users must protect their login credentials.
            </p>
          </section>

          {/* SECTION 4 */}
          <section id="sec-4" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                04
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                4. Account Responsibility
              </h2>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Keeping your login credentials confidential.</li>
              <li>Providing accurate information.</li>
              <li>Maintaining the security of your account.</li>
              <li>Reporting suspected unauthorized account access.</li>
              <li>Using Collégé responsibly.</li>
            </ul>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              You must not share your account or allow another person to impersonate you.
            </p>
          </section>

          {/* SECTION 5 */}
          <section id="sec-5" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                05
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                5. Profile Information and Visibility
              </h2>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">Approved users may display profile information such as:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Display name.</li>
              <li>Age.</li>
              <li>Profile photographs.</li>
              <li>College and course.</li>
              <li>Biography.</li>
              <li>Interests and hobbies.</li>
              <li>Other profile information made visible through your settings.</li>
            </ul>
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-bold text-slate-900 dark:text-white mb-1">Confidentiality Guarantee:</p>
              <p>
                Your private information, including your email address, mobile number, password and college verification documents, must not be exposed through public profile APIs.
              </p>
            </div>
            <p className="text-xs">
              Do not upload photographs or information that you do not have permission to use.
            </p>
          </section>

          {/* SECTION 6 */}
          <section id="sec-6" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                06
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                6. Discovery, Likes and Matching
              </h2>
            </div>
            <p>Collégé provides student discovery and connection features.</p>
            <p>Users may discover other eligible profiles based on available preferences.</p>
            <p>Sending a like does not automatically establish a match.</p>
            <p className="font-semibold text-purple-600 dark:text-purple-400">
              A connection becomes an accepted match only when the receiving student explicitly accepts the request.
            </p>
            <p>A receiving student may accept or reject a request.</p>
            <p>Messaging is available only when the platform has established an accepted match, subject to applicable safety restrictions.</p>
          </section>

          {/* SECTION 7 */}
          <section id="sec-7" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                07
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                7. Messaging and Voice Messages
              </h2>
            </div>
            <p>Users may exchange text and voice messages with accepted matches.</p>
            <p className="font-semibold text-slate-900 dark:text-white">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Harass or threaten other users.</li>
              <li>Send abusive or discriminatory messages.</li>
              <li>Send unsolicited inappropriate material.</li>
              <li>Share another person's private information without permission.</li>
              <li>Use messages for spam, fraud or unlawful activities.</li>
            </ul>
            <p>
              Collégé may investigate reports of misuse and restrict accounts where appropriate.
            </p>
          </section>

          {/* SECTION 8 */}
          <section id="sec-8" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                08
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                8. Campus Board
              </h2>
            </div>
            <p>
              Campus Board allows eligible students to publish announcements for their verified college community.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">Users must:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Publish genuine and relevant announcements.</li>
              <li>Respect other students.</li>
              <li>Avoid spam and misleading content.</li>
              <li>Respect the daily publishing limit displayed by the platform.</li>
              <li>Publish only content they have permission to share.</li>
            </ul>
            <p className="font-semibold text-slate-900 dark:text-white">
              Users are responsible for the content they publish.
            </p>
          </section>

          {/* SECTION 9 */}
          <section id="sec-9" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                09
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                9. Blocking and Reporting
              </h2>
            </div>
            <p>
              Users can block or report accounts they believe are unsafe, abusive, fraudulent or inappropriate.
            </p>
            <p>Reports may be reviewed by authorized administrators.</p>
            <p>
              Collégé may investigate reports and take appropriate action, including content removal, account suspension or account termination.
            </p>
            <p className="font-semibold text-rose-600 dark:text-rose-400">
              Do not misuse the reporting system to harass or falsely accuse other users.
            </p>
          </section>

          {/* SECTION 10 */}
          <section id="sec-10" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                10
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                10. Prohibited Activities
              </h2>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">You must not:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Create fake accounts.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Impersonate another individual.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Harass, stalk, threaten or intimidate users.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Publish illegal, defamatory or abusive material.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Share private photographs or info without permission.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Attempt to hack or disrupt the platform.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Upload malware or malicious files.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Bypass account verification.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Scrape or collect user information without authorization.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                • Use the platform for scams, spam or fraud.
              </div>
            </div>
          </section>

          {/* SECTION 11 */}
          <section id="sec-11" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                11
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                11. User-Generated Content
              </h2>
            </div>
            <p>
              You retain ownership of content you create and upload, subject to applicable law and any rights of other people.
            </p>
            <p>
              By uploading content, you give Collégé a limited permission to host, store, process and display that content as necessary to operate the services and according to your privacy and visibility settings.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              This permission is not a transfer of ownership.
            </p>
            <p>
              Collégé does not claim ownership of your personal photographs or messages.
            </p>
          </section>

          {/* SECTION 12 */}
          <section id="sec-12" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                12
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                12. Account Suspension and Termination
              </h2>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">Collégé may restrict, suspend or terminate accounts for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violations of these Terms.</li>
              <li>Fake or misleading registration information.</li>
              <li>Harassment or abuse.</li>
              <li>Fraudulent activities.</li>
              <li>Security risks.</li>
              <li>Legal requirements.</li>
            </ul>
            <p>
              Where appropriate, users may be given an opportunity to correct issues or appeal an administrative decision.
            </p>
          </section>

          {/* SECTION 13 */}
          <section id="sec-13" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                13
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                13. Service Availability
              </h2>
            </div>
            <p>Collégé aims to provide reliable services but cannot guarantee uninterrupted availability.</p>
            <p>Maintenance, technical failures, internet connectivity, hosting problems or security incidents may temporarily affect services.</p>
            <p>We may update, modify or discontinue features where reasonably necessary.</p>
          </section>

          {/* SECTION 14 */}
          <section id="sec-14" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                14
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                14. Limitation of Responsibility
              </h2>
            </div>
            <p>Collégé provides a platform for student interaction and connections.</p>
            <p>We do not guarantee that every profile, statement or interaction between users is genuine or accurate.</p>
            <p>Users are responsible for exercising caution when interacting with other people.</p>
            <p>
              To the extent permitted by applicable law, Collégé is not responsible for indirect losses arising from user interactions, third-party conduct or temporary service interruptions.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              Nothing in these Terms excludes liability that cannot legally be excluded.
            </p>
          </section>

          {/* SECTION 15 */}
          <section id="sec-15" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                15
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                15. Changes to Terms
              </h2>
            </div>
            <p>Collégé may update these Terms when its features, services or legal requirements change.</p>
            <p>Updated Terms will be published on this page with a revised effective date.</p>
            <p>
              Continued use after applicable changes take effect will be subject to the updated Terms, as permitted by law.
            </p>
          </section>

          {/* SECTION 16 */}
          <section id="sec-16" className="scroll-mt-24 space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                16
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                16. Governing Law
              </h2>
            </div>
            <p>These Terms are governed by the applicable laws of India.</p>
            <p>
              Disputes will be subject to the jurisdiction of competent courts in the appropriate jurisdiction, subject to applicable law.
            </p>
          </section>

          {/* SECTION 17 */}
          <section id="sec-17" className="scroll-mt-24 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                17
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                17. Contact
              </h2>
            </div>
            <p>
              For questions, complaints or account-related concerns, contact the Collégé support team through the official contact details published on the website.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 mt-4 text-xs">
              <p className="font-bold text-slate-900 dark:text-white flex items-center flex-wrap gap-1">
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
              <p className="text-slate-600 dark:text-slate-400">
                Direct Contact Phone: <a href="tel:8972460400" className="text-purple-600 dark:text-purple-400 font-semibold underline">8972460400</a> • Official WhatsApp: <a href="https://wa.me/918972460400" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 font-semibold underline">918972460400</a>
              </p>
              <p className="text-slate-600 dark:text-slate-400">Platform Support: Available daily for registered and prospective students.</p>
            </div>
          </section>

        </div>
      </div>

      {/* AKITS Company Information, Contact & Portfolio Modal */}
      <AkitsModal
        isOpen={isAkitsModalOpen}
        onClose={() => setIsAkitsModalOpen(false)}
      />

    </div>
  );
};

export default TermsPage;

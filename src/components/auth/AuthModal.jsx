import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_INTENTIONS } from '../../services/mockData';
import {
  ShieldCheck,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  Mail,
  Phone,
  Image as ImageIcon,
  FileCheck2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building,
  Search,
  PlusCircle,
  HelpCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
];

const PRESET_IDS = [
  'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?auto=format&fit=crop&w=800&q=80'
];

export const AuthModal = ({ isOpen, onClose }) => {
  const {
    authModalMode,
    loginWithCredentials,
    registerStudent,
    resubmitVerification,
    collegesList,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState(authModalMode || 'login'); // 'login' | 'register'
  const [step, setStep] = useState(1);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [applicantStatusView, setApplicantStatusView] = useState(null); // when applicant checks status or logs in while pending

  // Registration Multi-Step State (Steps 1 to 6)
  const [formData, setFormData] = useState({
    // STEP 1: Personal Information
    legal_name: '',
    display_name: '',
    date_of_birth: '',
    age: 0,
    email: '',
    mobile: '',
    gender: 'Female',
    city: 'Kolkata',
    state: 'West Bengal',
    languages_spoken: ['English', 'Bengali'],
    password: '',

    // STEP 2: College and Education Information
    college_name: '',
    university_name: '',
    college_location: 'Kolkata',
    college_state: 'West Bengal',
    degree_name: 'B.Tech / B.E.',
    department_stream: 'Computer Science',
    academic_year: '3rd Year',
    current_semester: 'Semester 6',
    graduation_year: 2026,
    student_status: 'CURRENTLY_STUDYING',

    // STEP 3: Identity Verification Document
    verification_id_type: 'College Student ID',
    verification_id_url: PRESET_IDS[0],
    document_consent: true,

    // STEP 4: Profile Photographs (Exactly THREE required)
    photo_1: PRESET_PHOTOS[0], // Main Profile Picture
    photo_2: PRESET_PHOTOS[1], // Additional Personal Photo 1
    photo_3: PRESET_PHOTOS[2], // Additional Personal Photo 2

    // STEP 5: About Me & Connection Preferences
    bio: '',
    interests: ['Music', 'Travelling', 'Coding'],
    hobbies: ['Reading', 'Gaming'],
    personality: 'Ambivert & curious',
    looking_for: 'Dating',
    age_range_min: 19,
    age_range_max: 25,
    preferred_distance: 'SAME_CITY',

    // STEP 6: Consents & DPDP Compliance
    termsAccepted: false,
    privacyAccepted: false,
    ageConfirmed18Plus: false,
    verificationConsent: false
  });

  const [ageError, setAgeError] = useState('');
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [showRequestCollegeModal, setShowRequestCollegeModal] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');

  // Correction Resubmission State
  const [correctionTarget, setCorrectionTarget] = useState(null);

  if (!isOpen) return null;

  // DOB 18+ Legal Verification
  const handleDobChange = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setAgeError('Must be at least 18 years old to apply under Indian DPDP Act & Collégé safety terms.');
    } else {
      setAgeError('');
    }

    setFormData({ ...formData, date_of_birth: dob, age: calculatedAge });
  };

  // Login submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setApplicantStatusView(null);

    const result = loginWithCredentials(loginIdentifier, loginPassword);

    if (result.success) {
      onClose();
    } else if (['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED', 'REJECTED'].includes(result.status)) {
      setApplicantStatusView(result);
    } else {
      addToast(result.message, 'error');
    }
  };

  // Full 6-Step Registration submission
  const handleFinalSubmit = (e) => {
    e.preventDefault();

    if (formData.age < 18) {
      addToast('Cannot apply: Must be at least 18 years old.', 'error');
      return;
    }
    if (!formData.college_name) {
      addToast('College / University name is mandatory.', 'warning');
      return;
    }
    if (!formData.photo_1 || !formData.photo_2 || !formData.photo_3) {
      addToast('Exactly THREE photographs are required (Photo 1, Photo 2, Photo 3).', 'warning');
      return;
    }
    if (!formData.verification_id_url) {
      addToast('Identity verification document is mandatory.', 'warning');
      return;
    }
    if (!formData.termsAccepted || !formData.privacyAccepted || !formData.ageConfirmed18Plus || !formData.verificationConsent) {
      addToast('You must acknowledge all terms, 18+ eligibility, and 72-hour manual review consent.', 'warning');
      return;
    }

    const result = registerStudent(formData);
    if (result.success) {
      setApplicantStatusView({
        status: 'PENDING_REVIEW',
        student: result.student,
        message: result.message
      });
      addToast(`Application ${result.applicationId} submitted for manual human review! 📋`, 'success');
    } else {
      addToast(result.message, 'warning');
    }
  };

  // Resubmit corrections requested by Admin
  const handleResubmitCorrection = (e) => {
    e.preventDefault();
    if (!correctionTarget) return;

    resubmitVerification(correctionTarget.id, {
      college_name: formData.college_name,
      verification_id_url: formData.verification_id_url,
      verification_id_type: formData.verification_id_type,
      photo_1: formData.photo_1,
      photo_2: formData.photo_2,
      photo_3: formData.photo_3,
      bio: formData.bio
    });

    setApplicantStatusView({
      status: 'RESUBMITTED',
      student: { ...correctionTarget, status: 'RESUBMITTED' },
      message: 'Your corrected details have been resubmitted to the campus verification team!'
    });
    setCorrectionTarget(null);
  };

  // Filtered colleges list
  const filteredColleges = collegesList.filter((c) =>
    c.name.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(collegeSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up max-h-[94vh] overflow-y-auto">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('login');
                setApplicantStatusView(null);
                setCorrectionTarget(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'login'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setApplicantStatusView(null);
                setCorrectionTarget(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'register'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Apply to Join (72h Review)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ====================================================================== */}
        {/* 1. APPLICANT DASHBOARD (STATUS TIMELINE VIEW - 72-HOUR LIFECYCLE) */}
        {/* ====================================================================== */}
        {applicantStatusView ? (
          <div className="my-5 space-y-4 animate-fade-in text-xs">
            
            {/* Top Status Banner */}
            <div
              className={`p-4 rounded-2xl border text-center space-y-2 ${
                applicantStatusView.status === 'APPROVED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : applicantStatusView.status === 'NEEDS_CORRECTION'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                  : applicantStatusView.status === 'REJECTED'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-5 h-5 animate-pulse text-indigo-600 dark:text-indigo-400" />
                <span className="font-extrabold uppercase tracking-wider text-[11px]">
                  Application Status: {applicantStatusView.status}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg">
                Application ID: {applicantStatusView.student?.application_id || 'COL-2026-SUBMITTED'}
              </h3>
              <p className="text-[11px] leading-relaxed max-w-md mx-auto opacity-90">
                {applicantStatusView.message}
              </p>
            </div>

            {/* 5-Step Visual Progress Timeline */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">
                72-Hour Verification Progress Timeline:
              </span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { step: 1, label: 'Registered', done: true },
                  { step: 2, label: 'Submitted', done: true },
                  {
                    step: 3,
                    label: 'Admin Check',
                    done: ['UNDER_REVIEW', 'NEEDS_CORRECTION', 'APPROVED', 'REJECTED'].includes(applicantStatusView.status),
                    current: applicantStatusView.status === 'PENDING_REVIEW' || applicantStatusView.status === 'UNDER_REVIEW'
                  },
                  {
                    step: 4,
                    label: 'Decision',
                    done: ['APPROVED', 'REJECTED'].includes(applicantStatusView.status),
                    current: applicantStatusView.status === 'NEEDS_CORRECTION'
                  },
                  {
                    step: 5,
                    label: 'Activated',
                    done: applicantStatusView.status === 'APPROVED'
                  }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                        item.done
                          ? 'bg-emerald-500 text-white'
                          : item.current
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {item.done ? '✓' : item.step}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Target & Deadline Information */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">TARGET REVIEW TIME</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Up to 72 Hours</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SUBMISSION DATE</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(applicantStatusView.student?.submitted_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Correction Request Section if status === 'NEEDS_CORRECTION' */}
            {applicantStatusView.status === 'NEEDS_CORRECTION' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Admin Feedback & Correction Instructions:</span>
                </div>
                <p className="p-2.5 bg-white/80 dark:bg-black/30 rounded-xl text-slate-700 dark:text-slate-300 font-medium">
                  "{applicantStatusView.reason || applicantStatusView.student?.correction_message}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCorrectionTarget(applicantStatusView.student);
                    setActiveTab('register');
                    setStep(3); // Jump to document/photo step to correct
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Edit & Resubmit Application
                </button>
              </div>
            )}

            {/* Approved Account Activation Button */}
            {applicantStatusView.status === 'APPROVED' && (
              <button
                type="button"
                onClick={() => {
                  loginWithCredentials(applicantStatusView.student.email, 'Password@2026');
                  onClose();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md"
              >
                Activate Account & Enter Collégé 🎓
              </button>
            )}

            <button
              type="button"
              onClick={() => setApplicantStatusView(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Back to Login
            </button>
          </div>
        ) : activeTab === 'login' ? (
          /* ====================================================================== */
          /* 2. LOG IN TAB (GATED ACCESS WITH STATUS NOTICES) */
          /* ====================================================================== */
          <div className="my-5 space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                Log In to Collégé
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Only manually verified, approved student accounts have access to Collégé.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gmail Address, Mobile Number, or Application ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="student@gmail.com, 9830123456 or COL-2026-XXXXXX"
                    className="w-full p-2.5 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 gradient-brand-bg text-white font-bold rounded-xl shadow-md hover:brightness-105 flex items-center justify-center gap-1.5 text-sm"
              >
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Test Demo Shortcuts to explore all 72-hour verification states */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Simulated Accounts (Explore Statuses):
              </span>
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('anirban@iitkgp.ac.in');
                    setLoginPassword('password123');
                  }}
                  className="p-2 text-left bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Anirban Mukherjee (Approved & Active)</span>
                    <span className="block text-[10px] opacity-80 text-emerald-700 dark:text-emerald-400">anirban@iitkgp.ac.in • IIT Kharagpur</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('sourav.ganguly@gmail.com');
                    setLoginPassword('password123');
                  }}
                  className="p-2 text-left bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-indigo-800 dark:text-indigo-300">Sourav Ganguly (In 72h Review)</span>
                    <span className="block text-[10px] opacity-80 text-indigo-700 dark:text-indigo-400">sourav.ganguly@gmail.com • St. Xavier's</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                    72h Queue
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('debolina.bose@gmail.com');
                    setLoginPassword('password123');
                  }}
                  className="p-2 text-left bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-amber-800 dark:text-amber-300">Debolina Bose (Needs Correction)</span>
                    <span className="block text-[10px] opacity-80 text-amber-700 dark:text-amber-400">debolina.bose@gmail.com • Jadavpur Univ</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                    Correction
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ====================================================================== */
          /* 3. MULTI-STEP 6-STEP REGISTRATION WORKFLOW */
          /* ====================================================================== */
          <div className="my-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                  STEP {step} OF 6
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {step === 1 && 'Step 1: Personal Info & 18+ Verification'}
                  {step === 2 && 'Step 2: College & Education Details'}
                  {step === 3 && 'Step 3: Identity Verification Document'}
                  {step === 4 && 'Step 4: Exactly THREE Profile Photographs'}
                  {step === 5 && 'Step 5: About Me & Connection Preferences'}
                  {step === 6 && 'Step 6: Consent & Final 72-Hour Submission'}
                </h3>
              </div>
            </div>

            {/* STEP 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name (Must match College / Govt ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="As printed on student records"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Display Name (Visible to campus matches)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="What friends call you"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth (India DPDP Act: 18+ Verification Required)
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  {formData.age > 0 && !ageError && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">
                      ✓ Age: {formData.age} years old (Eligible 18+)
                    </p>
                  )}
                  {ageError && <p className="text-[11px] text-rose-500 font-bold mt-1">{ageError}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@gmail.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number (+91)
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="9830123456"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <button
                  type="button"
                  disabled={!formData.legal_name || !formData.email || !formData.mobile || formData.age < 18}
                  onClick={() => setStep(2)}
                  className="w-full py-3 mt-3 gradient-brand-bg text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Next: College & Education</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: College and Education Information */}
            {step === 2 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Search & Select College / Institution
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={collegeSearchQuery}
                      onChange={(e) => setCollegeSearchQuery(e.target.value)}
                      placeholder="Type college name (e.g. IIT, Xavier's, Jadavpur)..."
                      className="w-full p-2 pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Searchable Options */}
                  <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredColleges.map((col) => (
                      <div
                        key={col.id || col.name}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            college_name: col.name,
                            university_name: col.university || col.universityName || col.name
                          });
                          setCollegeSearchQuery(col.name);
                        }}
                        className={`p-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                          formData.college_name === col.name
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <span>{col.name}</span>
                          <span className="block text-[10px] text-slate-400">{col.city}, {col.state}</span>
                        </div>
                        {formData.college_name === col.name && <Check className="w-4 h-4 text-rose-500" />}
                      </div>
                    ))}
                  </div>

                  {/* Request New College Option */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500">Institution missing?</span>
                    <button
                      type="button"
                      onClick={() => setShowRequestCollegeModal(true)}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Request New College Entry
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Degree / Course
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.degree_name}
                      onChange={(e) => setFormData({ ...formData, degree_name: e.target.value })}
                      placeholder="e.g. B.Tech / B.Com / M.A."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department / Stream
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department_stream}
                      onChange={(e) => setFormData({ ...formData, department_stream: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current Academic Year
                    </label>
                    <select
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value, 10) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!formData.college_name || !formData.degree_name}
                    onClick={() => setStep(3)}
                    className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Next: Verification ID Document
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Identity Verification Document */}
            {step === 3 && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-rose-500" />
                      Select Identity Document Type
                    </label>
                    <select
                      value={formData.verification_id_type}
                      onChange={(e) => setFormData({ ...formData, verification_id_type: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="College Student ID">College Student ID Card (Preferred)</option>
                      <option value="Govt Voter ID">Govt Voter ID Card</option>
                      <option value="Aadhaar Document (Masked)">Aadhaar Document (Masked first 8 digits)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      Document Image URL / Scan
                    </label>
                    <input
                      type="text"
                      value={formData.verification_id_url}
                      onChange={(e) => setFormData({ ...formData, verification_id_url: e.target.value })}
                      placeholder="Paste private image URL"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  {formData.verification_id_url && (
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <img
                        src={formData.verification_id_url}
                        alt="ID Preview"
                        className="w-20 h-14 object-cover rounded-lg border shadow-xs"
                      />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          ✓ {formData.verification_id_type} Attached
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Private encrypted storage. Inspected strictly by authorized human admins.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                    * Never store unmasked identity numbers. Only college/educational credentials and masked identity documents are accepted.
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!formData.verification_id_url}
                    onClick={() => setStep(4)}
                    className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Next: Exactly 3 Photographs
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Exactly THREE Profile Photographs */}
            {step === 4 && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-rose-500" />
                      Mandatory Profile Photographs (Exactly THREE Required)
                    </label>
                    <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-extrabold px-2 py-0.5 rounded-full">
                      3 Required
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Photo 1 */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Photo 1 (Avatar)</span>
                      <img
                        src={formData.photo_1}
                        alt="Photo 1"
                        className="w-full h-24 object-cover rounded-xl border-2 border-rose-400 shadow-xs"
                      />
                      <input
                        type="text"
                        value={formData.photo_1}
                        onChange={(e) => setFormData({ ...formData, photo_1: e.target.value })}
                        className="w-full p-1 text-[9px] bg-white dark:bg-slate-900 border rounded-lg"
                      />
                    </div>

                    {/* Photo 2 */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Photo 2 (Personal 1)</span>
                      <img
                        src={formData.photo_2}
                        alt="Photo 2"
                        className="w-full h-24 object-cover rounded-xl border-2 border-rose-400 shadow-xs"
                      />
                      <input
                        type="text"
                        value={formData.photo_2}
                        onChange={(e) => setFormData({ ...formData, photo_2: e.target.value })}
                        className="w-full p-1 text-[9px] bg-white dark:bg-slate-900 border rounded-lg"
                      />
                    </div>

                    {/* Photo 3 */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Photo 3 (Personal 2)</span>
                      <img
                        src={formData.photo_3}
                        alt="Photo 3"
                        className="w-full h-24 object-cover rounded-xl border-2 border-rose-400 shadow-xs"
                      />
                      <input
                        type="text"
                        value={formData.photo_3}
                        onChange={(e) => setFormData({ ...formData, photo_3: e.target.value })}
                        className="w-full p-1 text-[9px] bg-white dark:bg-slate-900 border rounded-lg"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    * All three images are stored privately and verified by human administrators before public profile creation.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!formData.photo_1 || !formData.photo_2 || !formData.photo_3}
                    onClick={() => setStep(5)}
                    className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Next: Preferences & Bio
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: About Me & Connection Preferences */}
            {step === 5 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Biography
                  </label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell campus peers about your passions, studies, and what makes you happy..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    What are you looking for right now?
                  </label>
                  <select
                    value={formData.looking_for}
                    onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Friendship">Friendship (Casual talks & hangout)</option>
                    <option value="Casual chatting">Casual chatting (Pass free time)</option>
                    <option value="Dating">Dating (Explore romantic connection)</option>
                    <option value="Serious relationship">Serious relationship (Committed intent)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Distance
                    </label>
                    <select
                      value={formData.preferred_distance}
                      onChange={(e) => setFormData({ ...formData, preferred_distance: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="SAME_COLLEGE">Same College</option>
                      <option value="SAME_CITY">Same City</option>
                      <option value="ANYWHERE_INDIA">Anywhere in India</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Age Range
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={18}
                        max={35}
                        value={formData.age_range_min}
                        onChange={(e) => setFormData({ ...formData, age_range_min: parseInt(e.target.value, 10) })}
                        className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min={18}
                        max={40}
                        value={formData.age_range_max}
                        onChange={(e) => setFormData({ ...formData, age_range_max: parseInt(e.target.value, 10) })}
                        className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold"
                  >
                    Next: Review & Final Submission
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Review, Consents & 72-Hour Submission */}
            {step === 6 && (
              <form onSubmit={correctionTarget ? handleResubmitCorrection : handleFinalSubmit} className="space-y-3.5 text-xs">
                
                {/* Summary Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Application Review Summary:
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legal Name:</span>
                    <span className="font-semibold">{formData.legal_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">College:</span>
                    <span className="font-semibold">{formData.college_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Degree & Year:</span>
                    <span className="font-semibold">{formData.degree_name} ({formData.academic_year})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification ID:</span>
                    <span className="font-semibold text-rose-500">{formData.verification_id_type} attached</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Photographs:</span>
                    <span className="font-semibold text-emerald-600">3 Photos Attached ✓</span>
                  </div>
                </div>

                {/* 72h Process Banner */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-900/60 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>72-Hour Manual Verification Process:</strong>
                    <p className="opacity-90">
                      Every applicant is personally checked by an authorized human administrator before account activation. Review takes up to 3 days (72 hours).
                    </p>
                  </div>
                </div>

                {/* Consents Checkbox List */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="termsConsent"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                      required
                      className="w-4 h-4 mt-0.5 accent-rose-500 cursor-pointer"
                    />
                    <label htmlFor="termsConsent" className="text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                      I accept the <span className="text-rose-500 font-semibold">Terms of Service</span> and <span className="text-rose-500 font-semibold">Privacy Policy</span>.
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="age18Consent"
                      checked={formData.ageConfirmed18Plus}
                      onChange={(e) => setFormData({ ...formData, ageConfirmed18Plus: e.target.checked })}
                      required
                      className="w-4 h-4 mt-0.5 accent-rose-500 cursor-pointer"
                    />
                    <label htmlFor="age18Consent" className="text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                      I solemnly confirm that I am at least 18 years old.
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="verificationConsent"
                      checked={formData.verificationConsent}
                      onChange={(e) => setFormData({ ...formData, verificationConsent: e.target.checked })}
                      required
                      className="w-4 h-4 mt-0.5 accent-rose-500 cursor-pointer"
                    />
                    <label htmlFor="verificationConsent" className="text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                      I consent to manual human verification of my college credentials under India's <span className="text-rose-500 font-semibold">DPDP Act, 2023</span>.
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 gradient-brand-bg text-white rounded-xl font-bold shadow-md hover:brightness-105"
                  >
                    {correctionTarget ? 'Resubmit Corrected Application' : 'SUBMIT APPLICATION (72h Review)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Request New College Modal */}
      {showRequestCollegeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full space-y-3 text-xs border border-slate-200 dark:border-slate-800 animate-slide-up">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Request College Entry
            </h4>
            <p className="text-slate-500">
              Enter your college name. It will be recorded for administrative verification.
            </p>
            <input
              type="text"
              value={customCollegeName}
              onChange={(e) => setCustomCollegeName(e.target.value)}
              placeholder="Full college or institute name"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRequestCollegeModal(false)}
                className="px-3 py-1.5 text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customCollegeName.trim()}
                onClick={() => {
                  setFormData({ ...formData, college_name: customCollegeName.trim() });
                  setCollegeSearchQuery(customCollegeName.trim());
                  setShowRequestCollegeModal(false);
                  addToast(`College "${customCollegeName.trim()}" selected and saved for review!`, 'success');
                }}
                className="px-3 py-1.5 bg-rose-500 text-white rounded-lg font-bold"
              >
                Add & Select
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthModal;

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
  HelpCircle,
  AlertTriangle,
  UserCheck,
  Upload,
  Camera,
  Trash2,
  Eye,
  FileText
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
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState(authModalMode || 'login'); // 'login' | 'register'
  const [step, setStep] = useState(1);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [applicantStatusView, setApplicantStatusView] = useState(null); // when applicant checks status or logs in while pending

  // Registration Multi-Step State (Steps 1 to 6)
  // Photo & Verification ID fields start EMPTY so user must enter/upload them
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

    // STEP 3: Identity Verification Document (Upload field - starts EMPTY)
    verification_id_type: 'College Student ID',
    verification_id_url: '',
    verification_id_filename: '',
    document_consent: true,

    // STEP 4: Three Personal Pictures (Upload fields - start EMPTY)
    photo_1: '', // Personal Pic 1 (Avatar)
    photo_2: '', // Personal Pic 2 (Personal Photo 1)
    photo_3: '', // Personal Pic 3 (Personal Photo 2)

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

  // Toggle URL input visibility if user prefers manual URL over file upload
  const [showIdUrlInput, setShowIdUrlInput] = useState(false);
  const [showPicUrlInputs, setShowPicUrlInputs] = useState({
    photo_1: false,
    photo_2: false,
    photo_3: false
  });

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

  // Handle Identity Verification Document File Upload
  const handleIdDocUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      addToast('Please upload an image (JPG, PNG, WebP) or PDF document.', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size must be under 10MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        verification_id_url: event.target.result,
        verification_id_filename: file.name
      }));
      addToast('Verification ID document uploaded successfully! ✓', 'success');
    };
    reader.onerror = () => {
      addToast('Failed to read file. Please try another image.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Handle Personal Pic File Upload
  const handlePersonalPicUpload = (e, fieldKey, picLabel) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image size must be under 10MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        [fieldKey]: event.target.result
      }));
      addToast(`${picLabel} uploaded successfully! ✓`, 'success');
    };
    reader.onerror = () => {
      addToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApplicantStatusView(null);

    const result = await loginWithCredentials(loginIdentifier, loginPassword);

    if (result && result.success) {
      onClose();
    } else if (result && ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED', 'REJECTED'].includes(result.status)) {
      setApplicantStatusView(result);
    } else {
      addToast(result?.message || 'Login failed', 'error');
    }
  };

  // Full 6-Step Registration submission
  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (formData.age < 18) {
      addToast('Cannot apply: Must be at least 18 years old.', 'error');
      return;
    }
    if (!formData.college_name) {
      addToast('College / University name is mandatory.', 'warning');
      return;
    }
    if (!formData.verification_id_url) {
      addToast('Verification ID document is mandatory before submission.', 'warning');
      return;
    }
    if (!formData.photo_1 || !formData.photo_2 || !formData.photo_3) {
      addToast('All THREE personal photographs must be uploaded.', 'warning');
      return;
    }
    if (!formData.termsAccepted || !formData.privacyAccepted || !formData.ageConfirmed18Plus || !formData.verificationConsent) {
      addToast('You must acknowledge all terms, 18+ eligibility, and 72-hour manual review consent.', 'warning');
      return;
    }

    const result = await registerStudent(formData);
    if (result && result.success) {
      setApplicantStatusView({
        status: 'PENDING_REVIEW',
        student: result.student,
        message: result.message
      });
      addToast(`Application ${result.applicationId} submitted for manual human review! 📋`, 'success');
    } else {
      addToast(result?.message || 'Submission failed', 'warning');
    }
  };

  // Resubmit corrections requested by Admin
  const handleResubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionTarget) return;

    if (!formData.verification_id_url) {
      addToast('Please upload your verification ID.', 'warning');
      return;
    }
    if (!formData.photo_1 || !formData.photo_2 || !formData.photo_3) {
      addToast('All 3 personal pictures are required.', 'warning');
      return;
    }

    await resubmitVerification(correctionTarget.id, {
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

  // Check if all 3 personal pics are entered
  const allThreePicsEntered = Boolean(formData.photo_1 && formData.photo_2 && formData.photo_3);
  const uploadedPicsCount = [formData.photo_1, formData.photo_2, formData.photo_3].filter(Boolean).length;

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
                onClick={async () => {
                  await loginWithCredentials(applicantStatusView.student.email, 'Password@2026');
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
                  {step === 3 && 'Step 3: Verification ID Upload'}
                  {step === 4 && 'Step 4: Three Personal Photos Upload'}
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
                    College / University Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      placeholder="Enter your college or university name"
                      className="w-full p-2.5 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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

            {/* STEP 3: Identity Verification Document Upload Field */}
            {step === 3 && (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                  
                  {/* Document Type Selector */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-rose-500" />
                        Select Verification ID Type
                      </span>
                      <span className="text-[10px] text-rose-600 font-extrabold uppercase bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                        Required *
                      </span>
                    </label>
                    <select
                      value={formData.verification_id_type}
                      onChange={(e) => setFormData({ ...formData, verification_id_type: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                    >
                      <option value="College Student ID">College Student ID Card (Preferred for Students)</option>
                      <option value="Govt Voter ID">Govt Voter ID Card</option>
                      <option value="Aadhaar Document (Masked)">Aadhaar Document (Masked first 8 digits)</option>
                    </select>
                  </div>

                  {/* Verification ID Upload Field */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-purple-600" />
                        Upload Verification ID Document
                      </span>
                      {formData.verification_id_url ? (
                        <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Document Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold">
                          Upload Required to Proceed
                        </span>
                      )}
                    </label>

                    {/* Drag-and-drop / Click-to-upload area */}
                    {!formData.verification_id_url ? (
                      <label
                        htmlFor="verification_id_file"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl cursor-pointer hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all text-center bg-white dark:bg-slate-900"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-2 shadow-xs">
                          <Upload className="w-6 h-6 animate-bounce" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          Click or Tap to Upload ID Card
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Supports JPG, PNG, WebP or PDF (Max 10MB)
                        </span>
                        <input
                          id="verification_id_file"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleIdDocUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      /* Preview of Uploaded Document */
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-400 dark:border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img
                            src={formData.verification_id_url}
                            alt="Uploaded Verification ID"
                            className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {formData.verification_id_type}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> File attached & ready
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Encrypted in private admin vault
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <label
                            htmlFor="verification_id_file_change"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                          >
                            Change
                            <input
                              id="verification_id_file_change"
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleIdDocUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, verification_id_url: '', verification_id_filename: '' })}
                            className="px-2.5 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option to enter URL or use Demo ID for rapid testing */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowIdUrlInput(!showIdUrlInput)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    >
                      {showIdUrlInput ? 'Hide URL input' : 'Or paste image link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          verification_id_url: PRESET_IDS[0],
                          verification_id_filename: 'sample_student_id.jpg'
                        });
                        addToast('Sample Student ID card loaded for demo testing! ✓', 'info');
                      }}
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      Use Sample Demo ID
                    </button>
                  </div>

                  {showIdUrlInput && (
                    <div className="pt-1">
                      <input
                        type="url"
                        value={formData.verification_id_url}
                        onChange={(e) => setFormData({ ...formData, verification_id_url: e.target.value })}
                        placeholder="https://example.com/student-id-card.jpg"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                    * <strong>Privacy Guarantee:</strong> Identity documents are strictly kept in private encrypted storage. They are never shown to other users or search engines, and are viewed only by authorized admins during the 72-hour review.
                  </div>
                </div>

                {/* Validation message if ID is not uploaded */}
                {!formData.verification_id_url && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Upload or attach your verification ID above to unlock the Next step.</span>
                  </div>
                )}

                {/* Navigation Buttons: Disabled if ID is not uploaded */}
                <div className="flex gap-2 pt-1">
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
                    onClick={() => {
                      if (!formData.verification_id_url) {
                        addToast('Please upload your verification ID before proceeding.', 'warning');
                        return;
                      }
                      setStep(4);
                    }}
                    className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Next: Three Personal Photos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Three Personal Pic Upload Fields */}
            {step === 4 && (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3.5">
                  
                  {/* Step Header with count badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                        <Camera className="w-4 h-4 text-rose-500" />
                        Three Personal Photos (Mandatory)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Upload 3 genuine personal photos. All 3 fields are required before proceeding.
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        allThreePicsEntered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}
                    >
                      {uploadedPicsCount} / 3 Uploaded
                    </span>
                  </div>

                  {/* The THREE Personal Pic Upload Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    
                    {/* 1. PERSONAL PIC 1 (Profile Avatar / Face) */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          Personal Pic 1
                        </span>
                        {formData.photo_1 ? (
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-md">
                            Ready ✓
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded-md">
                            Required *
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 block -mt-1">
                        Main Profile Avatar
                      </span>

                      {/* Upload / Preview Box */}
                      {formData.photo_1 ? (
                        <div className="relative group">
                          <img
                            src={formData.photo_1}
                            alt="Personal Pic 1"
                            className="w-full h-28 object-cover rounded-xl border-2 border-emerald-400 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo_1: '' })}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all"
                            title="Remove Photo 1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="personal_pic_1_file"
                          className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-rose-300 dark:border-rose-900 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all text-center p-2"
                        >
                          <Camera className="w-6 h-6 text-rose-400 mb-1" />
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            Upload Pic 1
                          </span>
                          <span className="text-[9px] text-slate-400">Clear frontal face</span>
                          <input
                            id="personal_pic_1_file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePersonalPicUpload(e, 'photo_1', 'Personal Pic 1 (Avatar)')}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Paste URL Option for Pic 1 */}
                      <div className="pt-1">
                        {!formData.photo_1 ? (
                          <input
                            type="url"
                            value={formData.photo_1}
                            onChange={(e) => setFormData({ ...formData, photo_1: e.target.value })}
                            placeholder="Or paste photo URL..."
                            className="w-full p-1 text-[9px] bg-slate-50 dark:bg-slate-800 border rounded-lg"
                          />
                        ) : (
                          <label
                            htmlFor="personal_pic_1_reupload"
                            className="block text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Change Photo 1
                            <input
                              id="personal_pic_1_reupload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePersonalPicUpload(e, 'photo_1', 'Personal Pic 1 (Avatar)')}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 2. PERSONAL PIC 2 (Campus / Casual) */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          Personal Pic 2
                        </span>
                        {formData.photo_2 ? (
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-md">
                            Ready ✓
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded-md">
                            Required *
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 block -mt-1">
                        Campus or Daily Life
                      </span>

                      {/* Upload / Preview Box */}
                      {formData.photo_2 ? (
                        <div className="relative group">
                          <img
                            src={formData.photo_2}
                            alt="Personal Pic 2"
                            className="w-full h-28 object-cover rounded-xl border-2 border-emerald-400 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo_2: '' })}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all"
                            title="Remove Photo 2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="personal_pic_2_file"
                          className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-rose-300 dark:border-rose-900 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all text-center p-2"
                        >
                          <Camera className="w-6 h-6 text-rose-400 mb-1" />
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            Upload Pic 2
                          </span>
                          <span className="text-[9px] text-slate-400">Campus / Lifestyle</span>
                          <input
                            id="personal_pic_2_file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePersonalPicUpload(e, 'photo_2', 'Personal Pic 2 (Campus)')}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Paste URL Option for Pic 2 */}
                      <div className="pt-1">
                        {!formData.photo_2 ? (
                          <input
                            type="url"
                            value={formData.photo_2}
                            onChange={(e) => setFormData({ ...formData, photo_2: e.target.value })}
                            placeholder="Or paste photo URL..."
                            className="w-full p-1 text-[9px] bg-slate-50 dark:bg-slate-800 border rounded-lg"
                          />
                        ) : (
                          <label
                            htmlFor="personal_pic_2_reupload"
                            className="block text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Change Photo 2
                            <input
                              id="personal_pic_2_reupload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePersonalPicUpload(e, 'photo_2', 'Personal Pic 2 (Campus)')}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 3. PERSONAL PIC 3 (Social / Activities) */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          Personal Pic 3
                        </span>
                        {formData.photo_3 ? (
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-md">
                            Ready ✓
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded-md">
                            Required *
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 block -mt-1">
                        Social / Hobbies Photo
                      </span>

                      {/* Upload / Preview Box */}
                      {formData.photo_3 ? (
                        <div className="relative group">
                          <img
                            src={formData.photo_3}
                            alt="Personal Pic 3"
                            className="w-full h-28 object-cover rounded-xl border-2 border-emerald-400 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo_3: '' })}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all"
                            title="Remove Photo 3"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="personal_pic_3_file"
                          className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-rose-300 dark:border-rose-900 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all text-center p-2"
                        >
                          <Camera className="w-6 h-6 text-rose-400 mb-1" />
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            Upload Pic 3
                          </span>
                          <span className="text-[9px] text-slate-400">Activity or Candid</span>
                          <input
                            id="personal_pic_3_file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePersonalPicUpload(e, 'photo_3', 'Personal Pic 3 (Social)')}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Paste URL Option for Pic 3 */}
                      <div className="pt-1">
                        {!formData.photo_3 ? (
                          <input
                            type="url"
                            value={formData.photo_3}
                            onChange={(e) => setFormData({ ...formData, photo_3: e.target.value })}
                            placeholder="Or paste photo URL..."
                            className="w-full p-1 text-[9px] bg-slate-50 dark:bg-slate-800 border rounded-lg"
                          />
                        ) : (
                          <label
                            htmlFor="personal_pic_3_reupload"
                            className="block text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Change Photo 3
                            <input
                              id="personal_pic_3_reupload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePersonalPicUpload(e, 'photo_3', 'Personal Pic 3 (Social)')}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Quick helper for developers / testers */}
                  <div className="flex items-center justify-between pt-2 border-t border-rose-100 dark:border-rose-900/60 text-[11px]">
                    <span className="text-slate-500">Need quick testing photos?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          photo_1: PRESET_PHOTOS[0],
                          photo_2: PRESET_PHOTOS[1],
                          photo_3: PRESET_PHOTOS[2]
                        });
                        addToast('Sample demo photos loaded for all 3 fields! ✓', 'info');
                      }}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      Fill 3 Demo Photos
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-snug">
                    * All three images are stored privately and inspected by human administrators for face consistency before public profile creation.
                  </p>
                </div>

                {/* Validation Warning when not all 3 pictures are uploaded */}
                {!allThreePicsEntered && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      You must upload all 3 personal pictures before going to the next step ({uploadedPicsCount}/3 uploaded).
                    </span>
                  </div>
                )}

                {/* Navigation Buttons: Strictly disabled until all 3 pics are entered */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!allThreePicsEntered}
                    onClick={() => {
                      if (!allThreePicsEntered) {
                        addToast('Please upload all three personal photos before proceeding.', 'warning');
                        return;
                      }
                      setStep(5);
                    }}
                    className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Next: Preferences & Bio</span>
                    <ArrowRight className="w-4 h-4" />
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
                
                {/* Summary Card with Thumbnails */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-[11px]">
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
                    <span className="font-semibold text-rose-500">{formData.verification_id_type} attached ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Personal Photos:</span>
                    <span className="font-semibold text-emerald-600">3 Personal Pics Attached ✓</span>
                  </div>

                  {/* Thumbnail Row of Verification ID + 3 Personal Pics */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                      <span className="text-[9px] text-purple-600 font-bold block mb-0.5 truncate">ID Doc</span>
                      <img
                        src={formData.verification_id_url}
                        alt="ID Card"
                        className="w-full h-14 object-cover rounded-lg border-2 border-purple-400"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5 truncate">Pic 1</span>
                      <img
                        src={formData.photo_1}
                        alt="Pic 1"
                        className="w-full h-14 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5 truncate">Pic 2</span>
                      <img
                        src={formData.photo_2}
                        alt="Pic 2"
                        className="w-full h-14 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5 truncate">Pic 3</span>
                      <img
                        src={formData.photo_3}
                        alt="Pic 3"
                        className="w-full h-14 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                      />
                    </div>
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

    </div>
  );
};

export default AuthModal;

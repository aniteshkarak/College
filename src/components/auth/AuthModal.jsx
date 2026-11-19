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
  Upload
} from 'lucide-react';

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80'
];

const PRESET_IDS = [
  'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?auto=format&fit=crop&w=800&q=80'
];

export const AuthModal = ({ isOpen, onClose }) => {
  const {
    authModalMode,
    setAuthModalMode,
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
  const [loginStatusNotice, setLoginStatusNotice] = useState(null); // { type, message, student, reason }

  // Registration form state
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    date_of_birth: '',
    age: 0,
    gender: 'Female',
    interested_in: ['Male'],
    mobile: '',
    email: '',
    password: '',
    college_name: '',
    course: '',
    city: 'Kharagpur',
    state: 'West Bengal',
    relationship_intention: 'Dating Connection',
    // Mandatory: At least 2 photos
    photo_1: PRESET_PHOTOS[0],
    photo_2: PRESET_PHOTOS[1],
    // Mandatory: Verification ID
    verification_id_type: 'College Student ID',
    verification_id_url: PRESET_IDS[0],
    acceptTerms: false
  });

  const [ageError, setAgeError] = useState('');
  const [submittedStudent, setSubmittedStudent] = useState(null);

  if (!isOpen) return null;

  // Handle Date of Birth & 18+ legal check
  const handleDobChange = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setAgeError('Under 18 not eligible: Must be 18+ to register under Indian legal compliance.');
    } else {
      setAgeError('');
    }

    setFormData({ ...formData, date_of_birth: dob, age: calculatedAge });
  };

  // Handle Login submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginStatusNotice(null);

    const result = loginWithCredentials(loginIdentifier, loginPassword);

    if (result.success) {
      onClose();
    } else if (result.status === 'PENDING_APPROVAL') {
      setLoginStatusNotice({
        type: 'pending',
        title: 'Verification In Progress (Admin Review)',
        message: result.message,
        student: result.student
      });
    } else if (result.status === 'REJECTED') {
      setLoginStatusNotice({
        type: 'rejected',
        title: 'Verification Declined by Admin',
        message: result.message,
        reason: result.reason,
        student: result.student
      });
    } else {
      setLoginStatusNotice({
        type: 'error',
        title: 'Login Failed',
        message: result.message
      });
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = (e) => {
    e.preventDefault();

    if (formData.age < 18) {
      addToast('Cannot create account: You must be at least 18 years old.', 'error');
      return;
    }
    if (!formData.college_name.trim()) {
      addToast('College Name is mandatory.', 'warning');
      return;
    }
    if (!formData.photo_1 || !formData.photo_2) {
      addToast('At least 2 photos are required (Photo 1 and Photo 2).', 'warning');
      return;
    }
    if (!formData.verification_id_url) {
      addToast('College ID or Govt ID verification document is required.', 'warning');
      return;
    }
    if (!formData.acceptTerms) {
      addToast('You must accept the DPDP Act terms and safety conditions.', 'warning');
      return;
    }

    const result = registerStudent(formData);
    if (result.success) {
      setSubmittedStudent(result.student);
      addToast('Registration details sent to Campus Admin for verification! 📋', 'success');
    } else {
      addToast(result.message, 'warning');
    }
  };

  // Quick helper to fill demo credentials
  const fillDemoLogin = (email, pass = 'password123') => {
    setLoginIdentifier(email);
    setLoginPassword(pass);
    setLoginStatusNotice(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up max-h-[92vh] overflow-y-auto">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('login');
                setSubmittedStudent(null);
                setLoginStatusNotice(null);
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
                setSubmittedStudent(null);
                setLoginStatusNotice(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'register'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* -------------------- 1. LOGIN TAB -------------------- */}
        {activeTab === 'login' && (
          <div className="my-5 space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                Log In to Collégé
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter using your registered Gmail address or Indian mobile number.
              </p>
            </div>

            {/* Status Notices for Admin Verification */}
            {loginStatusNotice && (
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed animate-fade-in ${
                  loginStatusNotice.type === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
                    : loginStatusNotice.type === 'rejected'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {loginStatusNotice.type === 'pending' && <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                  {loginStatusNotice.type === 'rejected' && <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                  {loginStatusNotice.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                  <div>
                    <h4 className="font-bold text-xs mb-0.5">{loginStatusNotice.title}</h4>
                    <p className="opacity-90">{loginStatusNotice.message}</p>

                    {loginStatusNotice.reason && (
                      <div className="mt-2 p-2 bg-white/70 dark:bg-black/30 rounded-xl border border-rose-200/50">
                        <span className="font-bold">Admin Reason:</span> "{loginStatusNotice.reason}"
                      </div>
                    )}

                    {loginStatusNotice.type === 'rejected' && (
                      <button
                        onClick={() => {
                          setActiveTab('register');
                          setStep(2);
                          setFormData((prev) => ({
                            ...prev,
                            full_name: loginStatusNotice.student?.full_name || prev.full_name,
                            college_name: loginStatusNotice.student?.college_name || prev.college_name,
                            email: loginStatusNotice.student?.email || prev.email,
                            mobile: loginStatusNotice.student?.mobile || prev.mobile
                          }));
                        }}
                        className="mt-2.5 px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-[11px]"
                      >
                        Update Details & Re-upload ID
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gmail / Email or Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="student@gmail.com or 9830123456"
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

            {/* Quick Demo Shortcuts to test verification states */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">
                Quick Demo Test Accounts:
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillDemoLogin('anirban@iitkgp.ac.in')}
                  className="p-2 text-left bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold">Anirban Mukherjee (Verified Student)</span>
                    <span className="block text-[10px] opacity-80">anirban@iitkgp.ac.in • IIT Kharagpur</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                    Approved
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoLogin('sourav.ganguly@gmail.com')}
                  className="p-2 text-left bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold">Sourav Ganguly (Pending Verification)</span>
                    <span className="block text-[10px] opacity-80">sourav.ganguly@gmail.com • St. Xavier's</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-full">
                    In Review
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 2. CREATE ACCOUNT (REGISTER) TAB -------------------- */}
        {activeTab === 'register' && (
          <div>
            {submittedStudent ? (
              /* Awaiting Admin Verification Notice */
              <div className="my-6 text-center space-y-4 animate-fade-in text-xs">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-full">
                    Awaiting Admin Verification
                  </span>
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-2">
                    Details Submitted, {submittedStudent.display_name}!
                  </h3>
                  <p className="text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Under Collégé safety protocols, an administrator will review your <strong>College ID</strong> and <strong>2 photos</strong> before account creation.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="font-bold">{submittedStudent.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">College:</span>
                    <span className="font-bold">{submittedStudent.college_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification ID:</span>
                    <span className="font-bold text-rose-500">{submittedStudent.verification_id_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-amber-500">Pending Admin Review</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveTab('login');
                      setSubmittedStudent(null);
                    }}
                    className="w-full py-2.5 gradient-brand-bg text-white font-bold rounded-xl"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              /* Multi-step Registration Form */
              <div className="my-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                      STEP {step} OF 3
                    </span>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      {step === 1 && '1. Student Identity & 18+ Verification'}
                      {step === 2 && '2. Contact & Verification ID Card'}
                      {step === 3 && '3. Mandatory 2 Photos & Intentions'}
                    </h3>
                  </div>
                </div>

                {/* STEP 1: Name, DOB (18+), College */}
                {step === 1 && (
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Legal Name (Must match College / Govt ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="e.g. Sourav Ganguly"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Display Name (Visible to campus matches)
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
                        Date of Birth (Must be 18+ to enter Collégé)
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

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        College / University Name (Mandatory)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.college_name}
                          onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                          placeholder="e.g. St. Xavier's College / IIT Kharagpur"
                          className="w-full p-2.5 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-Binary">Non-Binary</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Interested In
                        </label>
                        <select
                          value={formData.interested_in[0]}
                          onChange={(e) => setFormData({ ...formData, interested_in: [e.target.value] })}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        >
                          <option value="Male">Men</option>
                          <option value="Female">Women</option>
                          <option value="Everyone">Everyone</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!formData.full_name || !formData.college_name || formData.age < 18}
                      onClick={() => setStep(2)}
                      className="w-full py-3 mt-3 gradient-brand-bg text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span>Next: Contact & Verification ID</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: Email, Mobile, Password & Verification ID */}
                {step === 2 && (
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gmail / Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="yourname@gmail.com"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Indian Mobile Number (+91)
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

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Account Password (min. 8 characters)
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

                    {/* Verification ID Selection */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-rose-500" />
                          Verification ID Document (Required for Admin Check)
                        </label>
                      </div>

                      <select
                        value={formData.verification_id_type}
                        onChange={(e) => setFormData({ ...formData, verification_id_type: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="College Student ID">College Student ID Card</option>
                        <option value="Govt Driving License">Govt Driving License</option>
                        <option value="Govt Voter ID">Govt Voter ID Card</option>
                        <option value="Passport">Passport</option>
                      </select>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500">Document Photo URL / Scan:</label>
                        <input
                          type="text"
                          value={formData.verification_id_url}
                          onChange={(e) => setFormData({ ...formData, verification_id_url: e.target.value })}
                          placeholder="Paste image link or choose sample ID below"
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>

                      {/* ID Preview */}
                      {formData.verification_id_url && (
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <img
                            src={formData.verification_id_url}
                            alt="ID Preview"
                            className="w-16 h-12 object-cover rounded-lg border shadow-xs"
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            ✓ {formData.verification_id_type} attached for Admin
                          </span>
                        </div>
                      )}
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
                        disabled={!formData.email || !formData.mobile || !formData.password || !formData.verification_id_url}
                        onClick={() => setStep(3)}
                        className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        Next: Add 2 Photos
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Mandatory at least 2 Photos & DPDP Consent */}
                {step === 3 && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                    
                    {/* Mandatory 2 Photos section */}
                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-rose-500" />
                          Mandatory Profile Photos (At least 2 required)
                        </label>
                        <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-extrabold px-2 py-0.5 rounded-full">
                          2 Photos Req.
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Photo 1 */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Photo 1 (Avatar)</span>
                          <div className="relative group">
                            <img
                              src={formData.photo_1}
                              alt="Photo 1"
                              className="w-full h-28 object-cover rounded-xl border-2 border-rose-400 shadow-sm"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                              Photo 1 ✓
                            </span>
                          </div>
                          <input
                            type="text"
                            value={formData.photo_1}
                            onChange={(e) => setFormData({ ...formData, photo_1: e.target.value })}
                            placeholder="Image URL"
                            className="w-full p-1.5 text-[10px] bg-white dark:bg-slate-900 border rounded-lg"
                          />
                        </div>

                        {/* Photo 2 */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Photo 2 (Campus)</span>
                          <div className="relative group">
                            <img
                              src={formData.photo_2}
                              alt="Photo 2"
                              className="w-full h-28 object-cover rounded-xl border-2 border-rose-400 shadow-sm"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                              Photo 2 ✓
                            </span>
                          </div>
                          <input
                            type="text"
                            value={formData.photo_2}
                            onChange={(e) => setFormData({ ...formData, photo_2: e.target.value })}
                            placeholder="Image URL"
                            className="w-full p-1.5 text-[10px] bg-white dark:bg-slate-900 border rounded-lg"
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        * Both photos are reviewed by Admin alongside your College ID card for authentic verification.
                      </p>
                    </div>

                    {/* Intention */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Relationship Intention
                      </label>
                      <select
                        value={formData.relationship_intention}
                        onChange={(e) => setFormData({ ...formData, relationship_intention: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Casual Connection">Casual Connection (Friends & Chats)</option>
                        <option value="Dating Connection">Dating Connection (Romantic exploration)</option>
                        <option value="Serious Relationship">Serious Relationship (Long-term intent)</option>
                      </select>
                    </div>

                    {/* DPDP Consent */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="dpdpRegisterConsent"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        required
                        className="w-4 h-4 mt-0.5 accent-rose-500 cursor-pointer"
                      />
                      <label htmlFor="dpdpRegisterConsent" className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug cursor-pointer">
                        I confirm I am 18+ years of age. I submit my College/Govt ID and 2 photos for campus administration verification in accordance with India's <span className="text-rose-500 font-semibold">DPDP Act, 2023</span>.
                      </label>
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
                        type="submit"
                        className="flex-1 py-3 gradient-brand-bg text-white rounded-xl font-bold shadow-md hover:brightness-105"
                      >
                        Submit for Admin Verification
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;

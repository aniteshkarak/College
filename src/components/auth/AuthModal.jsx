import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_INTERESTS, ALL_INTENTIONS } from '../../services/mockData';
import { ShieldCheck, Sparkles, Check, ArrowRight, ArrowLeft, X, Lock } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { setCurrentUser, setIsAuthenticated, navigateTo, addToast } = useApp();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    date_of_birth: '',
    age: 0,
    gender: 'Female',
    interested_in: ['Male'],
    mobile: '',
    email: '',
    otp: '',
    college_name: '',
    course: '',
    city: 'Kharagpur',
    state: 'West Bengal',
    relationship_intention: 'Dating Connection',
    interests: ['Music', 'Travelling'],
    acceptTerms: false
  });

  const [ageError, setAgeError] = useState('');

  if (!isOpen) return null;

  const handleDobChange = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setAgeError('Must be 18+ to register under India legal compliance & Collégé safety terms.');
    } else {
      setAgeError('');
    }

    setFormData({ ...formData, date_of_birth: dob, age: calculatedAge });
  };

  const handleComplete = (e) => {
    e.preventDefault();
    if (formData.age < 18) {
      addToast('Cannot create account: You must be at least 18 years old.', 'error');
      return;
    }
    if (!formData.acceptTerms) {
      addToast('You must accept the DPDP Terms and Privacy Policy.', 'warning');
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      full_name: formData.full_name,
      display_name: formData.display_name,
      date_of_birth: formData.date_of_birth,
      age: formData.age,
      gender: formData.gender,
      interested_in: formData.interested_in,
      city: formData.city,
      state: formData.state,
      college_name: formData.college_name,
      course: formData.course,
      relationship_intention: formData.relationship_intention,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      additional_photos: [],
      bio: `Student at ${formData.college_name || 'campus'}. Excited to make genuine friends and chat!`,
      interests: formData.interests,
      languages: ['English', 'Bengali', 'Hindi'],
      is_active: true,
      verification_status: 'Phone Verified',
      mood: 'Looking for a conversation',
      is_premium: false,
      daily_likes_remaining: 15,
      created_at: new Date().toISOString()
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    addToast(`Welcome to Collégé, ${newUser.display_name}! ✨`, 'success');
    onClose();
    navigateTo('discover');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
              STEP {step} OF 3
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
              {step === 1 && 'Create Your Campus Profile'}
              {step === 2 && 'Intentions & Campus Details'}
              {step === 3 && 'Verification & DPDP Consent'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Core Details & DOB 18+ Check */}
        {step === 1 && (
          <div className="space-y-4 my-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="As per student records"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name (Visible to matches)
              </label>
              <input
                type="text"
                required
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="What your campus friends call you"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth (PRD 4.1: Must be 18+)
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
                  Age: {formData.age} years old (Eligible)
                </p>
              )}
              {ageError && (
                <p className="text-[11px] text-rose-500 font-bold mt-1">{ageError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              disabled={!formData.display_name || formData.age < 18}
              onClick={() => setStep(2)}
              className="w-full py-3 mt-4 gradient-brand-bg text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>Next: Intentions & Campus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Intentions & Campus */}
        {step === 2 && (
          <div className="space-y-4 my-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                What are you looking for right now?
              </label>
              <div className="space-y-2">
                {ALL_INTENTIONS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setFormData({ ...formData, relationship_intention: item.id })}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.relationship_intention === item.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="font-bold">{item.title}</p>
                    <p className="text-[10px] opacity-80">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College (Optional)
                </label>
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                  placeholder="e.g. IIT Kharagpur"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

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
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 gradient-brand-bg text-white rounded-xl font-bold"
              >
                Next: Verify & Join
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OTP Verification & DPDP Act Consent */}
        {step === 3 && (
          <form onSubmit={handleComplete} className="space-y-4 my-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Indian Mobile Number (+91)
              </label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="9876543210"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMS OTP (Simulated: enter any 6 digits)
              </label>
              <input
                type="text"
                required
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                placeholder="e.g. 524108"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono tracking-widest text-base"
              />
            </div>

            {/* DPDP Consent Checkbox */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="dpdpConsent"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                required
                className="w-4 h-4 mt-0.5 accent-rose-500 cursor-pointer"
              />
              <label htmlFor="dpdpConsent" className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug cursor-pointer">
                I confirm I am 18+ years of age. I accept the <span className="text-rose-500 font-semibold">Terms & Conditions</span> and agree to data processing under India's <span className="text-rose-500 font-semibold">Digital Personal Data Protection Act, 2023</span>.
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
                Complete Registration
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;

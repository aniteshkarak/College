import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_INTERESTS, ALL_LANGUAGES, ALL_INTENTIONS } from '../../services/mockData';
import { ArrowLeft, Save, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export const EditProfile = () => {
  const { currentUser, setCurrentUser, navigateTo, addToast } = useApp();

  const [formData, setFormData] = useState({ ...currentUser });
  const [ageError, setAgeError] = useState('');

  // Calculate age from DOB and check 18+ requirement (PRD 4.1 & 4.2)
  const handleDobChange = (dobString) => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setAgeError('You must be at least 18 years old to join Collégé (PRD Section 4.1).');
    } else {
      setAgeError('');
    }

    setFormData((prev) => ({
      ...prev,
      date_of_birth: dobString,
      age: calculatedAge
    }));
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.age < 18) {
      addToast('Cannot save: Must be 18+ to use Collégé.', 'error');
      return;
    }
    if (formData.interests.length === 0) {
      addToast('Please select at least 1 interest (PRD 4.2).', 'warning');
      return;
    }

    setCurrentUser(formData);
    addToast('Profile updated successfully!', 'success');
    navigateTo('profile');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateTo('profile')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
        <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
          Edit Profile & Intentions
        </h2>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-semibold shadow hover:brightness-105"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Identity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name (Required)
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name (Private, for verification)
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Date of Birth & Age Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth (Required)
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleDobChange(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              {ageError && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{ageError}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calculated Age (Automatic)
              </label>
              <div className="text-xs p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white">
                {formData.age} years old (18+ Eligible)
              </div>
            </div>
          </div>

          {/* Gender & Interested In */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender (Required)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interested In (Required)
              </label>
              <select
                value={formData.interested_in[0] || 'Female'}
                onChange={(e) => setFormData({ ...formData, interested_in: [e.target.value] })}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Female">Women</option>
                <option value="Male">Men</option>
                <option value="Everyone">Everyone</option>
              </select>
            </div>
          </div>

        </div>

        {/* Relationship Intention (PRD 3 & 4.2) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Relationship Intention (Required)
          </h3>
          <p className="text-xs text-slate-500">
            Nobody is forced to change their intentions to keep a match. Update your preferences anytime.
          </p>

          <div className="space-y-2 pt-2">
            {ALL_INTENTIONS.map((item) => {
              const isSelected = formData.relationship_intention === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setFormData({ ...formData, relationship_intention: item.id })}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campus & Location */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus & Location</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College / University (Optional)
              </label>
              <input
                type="text"
                value={formData.college_name || ''}
                onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                placeholder="e.g. IIT Kharagpur, St. Xavier's, etc."
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course / Major (Optional)
              </label>
              <input
                type="text"
                value={formData.course || ''}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. B.Tech CS, English Lit, etc."
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City (Required)
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State (Required)
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Bio & Interests */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About & Interests</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Bio (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell others about yourself, your hobbies, or favorite spot on campus..."
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Your Interests (Required)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_INTERESTS.map((int) => {
                const isSelected = formData.interests.includes(int);
                return (
                  <button
                    key={int}
                    type="button"
                    onClick={() => toggleInterest(int)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {int}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};

export default EditProfile;

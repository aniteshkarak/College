import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_INTERESTS, ALL_LANGUAGES, ALL_INTENTIONS, MOOD_OPTIONS } from '../../services/mockData';
import { api, resolvePhotoUrl } from '../../services/api';
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Upload,
  Trash2,
  Star,
  RefreshCw,
  Loader2,
  Camera,
  Check
} from 'lucide-react';

export const EditProfile = () => {
  const { currentUser, setCurrentUser, navigateTo, addToast, currentMood, updateUserMood } = useApp();

  const [formData, setFormData] = useState({
    display_name: currentUser?.displayName || currentUser?.display_name || '',
    full_name: currentUser?.fullName || currentUser?.full_name || '',
    date_of_birth: currentUser?.dateOfBirth ? String(currentUser.dateOfBirth).slice(0, 10) : (currentUser?.date_of_birth ? String(currentUser.date_of_birth).slice(0, 10) : ''),
    age: currentUser?.age || 21,
    gender: currentUser?.gender || 'Female',
    interested_in: currentUser?.interested_in || [currentUser?.lookingFor || 'Women'],
    relationship_intention: currentUser?.relationshipIntention || currentUser?.relationship_intention || 'Casual Connection',
    current_mood: currentMood?.label || currentUser?.currentMood || currentUser?.mood || 'Want to make friends',
    college_name: currentUser?.collegeName || currentUser?.college_name || '',
    course: currentUser?.course || currentUser?.degreeName || '',
    academic_year: currentUser?.academicYear || currentUser?.academic_year || '3rd Year',
    city: currentUser?.city || '',
    state: currentUser?.state || '',
    bio: currentUser?.bio || '',
    interests: Array.isArray(currentUser?.interests) ? [...currentUser.interests] : [],
    languages: Array.isArray(currentUser?.languages) ? [...currentUser.languages] : ['English'],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeReplacePhotoId, setActiveReplacePhotoId] = useState(null);
  const fileInputRef = useRef(null);
  const [ageError, setAgeError] = useState('');

  // Extract all current user photos with order and main status
  const currentPhotos = (
    currentUser?.photos && currentUser.photos.length > 0
      ? currentUser.photos
      : [
          currentUser?.avatar_url || currentUser?.avatarUrl,
          ...(currentUser?.additional_photos || currentUser?.additionalPhotos || [])
        ].filter(Boolean).map((url, i) => ({
          id: `legacy-${i}`,
          order: i + 1,
          isMain: i === 0,
          url,
        }))
  );

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
      setAgeError('You must be at least 18 years old to join Collage Story (PRD Section 4.1).');
    } else {
      setAgeError('');
    }

    setFormData((prev) => ({
      ...prev,
      date_of_birth: dobString,
      age: calculatedAge,
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

  // Upload or replace photo
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      addToast('Please select a valid image file (JPEG, PNG, WebP).', 'warning');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      addToast('Image size exceeds 8MB limit. Please choose a smaller file.', 'warning');
      return;
    }

    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result;
        try {
          const res = await api.profile.uploadPhoto({
            photo: base64Data,
            replacePhotoId: activeReplacePhotoId || undefined,
            isMain: activeReplacePhotoId ? undefined : currentPhotos.length === 0,
          });
          if (res && res.success) {
            const updatedUser = res.data.user || res.data.profile;
            setCurrentUser(updatedUser);
            addToast('Photograph uploaded and saved to PostgreSQL database! ✨', 'success');
          } else {
            addToast(res?.message || 'Failed to upload photo.', 'error');
          }
        } catch (err) {
          addToast(err.message || 'Photo upload failed.', 'error');
        } finally {
          setPhotoUploading(false);
          setActiveReplacePhotoId(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setPhotoUploading(false);
      setActiveReplacePhotoId(null);
      addToast('Could not process selected image file.', 'error');
    }
  };

  // Set selected photo as primary avatar
  const handleSetMainPhoto = async (photoId) => {
    try {
      const res = await api.profile.setMainPhoto(photoId);
      if (res && res.success) {
        const updatedUser = res.data.user || res.data.profile;
        setCurrentUser(updatedUser);
        addToast('Primary profile photograph updated! ★', 'success');
      } else {
        addToast(res?.message || 'Failed to set main photo.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to set main photo.', 'error');
    }
  };

  // Delete photo (enforces minimum 1 photo constraint)
  const handleDeletePhoto = async (photoId) => {
    if (currentPhotos.length <= 1) {
      addToast('Cannot delete: At least one profile photograph is required.', 'warning');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this photograph?')) return;

    try {
      const res = await api.profile.deletePhoto(photoId);
      if (res && res.success) {
        const updatedUser = res.data.user || res.data.profile;
        setCurrentUser(updatedUser);
        addToast('Photograph removed from database.', 'info');
      } else {
        addToast(res?.message || 'Failed to delete photo.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete photo.', 'error');
    }
  };

  // Save profile changes to PostgreSQL
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    if (formData.age < 18) {
      addToast('Cannot save: Must be 18+ to use Collage Story.', 'error');
      return;
    }
    if (!formData.interests || formData.interests.length === 0) {
      addToast('Please select at least 1 interest (PRD 4.2).', 'warning');
      return;
    }
    if (!formData.display_name?.trim()) {
      addToast('Display name is required.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        displayName: formData.display_name.trim(),
        fullName: formData.full_name?.trim(),
        dateOfBirth: formData.date_of_birth,
        age: formData.age,
        gender: formData.gender,
        relationshipIntention: formData.relationship_intention,
        currentMood: formData.current_mood,
        mood: formData.current_mood,
        lookingFor: formData.interested_in?.[0] || 'Women',
        collegeName: formData.college_name?.trim(),
        course: formData.course?.trim(),
        academicYear: formData.academic_year,
        city: formData.city?.trim(),
        state: formData.state?.trim(),
        bio: formData.bio?.trim(),
        interests: formData.interests,
        languages: formData.languages || ['English'],
      };

      const res = await api.profile.update(payload);
      if (res && res.success) {
        const updatedUser = res.data.user || res.data.profile;
        setCurrentUser(updatedUser);
        if (formData.current_mood) {
          updateUserMood(formData.current_mood);
        }
        addToast('Profile updated and saved to PostgreSQL successfully! ✨', 'success');
        navigateTo('profile');
      } else {
        addToast(res?.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      addToast(err.message || 'An error occurred while saving profile changes.', 'error');
    } finally {
      setIsSaving(false);
    }
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
        <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white truncate">
          Edit Profile<span className="hidden sm:inline"> & Intentions</span>
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-semibold shadow hover:brightness-105 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Save
            </>
          )}
        </button>
      </div>

      {/* Hidden file input for uploading photographs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <form onSubmit={handleSave} className="space-y-6">

        {/* Profile Photographs Management (Upload, Replace, Delete, Primary) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Profile Photographs ({currentPhotos.length} / 3)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Manage your public photographs. At least one photograph is required.
              </p>
            </div>

            <button
              type="button"
              disabled={photoUploading}
              onClick={() => {
                setActiveReplacePhotoId(null);
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900 hover:bg-rose-100 transition-colors self-start sm:self-auto"
            >
              {photoUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Photo</span>
                </>
              )}
            </button>
          </div>

          {/* Photo Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {currentPhotos.map((photo, idx) => {
              const photoUrl = typeof photo === 'string' ? photo : photo.url;
              const photoId = typeof photo === 'object' ? photo.id : `photo-${idx}`;
              const isMain = Boolean(photo.isMain || idx === 0);

              return (
                <div
                  key={photoId || idx}
                  className={`relative rounded-2xl overflow-hidden border transition-all ${
                    isMain
                      ? 'border-rose-500 ring-2 ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-800'
                  } bg-slate-100 dark:bg-slate-800 flex flex-col`}
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={resolvePhotoUrl(photoUrl)}
                      alt={`Photograph ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {isMain ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" /> Primary
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          Photo {idx + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for this photo */}
                  <div className="p-2.5 flex items-center justify-between gap-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(photoId)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Set as main avatar photo"
                      >
                        <Star className="w-3 h-3" /> Make Primary
                      </button>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplacePhotoId(photoId);
                          fileInputRef.current?.click();
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Replace this photo"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {currentPhotos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photoId)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
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

        {/* Current Campus Mood (Saved in PostgreSQL) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Campus Mood Status
            </h3>
            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-900/40">
              PostgreSQL Persisted
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Select your current campus mood. This is saved directly to the database and displayed across Discover and Chats.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 max-h-56 overflow-y-auto pr-1">
            {MOOD_OPTIONS.map((item) => {
              const isSelected = (formData.current_mood || '').toLowerCase() === item.label.toLowerCase() || (formData.current_mood || '').toLowerCase() === item.id.toLowerCase();
              return (
                <div
                  key={item.id}
                  onClick={() => setFormData({ ...formData, current_mood: item.label })}
                  className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 shadow-xs ring-1 ring-rose-400'
                      : 'border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <span className="text-xl shrink-0">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.label}</p>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 mt-0.5">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
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

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Profile Changes
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default EditProfile;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_INTERESTS, ALL_INTENTIONS } from '../../services/mockData';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';

export const FilterModal = ({ isOpen, onClose }) => {
  const { discoveryFilters, setDiscoveryFilters, updateDiscoveryPreferences, addToast } = useApp();

  const [filters, setFilters] = useState(discoveryFilters);

  if (!isOpen) return null;

  const cities = ['All', 'Kharagpur', 'Kolkata', 'Midnapore', 'Bengaluru', 'Delhi', 'Mumbai', 'Pune'];
  const genders = ['All', 'Female', 'Male', 'Non-Binary'];

  const toggleInterest = (interest) => {
    setFilters((prev) => {
      const exists = prev.selectedInterests.includes(interest);
      return {
        ...prev,
        selectedInterests: exists
          ? prev.selectedInterests.filter((i) => i !== interest)
          : [...prev.selectedInterests, interest]
      };
    });
  };

  const handleApply = () => {
    if (updateDiscoveryPreferences) {
      updateDiscoveryPreferences(filters);
    } else {
      setDiscoveryFilters(filters);
    }
    addToast('Discovery filters updated!', 'info');
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      minAge: 18,
      maxAge: 26,
      gender: 'All',
      city: 'All',
      intention: 'All',
      sameCollegeOnly: false,
      maxDistance: 100,
      selectedInterests: []
    };
    setFilters(defaultFilters);
    if (updateDiscoveryPreferences) {
      updateDiscoveryPreferences(defaultFilters);
    } else {
      setDiscoveryFilters(defaultFilters);
    }
    addToast('Filters reset to default', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <SlidersHorizontal className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Discovery Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 my-5">
          
          {/* Target City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Campus City / Town
            </label>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilters({ ...filters, city: c })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    filters.city === c
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Interested in
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {genders.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilters({ ...filters, gender: g })}
                  className={`py-1.5 text-center rounded-xl text-xs font-medium transition-all ${
                    filters.gender === g
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Same College Preference */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Same College Only</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Prioritize students from your verified campus</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(filters.sameCollegeOnly)}
                onChange={(e) => setFilters({ ...filters, sameCollegeOnly: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Age Range Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Age Range (18+)</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {filters.minAge} – {filters.maxAge} years
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="18"
                max="30"
                value={filters.maxAge}
                onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          {/* Relationship Intention */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Relationship Intention
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, intention: 'All' })}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  filters.intention === 'All'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                All Intentions
              </button>
              {ALL_INTENTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilters({ ...filters, intention: item.id })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    filters.intention === item.id
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold">{item.title}</span> — {item.description}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Filter by Interests
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {ALL_INTERESTS.map((interest) => {
                const isSelected = filters.selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold text-white gradient-brand-bg rounded-xl shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FilterModal;

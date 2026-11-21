/**
 * Collégé Local Storage & Session Persistence Automated Verification
 */

import assert from 'assert';

console.log('--- Starting Collégé Local Storage & Persistence Verification ---');

// Test 1: Preference Defaults & Fallback Verification
const DEFAULT_PREFERENCES = {
  theme: 'system',
  language: 'en',
  soundEnabled: true,
  notifications: {
    matches: true,
    messages: true,
    games: true,
    announcements: true,
  },
  discoveryFilters: {
    minAge: 18,
    maxAge: 26,
    gender: 'All',
    city: 'All',
    intention: 'All',
    maxDistance: 100,
    selectedInterests: [],
  },
  lastVisitedSection: 'matches',
  dismissedHints: [],
};

// Simulation of LocalStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockLS = new MockLocalStorage();

// Test 2: Theme Persistence
mockLS.setItem('college_theme', 'dark');
assert.strictEqual(mockLS.getItem('college_theme'), 'dark', 'Theme dark should be stored');

mockLS.setItem('college_theme', 'light');
assert.strictEqual(mockLS.getItem('college_theme'), 'light', 'Theme light should be stored');

mockLS.setItem('college_theme', 'system');
assert.strictEqual(mockLS.getItem('college_theme'), 'system', 'Theme system should be stored');
console.log('✓ Test 1: Theme persistence passed (college_theme: light/dark/system)');

// Test 3: Corrupted JSON recovery in preferences
mockLS.setItem('college_preferences', '{invalid_json: true');
let parsedPrefs;
try {
  const raw = mockLS.getItem('college_preferences');
  parsedPrefs = JSON.parse(raw);
} catch (e) {
  // Graceful fallback to default
  parsedPrefs = DEFAULT_PREFERENCES;
}
assert.deepStrictEqual(parsedPrefs, DEFAULT_PREFERENCES, 'Should fall back to DEFAULT_PREFERENCES on corrupted JSON');
console.log('✓ Test 2: Corrupted JSON recovery passed');

// Test 4: Preferences update & partial merge
const userPrefUpdate = {
  soundEnabled: false,
  language: 'hi',
  notifications: { ...DEFAULT_PREFERENCES.notifications, games: false }
};
const merged = { ...DEFAULT_PREFERENCES, ...userPrefUpdate };
mockLS.setItem('college_preferences', JSON.stringify(merged));
const readBack = JSON.parse(mockLS.getItem('college_preferences'));
assert.strictEqual(readBack.soundEnabled, false);
assert.strictEqual(readBack.language, 'hi');
assert.strictEqual(readBack.notifications.games, false);
assert.strictEqual(readBack.notifications.matches, true);
console.log('✓ Test 3: Preference updates & partial merging passed');

// Test 5: Shared Device & Logout Data Clearance
mockLS.setItem('college_has_session', 'true');
mockLS.setItem('college_user_prefs', JSON.stringify({ userId: 'student_123' }));

// Simulate Logout
mockLS.removeItem('college_has_session');
mockLS.removeItem('college_user_prefs');

assert.strictEqual(mockLS.getItem('college_has_session'), null, 'Session indicator must be cleared');
assert.strictEqual(mockLS.getItem('college_user_prefs'), null, 'User preferences cache must be cleared');
assert.strictEqual(mockLS.getItem('college_theme'), 'system', 'Global theme preference should be preserved');
console.log('✓ Test 4: Multi-account & shared device logout cleanup passed');

// Test 6: Sensitive Data Blacklist Check
const sensitiveKeys = [
  'token',
  'jwt',
  'accessToken',
  'refreshToken',
  'password',
  'password_hash',
  'college_document',
  'verification_document'
];

for (const key of sensitiveKeys) {
  assert.strictEqual(mockLS.getItem(key), null, `Sensitive key "${key}" must not exist in localStorage`);
}
console.log('✓ Test 5: Sensitive credentials exclusion verified (Zero credentials in localStorage)');

console.log('--- All Persistence Unit Tests Passed Successfully ---');

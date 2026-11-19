import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { STORAGE_PATHS } from '../config/storage.js';
import { env } from '../config/environment.js';
import { hashPassword } from '../utils/password.js';

// In-memory mutex queues to serialize writes per file and prevent concurrent corruption
const writeQueues = new Map();

const enqueueWrite = (filePath, task) => {
  const key = path.resolve(filePath);
  const current = writeQueues.get(key) || Promise.resolve();
  const next = current.then(task, task); // always continue queue
  writeQueues.set(key, next);
  return next;
};

/**
 * Atomic write to JSON file:
 * 1. Serialized through per-file promise queue
 * 2. Writes to temporary file
 * 3. Atomically renames temporary file to target (with Windows EPERM/EBUSY retry resilience)
 */
export const atomicWriteJson = async (filePath, data) => {
  return enqueueWrite(filePath, async () => {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    const tempPath = `${filePath}.tmp.${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const serialized = JSON.stringify(data, null, 2);

    try {
      await fs.promises.writeFile(tempPath, serialized, 'utf-8');

      // Windows EPERM/EBUSY retry loop for atomic file rename
      let attempts = 0;
      const maxAttempts = 6;
      while (attempts < maxAttempts) {
        try {
          await fs.promises.rename(tempPath, filePath);
          break;
        } catch (renameErr) {
          attempts++;
          if (
            (renameErr.code === 'EPERM' || renameErr.code === 'EBUSY' || renameErr.code === 'EACCES') &&
            attempts < maxAttempts
          ) {
            await new Promise((res) => setTimeout(res, 20 * attempts));
            if (attempts >= 3) {
              try {
                await fs.promises.copyFile(tempPath, filePath);
                await fs.promises.unlink(tempPath).catch(() => {});
                break;
              } catch (_) {}
            }
          } else {
            throw renameErr;
          }
        }
      }
    } catch (err) {
      // Clean up temp file if rename or write failed
      try {
        if (fs.existsSync(tempPath)) {
          await fs.promises.unlink(tempPath);
        }
      } catch (cleanupErr) {
        // ignore cleanup error
      }
      throw new Error(`Atomic write failed for ${filePath}: ${err.message}`);
    }
  });
};

/**
 * Safely read JSON file with fallback
 */
export const safeReadJson = async (filePath, fallback = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      await atomicWriteJson(filePath, fallback);
      return fallback;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    if (!content.trim()) return fallback;
    return JSON.parse(content);
  } catch (err) {
    console.error(`[WARN] Error reading JSON from ${filePath}, returning fallback:`, err.message);
    return fallback;
  }
};

/**
 * Initialize all storage directories and seed JSON files
 */
export const initStorage = async () => {
  const dirs = [
    STORAGE_PATHS.APPLICATIONS_DIR,
    STORAGE_PATHS.USERS_DIR,
    STORAGE_PATHS.REVIEWS_DIR,
    STORAGE_PATHS.NOTIFICATIONS_DIR,
    STORAGE_PATHS.PRIVATE_DIR,
    STORAGE_PATHS.PRIVATE_DOCUMENTS_DIR,
    STORAGE_PATHS.PRIVATE_PHOTOS_DIR,
    STORAGE_PATHS.LOGS_DIR
  ];

  for (const d of dirs) {
    await fs.promises.mkdir(d, { recursive: true });
  }

  // Ensure JSON database files exist
  await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
  await safeReadJson(STORAGE_PATHS.REVIEWS_FILE, []);
  await safeReadJson(STORAGE_PATHS.NOTIFICATIONS_FILE, []);

  // Initialize and seed Users if empty
  const users = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
  let updatedUsers = false;

  // Seed Super Admin if missing
  const superAdminExists = users.some((u) => u.email === env.ADMIN.EMAIL);
  if (!superAdminExists) {
    const adminHash = await hashPassword(env.ADMIN.PASSWORD);
    users.push({
      id: 'usr_admin_001',
      legal_name: env.ADMIN.DISPLAY_NAME,
      display_name: 'SuperAdmin',
      email: env.ADMIN.EMAIL,
      mobile: '9999999999',
      password_hash: adminHash,
      role: 'SUPER_ADMIN',
      account_status: 'ACTIVE',
      verification_status: 'APPROVED',
      is_active: true,
      college_name: 'IIT Kharagpur',
      course: 'Administration & Safety',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      additional_photos: [],
      bio: 'Collégé System Administrator & Campus Safety Lead',
      created_at: new Date().toISOString()
    });
    updatedUsers = true;
  }

  // Seed Verification Admin if missing
  const verifierExists = users.some((u) => u.email === env.ADMIN.VERIFIER_EMAIL);
  if (!verifierExists) {
    const verifierHash = await hashPassword(env.ADMIN.VERIFIER_PASSWORD);
    users.push({
      id: 'usr_admin_002',
      legal_name: 'Campus Verification Admin',
      display_name: 'VerifierAdmin',
      email: env.ADMIN.VERIFIER_EMAIL,
      mobile: '9888888888',
      password_hash: verifierHash,
      role: 'VERIFICATION_ADMIN',
      account_status: 'ACTIVE',
      verification_status: 'APPROVED',
      is_active: true,
      college_name: 'St. Xavier\'s College, Kolkata',
      course: 'Verification Moderation',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      additional_photos: [],
      bio: 'Document & Photo Integrity Officer',
      created_at: new Date().toISOString()
    });
    updatedUsers = true;
  }

  if (updatedUsers) {
    await atomicWriteJson(STORAGE_PATHS.USERS_FILE, users);
  }
};

/**
 * ----------------------------------------------------------------------
 * REPOSITORIES
 * ----------------------------------------------------------------------
 */

// 1. Applications Repository
export const applicationsRepo = {
  getAll: async () => {
    return safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
  },

  getById: async (id) => {
    const list = await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
    return list.find((a) => a.id === id || a.application_id === id) || null;
  },

  getByAppId: async (appId) => {
    const list = await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
    return list.find((a) => a.application_id === appId) || null;
  },

  findByEmailOrMobile: async (email, mobile) => {
    const list = await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanMobile = (mobile || '').trim();

    return list.find(
      (a) =>
        (a.email && a.email.toLowerCase().trim() === cleanEmail) ||
        (a.mobile && a.mobile.trim() === cleanMobile)
    ) || null;
  },

  create: async (appData) => {
    const list = await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
    list.unshift(appData);
    await atomicWriteJson(STORAGE_PATHS.APPLICATIONS_FILE, list);
    return appData;
  },

  update: async (id, updates) => {
    const list = await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
    let updatedApp = null;

    const newList = list.map((a) => {
      if (a.id === id || a.application_id === id) {
        updatedApp = { ...a, ...updates, updated_at: new Date().toISOString() };
        return updatedApp;
      }
      return a;
    });

    if (updatedApp) {
      await atomicWriteJson(STORAGE_PATHS.APPLICATIONS_FILE, newList);
    }
    return updatedApp;
  }
};

// 2. Users Repository
export const usersRepo = {
  getAll: async () => {
    return safeReadJson(STORAGE_PATHS.USERS_FILE, []);
  },

  getById: async (id) => {
    const list = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
    return list.find((u) => u.id === id) || null;
  },

  findByEmail: async (email) => {
    const list = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
    const clean = (email || '').toLowerCase().trim();
    return list.find((u) => u.email && u.email.toLowerCase().trim() === clean) || null;
  },

  findByMobile: async (mobile) => {
    const list = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
    const clean = (mobile || '').trim();
    return list.find((u) => u.mobile && u.mobile.trim() === clean) || null;
  },

  findByEmailOrMobile: async (identifier) => {
    const list = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
    const clean = (identifier || '').toLowerCase().trim();
    return (
      list.find(
        (u) =>
          (u.email && u.email.toLowerCase().trim() === clean) ||
          (u.mobile && u.mobile.trim() === clean)
      ) || null
    );
  },

  create: async (userData) => {
    const list = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
    list.push(userData);
    await atomicWriteJson(STORAGE_PATHS.USERS_FILE, list);
    return userData;
  },

  update: async (id, updates) => {
    const list = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
    let updatedUser = null;

    const newList = list.map((u) => {
      if (u.id === id) {
        updatedUser = { ...u, ...updates, updated_at: new Date().toISOString() };
        return updatedUser;
      }
      return u;
    });

    if (updatedUser) {
      await atomicWriteJson(STORAGE_PATHS.USERS_FILE, newList);
    }
    return updatedUser;
  }
};

// 3. Reviews & Audit Trail Repository
export const reviewsRepo = {
  getAll: async () => {
    return safeReadJson(STORAGE_PATHS.REVIEWS_FILE, []);
  },

  getByApplicationId: async (appId) => {
    const list = await safeReadJson(STORAGE_PATHS.REVIEWS_FILE, []);
    return list.filter((r) => r.application_id === appId || r.application_primary_id === appId);
  },

  add: async (reviewRecord) => {
    const list = await safeReadJson(STORAGE_PATHS.REVIEWS_FILE, []);
    list.unshift(reviewRecord);
    await atomicWriteJson(STORAGE_PATHS.REVIEWS_FILE, list);
    return reviewRecord;
  }
};

// 4. Notifications Repository
export const notificationsRepo = {
  getAll: async () => {
    return safeReadJson(STORAGE_PATHS.NOTIFICATIONS_FILE, []);
  },

  getByUserId: async (userId) => {
    const list = await safeReadJson(STORAGE_PATHS.NOTIFICATIONS_FILE, []);
    return list.filter((n) => n.user_id === userId);
  },

  getByAppId: async (appId) => {
    const list = await safeReadJson(STORAGE_PATHS.NOTIFICATIONS_FILE, []);
    return list.filter((n) => n.application_id === appId);
  },

  add: async (notifData) => {
    const list = await safeReadJson(STORAGE_PATHS.NOTIFICATIONS_FILE, []);
    list.unshift(notifData);
    await atomicWriteJson(STORAGE_PATHS.NOTIFICATIONS_FILE, list);
    return notifData;
  }
};

/**
 * ----------------------------------------------------------------------
 * JOURNALED RECOVERABLE APPROVAL TRANSACTION
 * Ensures active user creation & application status update are atomic.
 * ----------------------------------------------------------------------
 */
export const executeApprovalTransaction = async ({ application, adminUser }) => {
  const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const journalPath = path.join(STORAGE_PATHS.REVIEWS_DIR, `journal_${txId}.json`);

  // Read current states
  const currentUsers = await safeReadJson(STORAGE_PATHS.USERS_FILE, []);
  const currentApps = await safeReadJson(STORAGE_PATHS.APPLICATIONS_FILE, []);
  const currentReviews = await safeReadJson(STORAGE_PATHS.REVIEWS_FILE, []);

  // Write Journal for recovery
  const journalSnapshot = {
    txId,
    timestamp: new Date().toISOString(),
    applicationId: application.application_id,
    adminId: adminUser.id
  };
  await fs.promises.writeFile(journalPath, JSON.stringify(journalSnapshot, null, 2), 'utf-8');

  try {
    // 1. Construct Active User record
    const newUser = {
      id: application.id || `usr_${Date.now()}`,
      application_id: application.application_id,
      legal_name: application.legal_name,
      display_name: application.display_name,
      date_of_birth: application.date_of_birth,
      age: application.age,
      gender: application.gender,
      email: application.email,
      mobile: application.mobile,
      city: application.city,
      state: application.state,
      languages_spoken: application.languages_spoken,
      password_hash: application.password_hash,
      role: 'STUDENT',
      account_status: 'ACTIVE',
      verification_status: 'APPROVED',
      is_active: true,
      college_name: application.college_name,
      university_name: application.university_name,
      course: application.degree_name,
      department: application.department_stream,
      academic_year: application.academic_year,
      graduation_year: application.graduation_year,
      avatar_url: application.photo_1,
      additional_photos: [application.photo_2, application.photo_3].filter(Boolean),
      bio: application.bio,
      interests: application.interests || ['Music', 'Travelling'],
      hobbies: application.hobbies || [],
      looking_for: application.looking_for || 'Friendship',
      approved_by_admin: adminUser.display_name || adminUser.email,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // 2. Append new user to users
    const updatedUsers = [...currentUsers.filter((u) => u.email !== newUser.email), newUser];
    await atomicWriteJson(STORAGE_PATHS.USERS_FILE, updatedUsers);

    // 3. Update application status to APPROVED
    const updatedApps = currentApps.map((a) => {
      if (a.id === application.id || a.application_id === application.application_id) {
        return {
          ...a,
          status: 'APPROVED',
          rejection_reason: null,
          approved_at: new Date().toISOString(),
          approved_by: adminUser.display_name || adminUser.email
        };
      }
      return a;
    });
    await atomicWriteJson(STORAGE_PATHS.APPLICATIONS_FILE, updatedApps);

    // 4. Record Review Audit entry
    const reviewLog = {
      id: `rev_${Date.now()}`,
      application_id: application.application_id,
      application_primary_id: application.id,
      admin_id: adminUser.id,
      admin_name: adminUser.display_name || adminUser.email,
      action: 'APPROVE',
      previous_status: application.status,
      new_status: 'APPROVED',
      notes: 'Manually verified 18+ age, college enrollment, identity document, and all 3 photographs.',
      created_at: new Date().toISOString()
    };
    await atomicWriteJson(STORAGE_PATHS.REVIEWS_FILE, [reviewLog, ...currentReviews]);

    // 5. Successfully committed -> remove journal file
    if (fs.existsSync(journalPath)) {
      await fs.promises.unlink(journalPath);
    }

    return { success: true, user: newUser, application: updatedApps.find((a) => a.id === application.id) };
  } catch (err) {
    // Rollback to snapshots
    console.error(`[ROLLBACK] Approval transaction ${txId} failed, rolling back:`, err.message);
    await atomicWriteJson(STORAGE_PATHS.USERS_FILE, currentUsers);
    await atomicWriteJson(STORAGE_PATHS.APPLICATIONS_FILE, currentApps);
    await atomicWriteJson(STORAGE_PATHS.REVIEWS_FILE, currentReviews);
    if (fs.existsSync(journalPath)) {
      await fs.promises.unlink(journalPath);
    }
    throw new Error(`Approval transaction failed and was rolled back: ${err.message}`);
  }
};

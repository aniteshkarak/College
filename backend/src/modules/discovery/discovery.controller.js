import discoveryService from './discovery.service.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const preferencesSchema = z.object({
  gender: z.enum(['FEMALE', 'MALE', 'EVERYONE', 'Female', 'Male', 'All', 'Women', 'Men', 'everyone']).optional(),
  preferredGender: z.enum(['FEMALE', 'MALE', 'EVERYONE', 'Female', 'Male', 'All', 'Women', 'Men', 'everyone']).optional(),
  minAge: z.number().int().min(18).max(100).optional(),
  maxAge: z.number().int().min(18).max(100).optional(),
  relationshipIntention: z.string().optional(),
  city: z.string().optional(),
  sameCollegeOnly: z.boolean().optional(),
  maxDistance: z.number().optional(),
});

const passSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required to record a pass'),
});

/**
 * GET /api/v1/discovery
 * Retrieves college-first, gender-filtered public profiles
 */
export const getProfiles = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const result = await discoveryService.getDiscoveryProfiles(currentUserId, req.query);

    return success(res, result, 'Discovery profiles retrieved');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return error(res, err.message, statusCode, err.code ? { code: err.code } : null);
  }
};

/**
 * GET /api/v1/discovery/preferences
 * Returns the authenticated user's saved discovery preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const preferences = await discoveryService.getDiscoveryPreferences(req.user.id);
    return success(res, { preferences }, 'Discovery preferences retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PUT /api/v1/discovery/preferences
 * Updates and persists discovery preferences for the authenticated user
 */
export const updatePreferences = async (req, res) => {
  try {
    const parseResult = preferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed: Invalid preferences schema', 400, parseResult.error.issues);
    }

    const updated = await discoveryService.saveDiscoveryPreferences(req.user.id, parseResult.data);
    return success(res, { preferences: updated }, 'Discovery preferences updated successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/v1/discovery/pass
 * Records a passed profile so it is excluded from future discovery
 */
export const passProfile = async (req, res) => {
  try {
    const parseResult = passSchema.safeParse(req.body);
    if (!parseResult.success) {
      return error(res, 'Validation failed: targetUserId is required', 400, parseResult.error.issues);
    }

    const result = await discoveryService.recordProfilePass(req.user.id, parseResult.data.targetUserId);
    return success(res, result, 'Profile passed successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/v1/discovery/cycle/reset
 * Explicitly resets the discovery cycle and advances to next cycleId
 */
export const resetCycle = async (req, res) => {
  try {
    const result = await discoveryService.resetDiscoveryCycle(req.user.id);
    return success(res, result, 'Discovery cycle reset successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export default {
  getProfiles,
  getPreferences,
  updatePreferences,
  passProfile,
  resetCycle,
};

import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import discoveryController from './discovery.controller.js';

const router = Router();

// 1. Get Discovery Profiles (College-first, gender-preference filtered, paginated)
router.get('/', requireAuth, discoveryController.getProfiles);

// 2. Get User's Saved Discovery Preferences
router.get('/preferences', requireAuth, discoveryController.getPreferences);

// 3. Update User's Saved Discovery Preferences
router.put('/preferences', requireAuth, discoveryController.updatePreferences);

// 4. Record a Passed Profile (Excludes from future discovery)
router.post('/pass', requireAuth, discoveryController.passProfile);

// 5. Reset Discovery Cycle (Advances to next cycle with new rotation)
router.post('/cycle/reset', requireAuth, discoveryController.resetCycle);

export default router;

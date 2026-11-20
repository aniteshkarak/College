import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import prisma from '../../config/prisma.js';
import { success, error } from '../../utils/response.js';
import { z } from 'zod';

const router = Router();

const ALLOWED_CATEGORIES = [
  'Harassment',
  'Inappropriate content',
  'Fake profile',
  'Impersonation',
  'Spam',
  'Unwanted contact',
  'Threats',
  'Other',
];

const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  category: z.string().refine((val) => ALLOWED_CATEGORIES.some((c) => c.toLowerCase() === val.toLowerCase()), {
    message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
  }),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000),
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed', 400, parsed.error.issues);
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        reportedUserId: parsed.data.reportedUserId,
        category: parsed.data.category,
        reason: parsed.data.reason,
      },
    });

    return success(res, { report }, 'Safety report submitted for admin review', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

export default router;

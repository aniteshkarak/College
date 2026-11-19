import { z } from 'zod';
import { isEligible18Plus } from '../../utils/date.js';

export const registrationSubmissionSchema = z.object({
  // STEP 1: Personal Information
  legal_name: z.string().trim().min(2, 'Full legal name must be at least 2 characters').max(100),
  display_name: z.string().trim().min(2, 'Display name must be at least 2 characters').max(50),
  date_of_birth: z.string().refine((dob) => isEligible18Plus(dob), {
    message: 'Applicant must be at least 18 years of age under India DPDP Act and platform safety rules.'
  }),
  email: z.string().trim().email('Invalid email address format'),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  gender: z.string().optional().default('Not specified'),
  city: z.string().trim().min(2, 'City is required').default('Kolkata'),
  state: z.string().trim().min(2, 'State is required').default('West Bengal'),
  languages_spoken: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }).default(['English', 'Bengali', 'Hindi']),
  password: z.string().min(8, 'Password must be at least 8 characters long'),

  // STEP 2: College and Education Details
  college_name: z.string().trim().min(2, 'College/University name is required'),
  university_name: z.string().trim().optional().default('Autonomous / Affiliated'),
  college_location: z.string().trim().optional(),
  college_state: z.string().trim().optional(),
  degree_name: z.string().trim().min(2, 'Course/Degree name is required'),
  department_stream: z.string().trim().optional().default('General Stream'),
  academic_year: z.string().optional().default('1st Year'),
  current_semester: z.string().optional().default('Semester 1'),
  graduation_year: z.union([z.number(), z.string()]).transform((v) => parseInt(v, 10)).default(2026),
  student_status: z.string().optional().default('CURRENTLY_STUDYING'),

  // STEP 3: Identity Document Details
  verification_id_type: z.enum([
    'College Student ID',
    'Govt Voter ID',
    'Aadhaar Document (Masked)'
  ]).default('College Student ID'),
  verification_id_url: z.string().optional(), // if passed as base64 or URL

  // STEP 4: Photo URLs (if passed as base64/URL instead of binary multipart)
  photo_1: z.string().optional(),
  photo_2: z.string().optional(),
  photo_3: z.string().optional(),

  // STEP 5: About Me & Preferences
  bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').optional().default(''),
  interests: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }).default(['Music', 'Travelling']),
  hobbies: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }).default(['Reading']),
  looking_for: z.enum([
    'Friendship',
    'Casual chatting',
    'Dating',
    'Serious relationship'
  ]).default('Friendship'),
  preferred_distance: z.string().optional().default('SAME_CITY'),
  age_range_min: z.union([z.number(), z.string()]).transform((v) => parseInt(v, 10)).default(18),
  age_range_max: z.union([z.number(), z.string()]).transform((v) => parseInt(v, 10)).default(26),

  // STEP 6: Consents
  termsAccepted: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
  privacyAccepted: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
  ageConfirmed18Plus: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
  verificationConsent: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true')
});

export const resubmissionSchema = z.object({
  college_name: z.string().trim().min(2).optional(),
  degree_name: z.string().trim().min(2).optional(),
  verification_id_type: z.string().optional(),
  verification_id_url: z.string().optional(),
  photo_1: z.string().optional(),
  photo_2: z.string().optional(),
  photo_3: z.string().optional(),
  bio: z.string().optional()
});

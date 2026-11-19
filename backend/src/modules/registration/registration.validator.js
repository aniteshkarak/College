import { z } from 'zod';

// Helper to normalize array fields that may arrive as JSON strings in multipart/form-data
const arrayOrString = (fallback = []) =>
  z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return fallback;
  });

export const fullRegistrationSchema = z.object({
  // STEP 1: Personal Information
  legalName: z.string().min(2, 'Full legal name must be at least 2 characters').max(100),
  displayName: z.string().min(2, 'Preferred display name must be at least 2 characters').max(50),
  dateOfBirth: z.string().refine((dob) => {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, 'Applicant must be at least 18 years old under Indian legal compliance (DPDP Act)'),
  email: z.string().email('Invalid email address format'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  gender: z.string().optional().default('Not specified'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  languagesSpoken: arrayOrString(['English', 'Hindi']),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100),

  // STEP 2: College and Education Information
  collegeName: z.string().min(2, 'College name is required'),
  universityName: z.string().optional().default('Affiliated / Autonomous'),
  collegeLocation: z.string().optional(),
  collegeState: z.string().optional(),
  degreeName: z.string().min(2, 'Degree/course name is required'),
  departmentStream: z.string().optional().default('General Stream'),
  academicYear: z.string().optional().default('1st Year'),
  currentSemester: z.string().optional().default('Semester 1'),
  graduationYear: z.union([z.number(), z.string()]).transform((v) => parseInt(v, 10)).default(2026),
  studentStatus: z.string().optional().default('CURRENTLY_STUDYING'),

  // STEP 3: Identity Verification Document
  documentType: z.string().default('COLLEGE_ID'),
  documentUrl: z.any().optional(), // Can be string URL/base64 or Multer file object
  documentNumberMasked: z.string().optional(),

  // STEP 4: Exactly THREE Photographs (Photo 1, Photo 2, Photo 3)
  photo1: z.any().optional(),
  photo2: z.any().optional(),
  photo3: z.any().optional(),

  // STEP 5: About Me and Connection Preferences
  bio: z.string().optional().default('Student at Collégé.'),
  interests: arrayOrString(['Music', 'Travelling']),
  hobbies: arrayOrString(['Reading']),
  personality: z.string().optional(),
  lookingFor: z.string().default('Friendship'),
  ageRangeMin: z.union([z.number(), z.string()]).transform((v) => parseInt(v, 10)).default(18),
  ageRangeMax: z.union([z.number(), z.string()]).transform((v) => parseInt(v, 10)).default(26),
  preferredDistance: z.string().default('ANYWHERE_INDIA'),

  // STEP 6: Consents and Acknowledgements
  termsAccepted: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
  privacyAccepted: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
  ageConfirmed18Plus: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
  verificationConsent: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true'),
});

export const resubmitCorrectionSchema = z.object({
  applicationId: z.string(),
  legalName: z.string().optional(),
  collegeName: z.string().optional(),
  degreeName: z.string().optional(),
  departmentStream: z.string().optional(),
  academicYear: z.string().optional(),
  documentType: z.string().optional(),
  documentUrl: z.any().optional(),
  photo1: z.any().optional(),
  photo2: z.any().optional(),
  photo3: z.any().optional(),
  bio: z.string().optional(),
  correctionNote: z.string().optional()
});

export default {
  fullRegistrationSchema,
  resubmitCorrectionSchema,
};

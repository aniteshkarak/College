import { z } from 'zod';

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
  }, 'Applicant must be at least 18 years old under Indian legal compliance'),
  email: z.string().email('Invalid email address format'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  gender: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  languagesSpoken: z.array(z.string()).min(1, 'Select at least one spoken language'),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100),

  // STEP 2: College and Education Information
  collegeName: z.string().min(2, 'College name is required'),
  universityName: z.string().optional(),
  collegeLocation: z.string().optional(),
  collegeState: z.string().optional(),
  degreeName: z.string().min(2, 'Degree/course name is required'),
  departmentStream: z.string().min(2, 'Department/stream is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  currentSemester: z.string().optional(),
  graduationYear: z.number().int().min(2020).max(2035),
  studentStatus: z.enum(['CURRENTLY_STUDYING', 'RECENTLY_GRADUATED', 'OTHER']),

  // STEP 3: Identity Verification Document
  documentType: z.enum(['COLLEGE_ID', 'VOTER_ID', 'AADHAAR_MASKED']),
  documentUrl: z.string().min(1, 'Identity verification document is required'),
  documentNumberMasked: z.string().optional(),

  // STEP 4: Exactly THREE Photographs (Photo 1, Photo 2, Photo 3)
  photo1: z.string().min(1, 'Photo 1 (Main Profile Picture) is required'),
  photo2: z.string().min(1, 'Photo 2 (Additional Personal Photo) is required'),
  photo3: z.string().min(1, 'Photo 3 (Additional Personal Photo) is required'),

  // STEP 5: About Me and Connection Preferences
  bio: z.string().min(10, 'Biography must be at least 10 characters').max(1000),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  hobbies: z.array(z.string()).min(1, 'Select at least one hobby'),
  personality: z.string().optional(),
  lookingFor: z.enum(['Friendship', 'Casual chatting', 'Dating', 'Serious relationship']),
  ageRangeMin: z.number().int().min(18).default(18),
  ageRangeMax: z.number().int().min(18).max(40).default(26),
  preferredDistance: z.enum(['SAME_COLLEGE', 'SAME_CITY', 'ANYWHERE_INDIA']).default('ANYWHERE_INDIA'),

  // STEP 6: Consents and Acknowledgements
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the Terms of Service' }) }),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the Privacy Policy' }) }),
  ageConfirmed18Plus: z.literal(true, { errorMap: () => ({ message: 'You must confirm 18+ eligibility' }) }),
  verificationConsent: z.literal(true, { errorMap: () => ({ message: 'You must consent to manual application verification' }) }),
});

export const resubmitCorrectionSchema = z.object({
  applicationId: z.string(),
  legalName: z.string().optional(),
  collegeName: z.string().optional(),
  degreeName: z.string().optional(),
  departmentStream: z.string().optional(),
  academicYear: z.string().optional(),
  documentType: z.enum(['COLLEGE_ID', 'VOTER_ID', 'AADHAAR_MASKED']).optional(),
  documentUrl: z.string().optional(),
  photo1: z.string().optional(),
  photo2: z.string().optional(),
  photo3: z.string().optional(),
  bio: z.string().optional(),
  correctionNote: z.string().optional()
});

export default {
  fullRegistrationSchema,
  resubmitCorrectionSchema,
};

import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  dateOfBirth: z
    .string()
    .refine((dob) => {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
    }, 'You must be at least 18 years old to join Collégé'),
  collegeName: z.string().min(2, 'College name is required'),
  course: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Non-Binary', 'Other']),
  interestedIn: z.array(z.string()).min(1, 'Please select at least one interest preference'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters'),
  // At least 2 photos required:
  avatarUrl: z.string().url('Photo 1 (Profile Avatar) is required'),
  additionalPhotos: z.array(z.string().url()).min(1, 'At least 2 photos are required (Photo 1 + Photo 2)'),
  // Verification ID proof (College ID or Govt ID)
  verificationIdUrl: z.string().min(1, 'Verification ID document/card proof is required'),
  verificationIdType: z.enum(['COLLEGE_ID', 'GOVT_ID']).default('COLLEGE_ID'),
  relationshipIntention: z.enum(['Casual Connection', 'Dating Connection', 'Serious Relationship']).default('Casual Connection'),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or Mobile Number is required'), // can be email or mobile
  password: z.string().min(1, 'Password is required'),
});

export const resubmitVerificationSchema = z.object({
  fullName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  collegeName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
  additionalPhotos: z.array(z.string().url()).min(1).optional(),
  verificationIdUrl: z.string().min(1).optional(),
  verificationIdType: z.enum(['COLLEGE_ID', 'GOVT_ID']).optional(),
});

export default { registerSchema, loginSchema, resubmitVerificationSchema };

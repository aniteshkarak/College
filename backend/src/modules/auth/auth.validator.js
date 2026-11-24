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
    }, 'You must be at least 18 years old to join Collage Story'),
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
  avatarUrl: z.string().url('Photo 1 (Profile Avatar) is required'),
  additionalPhotos: z.array(z.string().url()).min(1, 'At least 2 photos are required (Photo 1 + Photo 2)'),
  verificationIdUrl: z.string().min(1, 'Verification ID document/card proof is required'),
  verificationIdType: z.enum(['COLLEGE_ID', 'GOVT_ID']).default('COLLEGE_ID'),
  relationshipIntention: z.enum(['Casual Connection', 'Dating Connection', 'Serious Relationship']).default('Casual Connection'),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email, Mobile Number, or User ID is required').optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => (data.identifier && data.identifier.trim().length > 0) || (data.email && data.email.trim().length > 0), {
  message: 'Email, Mobile Number, or User ID is required',
  path: ['identifier'],
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

export const forgotPasswordSchema = z.object({
  email: z.string().email('A valid email address is required'),
});

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      passwordStrengthRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      passwordStrengthRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required'),
});

export default {
  registerSchema,
  loginSchema,
  resubmitVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
};

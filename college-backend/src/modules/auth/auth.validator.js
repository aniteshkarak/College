import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Email, mobile or Application ID required'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email address required')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

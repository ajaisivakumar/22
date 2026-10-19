import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and privacy policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatarUrl: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const labComplaintSchema = z.object({
  floor: z.string().min(1, 'Please select a floor'),
  lab: z.string().min(1, 'Please select a computer lab'),
  systemNumber: z.string().min(1, 'Please enter system number (e.g., LAB-2-SYS-15)'),
  description: z.string().min(5, 'Please provide a description of the issue'),
});

export type LabComplaintFormData = z.infer<typeof labComplaintSchema>;

export const createPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'Must have at least 2 options'),
  expiresAt: z.string().min(1, 'Expiration date required'),
});

export type CreatePollFormData = z.infer<typeof createPollSchema>;

export const createEventSchema = z.object({
  title: z.string().min(3, 'Event title is required'),
  description: z.string().min(10, 'Event description is required'),
  category: z.string().min(1, 'Select a category'),
  eventDate: z.string().min(1, 'Event date and time is required'),
  venue: z.string().min(2, 'Venue is required'),
  registrationLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  brochureUrl: z.string().optional(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;

export const createOpportunitySchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Detailed description is required'),
  category: z.string().min(1, 'Category is required'),
  requiredSkills: z.string().min(2, 'List at least one skill or role'),
  teamSize: z.coerce.number().min(1, 'Team size must be at least 1'),
  contactPreference: z.string().default('in_app'),
});

export type CreateOpportunityFormData = z.infer<typeof createOpportunitySchema>;

export const lostFoundItemSchema = z.object({
  title: z.string().min(3, 'Item name is required'),
  type: z.enum(['LOST', 'FOUND']),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(2, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(5, 'Description is required'),
  imageUrl: z.string().optional(),
  contactInfo: z.string().optional(),
  isSensitive: z.boolean().default(false),
});

export type LostFoundItemFormData = z.infer<typeof lostFoundItemSchema>;

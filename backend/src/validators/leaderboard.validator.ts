import { z } from 'zod';

export const publishLeaderboardSchema = z.object({
  semesterMilestone: z.coerce.number().int().min(1).max(10),
  academicBatch: z.string().default('2025-2029'),
  displayMode: z.enum(['ANONYMOUS', 'CUSTOM_ALIAS', 'PUBLIC_NAME']).default('ANONYMOUS'),
  publicDisplayName: z.string().max(50).optional().nullable(),
  consentGiven: z.boolean().refine((val) => val === true, 'Consent must be given to publish on leaderboard'),
});

export const updateLeaderboardConsentSchema = z.object({
  semesterMilestone: z.coerce.number().int().min(1).max(10),
  academicBatch: z.string().default('2025-2029'),
  displayMode: z.enum(['ANONYMOUS', 'CUSTOM_ALIAS', 'PUBLIC_NAME']).optional(),
  publicDisplayName: z.string().max(50).optional().nullable(),
  isPublished: z.boolean().optional(),
});

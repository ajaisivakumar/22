import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.string().min(2).max(50),
  description: z.string().min(10).max(5000),
  brochureUrl: z.string().url().optional().nullable(),
  brochureKey: z.string().optional().nullable(),
  registrationUrl: z.string().url().optional().nullable(),
  eventStartDate: z.string().datetime().optional().nullable(),
  eventEndDate: z.string().datetime().optional().nullable(),
  registrationDeadline: z.string().datetime().optional().nullable(),
  organizer: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  format: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).optional().default('OFFLINE'),
});

export const updateEventSchema = createEventSchema.partial();

export const reportEventSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const moderateEventSchema = z.object({
  status: z.enum(['PUBLISHED', 'REJECTED']),
  moderatorNote: z.string().max(500).optional(),
});

import { z } from 'zod';

export const createPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500),
  options: z
    .array(z.string().min(1, 'Option text cannot be empty').max(200))
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed'),
  closesAt: z.string().datetime().optional(),
  resultsVisibility: z.enum(['ALWAYS', 'AFTER_VOTE', 'AFTER_CLOSE']).default('AFTER_VOTE'),
});

export const updatePollSchema = z.object({
  question: z.string().min(5).max(500).optional(),
  closesAt: z.string().datetime().optional().nullable(),
  resultsVisibility: z.enum(['ALWAYS', 'AFTER_VOTE', 'AFTER_CLOSE']).optional(),
});

export const votePollSchema = z.object({
  optionId: z.string().uuid('Valid option ID required'),
});

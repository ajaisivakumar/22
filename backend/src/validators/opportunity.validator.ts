import { z } from 'zod';

export const createOpportunitySchema = z.object({
  title: z.string().min(3).max(200),
  category: z.string().min(2).max(50),
  description: z.string().min(10).max(5000),
  skillsNeeded: z.string().max(500).optional().nullable(),
  teamSize: z.coerce.number().int().min(1).max(50).optional().nullable(),
  collaborationMode: z.string().max(50).optional().nullable(),
  eventName: z.string().max(200).optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  additionalInfo: z.string().max(2000).optional().nullable(),
  lookingFor: z.string().max(200).optional().nullable(),
});

export const updateOpportunitySchema = z.object({
  title: z.string().min(3).max(200).optional(),
  category: z.string().min(2).max(50).optional(),
  description: z.string().min(10).max(5000).optional(),
  skillsNeeded: z.string().max(500).optional().nullable(),
  teamSize: z.coerce.number().int().min(1).max(50).optional().nullable(),
  collaborationMode: z.string().max(50).optional().nullable(),
  eventName: z.string().max(200).optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  additionalInfo: z.string().max(2000).optional().nullable(),
  lookingFor: z.string().max(200).optional().nullable(),
  status: z.enum(['OPEN', 'TEAM_FORMED', 'CLOSED']).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(3000),
});

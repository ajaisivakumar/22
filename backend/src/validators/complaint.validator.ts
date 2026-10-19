import { z } from 'zod';

export const createComplaintSchema = z.object({
  floor: z.string().min(1, 'Floor is required').max(50),
  lab: z.string().min(1, 'Lab is required').max(100),
  systemNumber: z.string().min(1, 'System number is required').max(50),
  description: z.string().min(5, 'Issue description must be at least 5 characters').max(3000),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolutionNote: z.string().max(1000).optional(),
});

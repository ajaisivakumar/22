import { z } from 'zod';

export const createLostFoundItemSchema = z.object({
  itemName: z.string().max(100).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  foundLocation: z.string().max(200).optional().nullable(),
  currentLocation: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  itemStatus: z.enum(['FOUND', 'HANDED_OVER', 'CLAIMED', 'RETURNED', 'CLOSED']).default('FOUND'),
});

export const updateLostFoundItemSchema = z.object({
  itemName: z.string().max(100).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  foundLocation: z.string().max(200).optional().nullable(),
  currentLocation: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  itemStatus: z.enum(['FOUND', 'HANDED_OVER', 'CLAIMED', 'RETURNED', 'CLOSED']).optional(),
  isHidden: z.boolean().optional(),
});

export const reportLostFoundSchema = z.object({
  reason: z.string().min(5).max(500),
});

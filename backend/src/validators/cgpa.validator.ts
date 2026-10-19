import { z } from 'zod';

export const subjectGradeInputSchema = z.object({
  curriculumCourseId: z.string().uuid().optional().nullable(),
  subjectNameSnapshot: z.string().min(1).max(200),
  creditSnapshot: z.coerce.number().min(0.5).max(30),
  letterGrade: z.string().min(1).max(5),
  includedInCalc: z.boolean().default(true),
  selectedElective: z.string().max(200).optional().nullable(),
});

export const saveSemesterResultSchema = z.object({
  semester: z.coerce.number().int().min(1).max(10),
  curriculumVersion: z.string().default('2025'),
  subjectGrades: z.array(subjectGradeInputSchema).min(1, 'At least one subject grade required'),
  isPublishedToLeaderboard: z.boolean().default(false),
  academicBatch: z.string().optional().default('2025-2029'),
});

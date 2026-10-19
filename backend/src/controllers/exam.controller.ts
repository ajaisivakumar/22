import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import prisma from '../config/database';
import aiService from '../services/ai.service';
import storageService from '../services/storage.service';

export class ExamController {
  public static async extract(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please upload an image of the timetable' });
        return;
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const extracted = await aiService.extractTimetableFromImage(req.file.path, fileBuffer);

      res.status(200).json({
        success: true,
        data: {
          ...extracted,
          sourceImageUrl: storageService.getFileUrl(req.file.filename),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exams } = req.body;
      if (!Array.isArray(exams) || exams.length === 0) {
        res.status(400).json({ success: false, message: 'List of exams is required for analysis' });
        return;
      }

      const today = new Date();
      const analyzed = exams.map((exam: any) => {
        const examDate = new Date(exam.examDate);
        const diffMs = examDate.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        let urgency = 'NORMAL';
        if (daysRemaining <= 3) urgency = 'CRITICAL';
        else if (daysRemaining <= 7) urgency = 'HIGH';
        else if (daysRemaining <= 14) urgency = 'MODERATE';

        return {
          ...exam,
          daysRemaining,
          urgency,
        };
      });

      res.status(200).json({ success: true, data: analyzed });
    } catch (err) {
      next(err);
    }
  }

  public static async studyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exams } = req.body;
      if (!Array.isArray(exams) || exams.length === 0) {
        res.status(400).json({ success: false, message: 'List of exams is required to build a study plan' });
        return;
      }

      const plan = await aiService.generateStudyPlan(exams);
      res.status(200).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  public static async getTimetables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const timetables = await prisma.examTimetable.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { exams: { orderBy: { examDate: 'asc' } } },
      });

      res.status(200).json({ success: true, data: timetables });
    } catch (err) {
      next(err);
    }
  }

  public static async createTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { semester, academicYear, institution, branch, sourceImageUrl, exams, warnings } = req.body;

      const timetable = await prisma.examTimetable.create({
        data: {
          userId,
          semester: semester ? Number(semester) : null,
          academicYear: academicYear || null,
          institution: institution || null,
          branch: branch || null,
          sourceImageUrl: sourceImageUrl || null,
          warnings: warnings || null,
          status: 'CONFIRMED',
          exams: {
            create: (exams || []).map((e: any) => ({
              subjectCode: e.subjectCode || null,
              subjectName: e.subjectName,
              examDate: new Date(e.examDate),
              session: e.session || null,
              confidence: e.confidence || null,
              warnings: e.warnings || null,
            })),
          },
        },
        include: { exams: true },
      });

      res.status(201).json({ success: true, data: timetable });
    } catch (err) {
      next(err);
    }
  }

  public static async getTimetableById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const timetable = await prisma.examTimetable.findFirst({
        where: { id, userId },
        include: { exams: { orderBy: { examDate: 'asc' } } },
      });

      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      res.status(200).json({ success: true, data: timetable });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await prisma.examTimetable.deleteMany({
        where: { id, userId },
      });

      res.status(200).json({ success: true, message: 'Timetable deleted' });
    } catch (err) {
      next(err);
    }
  }
}

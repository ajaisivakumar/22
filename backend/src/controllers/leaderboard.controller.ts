import { Request, Response, NextFunction } from 'express';
import { LeaderboardRepository } from '../repositories/leaderboard.repository';
import { CgpaRepository } from '../repositories/cgpa.repository';

export class LeaderboardController {
  public static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academicBatch = '2025-2029', semesterMilestone } = req.query as {
        academicBatch?: string;
        semesterMilestone?: string;
      };

      const milestone = semesterMilestone ? parseInt(semesterMilestone, 10) : undefined;
      const leaderboard = await LeaderboardRepository.getLeaderboard(academicBatch, milestone);

      res.status(200).json({ success: true, data: leaderboard });
    } catch (err) {
      next(err);
    }
  }

  public static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { semesterMilestone, academicBatch, displayMode, publicDisplayName, consentGiven } = req.body;

      // Verify that user actually has results for this semester
      const semResult = await CgpaRepository.getStudentResultBySemester(userId, semesterMilestone);
      if (!semResult) {
        res.status(400).json({
          success: false,
          message: `You do not have saved GPA/CGPA results for Semester ${semesterMilestone}`,
        });
        return;
      }

      // Compute CGPA up to this milestone
      const allResults = await CgpaRepository.getAllStudentResults(userId);
      const eligibleResults = allResults.filter((r) => r.semester <= semesterMilestone);
      let cumulativeCredits = 0;
      let cumulativeWeighted = 0;
      eligibleResults.forEach((r) => {
        cumulativeCredits += r.totalEligibleCredits;
        cumulativeWeighted += r.totalWeightedPoints;
      });

      const validatedCGPA = cumulativeCredits > 0
        ? parseFloat((cumulativeWeighted / cumulativeCredits).toFixed(2))
        : semResult.calculatedGPA;

      const entry = await LeaderboardRepository.upsertLeaderboardEntry({
        userId,
        academicBatch: academicBatch || '2025-2029',
        semesterMilestone,
        validatedCGPA,
        semesterResultId: semResult.id,
        displayMode,
        publicDisplayName,
        consentGiven,
        isPublished: true,
      });

      res.status(200).json({
        success: true,
        message: 'Your validated CGPA has been published to the leaderboard',
        data: entry,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { semesterMilestone, academicBatch, displayMode, publicDisplayName, isPublished } = req.body;

      const existingEntries = await LeaderboardRepository.getUserEntries(userId);
      const target = existingEntries.find(
        (e) => e.academicBatch === (academicBatch || '2025-2029') && e.semesterMilestone === semesterMilestone
      );

      if (!target) {
        res.status(404).json({ success: false, message: 'Leaderboard entry not found' });
        return;
      }

      const updated = await LeaderboardRepository.upsertLeaderboardEntry({
        userId,
        academicBatch: target.academicBatch,
        semesterMilestone: target.semesterMilestone,
        validatedCGPA: target.validatedCGPA,
        semesterResultId: target.semesterResultId || undefined,
        displayMode: displayMode || target.displayMode,
        publicDisplayName: publicDisplayName !== undefined ? publicDisplayName : target.publicDisplayName,
        consentGiven: true,
        isPublished: isPublished !== undefined ? isPublished : target.isPublished,
      });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { semesterMilestone, academicBatch = '2025-2029' } = req.body;

      await LeaderboardRepository.removeUserFromLeaderboard(userId, academicBatch, Number(semesterMilestone));
      res.status(200).json({ success: true, message: 'Unpublished from leaderboard' });
    } catch (err) {
      next(err);
    }
  }

  public static async getMyEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const entries = await LeaderboardRepository.getUserEntries(userId);
      res.status(200).json({ success: true, data: entries });
    } catch (err) {
      next(err);
    }
  }
}

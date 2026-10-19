import { Request, Response, NextFunction } from 'express';
import { CgpaRepository } from '../repositories/cgpa.repository';
import { LeaderboardRepository } from '../repositories/leaderboard.repository';
import AuditService from '../audit/audit.service';

export class CgpaController {
  public static async getCurriculum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const semester = parseInt(req.params.semester, 10);
      const courses = await CgpaRepository.getCurriculumCourses(semester);
      res.status(200).json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  }

  public static async getGradeScales(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grades = await CgpaRepository.getGradeScales();
      res.status(200).json({ success: true, data: grades });
    } catch (err) {
      next(err);
    }
  }

  public static async saveResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const { semester, curriculumVersion, subjectGrades, isPublishedToLeaderboard, academicBatch } = req.body;

      // Grade lookup table
      const gradeScales = await CgpaRepository.getGradeScales(curriculumVersion || '2025');
      const gradePointMap = new Map<string, number>();
      gradeScales.forEach((g) => {
        gradePointMap.set(g.letterGrade.toUpperCase(), g.gradePoint);
      });

      let totalEligibleCredits = 0;
      let totalWeightedPoints = 0;

      const processedGrades = subjectGrades.map((g: any) => {
        const letter = (g.letterGrade || '').toUpperCase();
        const pt = gradePointMap.has(letter) ? gradePointMap.get(letter)! : 0.0;
        const credits = Number(g.creditSnapshot) || 0;
        const weighted = g.includedInCalc !== false ? pt * credits : 0;

        if (g.includedInCalc !== false) {
          totalEligibleCredits += credits;
          totalWeightedPoints += weighted;
        }

        return {
          curriculumCourseId: g.curriculumCourseId || null,
          subjectNameSnapshot: g.subjectNameSnapshot,
          creditSnapshot: credits,
          letterGrade: letter,
          gradePointSnapshot: pt,
          includedInCalc: g.includedInCalc !== false,
          weightedPoints: weighted,
          selectedElective: g.selectedElective || null,
        };
      });

      const calculatedGPA = totalEligibleCredits > 0
        ? parseFloat((totalWeightedPoints / totalEligibleCredits).toFixed(2))
        : 0.0;

      const savedResult = await CgpaRepository.saveSemesterResult({
        studentId,
        semester,
        curriculumVersion: curriculumVersion || '2025',
        totalEligibleCredits,
        totalWeightedPoints,
        calculatedGPA,
        isPublishedToLeaderboard: !!isPublishedToLeaderboard,
        subjectGrades: processedGrades,
      });

      // Calculate cumulative CGPA across all recorded semesters
      const allResults = await CgpaRepository.getAllStudentResults(studentId);
      let cumulativeCredits = 0;
      let cumulativeWeighted = 0;
      allResults.forEach((r) => {
        cumulativeCredits += r.totalEligibleCredits;
        cumulativeWeighted += r.totalWeightedPoints;
      });

      const calculatedCGPA = cumulativeCredits > 0
        ? parseFloat((cumulativeWeighted / cumulativeCredits).toFixed(2))
        : 0.0;
      const percentage = calculatedCGPA > 0 ? parseFloat(((calculatedCGPA - 0.5) * 10).toFixed(2)) : 0.0;

      // Update leaderboard entry if requested
      if (isPublishedToLeaderboard) {
        await LeaderboardRepository.upsertLeaderboardEntry({
          userId: studentId,
          academicBatch: academicBatch || '2025-2029',
          semesterMilestone: semester,
          validatedCGPA: calculatedCGPA,
          semesterResultId: savedResult.id,
          consentGiven: true,
          isPublished: true,
        });
      }

      await AuditService.log({
        eventType: 'SEMESTER_RESULT_SAVED',
        actorId: studentId,
        outcome: 'SUCCESS',
        description: `Semester ${semester} GPA: ${calculatedGPA}, CGPA: ${calculatedCGPA}`,
      });

      res.status(200).json({
        success: true,
        data: {
          semesterResult: savedResult,
          gpa: calculatedGPA,
          cgpa: calculatedCGPA,
          percentage,
          totalCredits: cumulativeCredits,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const results = await CgpaRepository.getAllStudentResults(studentId);

      let cumulativeCredits = 0;
      let cumulativeWeighted = 0;
      results.forEach((r) => {
        cumulativeCredits += r.totalEligibleCredits;
        cumulativeWeighted += r.totalWeightedPoints;
      });

      const cgpa = cumulativeCredits > 0
        ? parseFloat((cumulativeWeighted / cumulativeCredits).toFixed(2))
        : 0.0;
      const percentage = cgpa > 0 ? parseFloat(((cgpa - 0.5) * 10).toFixed(2)) : 0.0;

      res.status(200).json({
        success: true,
        data: {
          results,
          cumulativeCredits,
          cgpa,
          percentage,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getResultBySemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const semester = parseInt(req.params.semester, 10);
      const result = await CgpaRepository.getStudentResultBySemester(studentId, semester);

      if (!result) {
        res.status(404).json({ success: false, message: 'No result found for this semester' });
        return;
      }

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteResultBySemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const semester = parseInt(req.params.semester, 10);
      await CgpaRepository.deleteStudentResultBySemester(studentId, semester);
      res.status(200).json({ success: true, message: `Semester ${semester} result removed` });
    } catch (err) {
      next(err);
    }
  }
}

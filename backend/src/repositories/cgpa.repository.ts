import prisma from '../config/database';

export class CgpaRepository {
  public static async getCurriculumCourses(semester: number, regulation = '2025', programme = 'B.E. CSE') {
    return prisma.curriculumCourse.findMany({
      where: {
        semester,
        regulation,
        programme,
        isActive: true,
      },
      orderBy: { courseCode: 'asc' },
    });
  }

  public static async getGradeScales(regulation = '2025', programme = 'B.E. CSE') {
    return prisma.gradeScale.findMany({
      where: {
        regulation,
        programme,
        isActive: true,
      },
      orderBy: { gradePoint: 'desc' },
    });
  }

  public static async saveSemesterResult(data: {
    studentId: string;
    semester: number;
    curriculumVersion: string;
    totalEligibleCredits: number;
    totalWeightedPoints: number;
    calculatedGPA: number;
    isPublishedToLeaderboard: boolean;
    subjectGrades: {
      curriculumCourseId?: string | null;
      subjectNameSnapshot: string;
      creditSnapshot: number;
      letterGrade: string;
      gradePointSnapshot: number;
      includedInCalc: boolean;
      weightedPoints: number;
      selectedElective?: string | null;
    }[];
  }) {
    // Delete existing semester result if any to replace
    await prisma.studentSemesterResult.deleteMany({
      where: {
        studentId: data.studentId,
        semester: data.semester,
      },
    });

    return prisma.studentSemesterResult.create({
      data: {
        studentId: data.studentId,
        semester: data.semester,
        curriculumVersion: data.curriculumVersion,
        totalEligibleCredits: data.totalEligibleCredits,
        totalWeightedPoints: data.totalWeightedPoints,
        calculatedGPA: data.calculatedGPA,
        isPublishedToLeaderboard: data.isPublishedToLeaderboard,
        subjectGrades: {
          create: data.subjectGrades.map((g) => ({
            curriculumCourseId: g.curriculumCourseId || null,
            subjectNameSnapshot: g.subjectNameSnapshot,
            creditSnapshot: g.creditSnapshot,
            letterGrade: g.letterGrade,
            gradePointSnapshot: g.gradePointSnapshot,
            includedInCalc: g.includedInCalc,
            weightedPoints: g.weightedPoints,
            selectedElective: g.selectedElective || null,
          })),
        },
      },
      include: {
        subjectGrades: true,
      },
    });
  }

  public static async getAllStudentResults(studentId: string) {
    return prisma.studentSemesterResult.findMany({
      where: { studentId },
      orderBy: { semester: 'asc' },
      include: {
        subjectGrades: true,
      },
    });
  }

  public static async getStudentResultBySemester(studentId: string, semester: number) {
    return prisma.studentSemesterResult.findUnique({
      where: {
        studentId_semester: { studentId, semester },
      },
      include: {
        subjectGrades: true,
      },
    });
  }

  public static async deleteStudentResultBySemester(studentId: string, semester: number) {
    return prisma.studentSemesterResult.delete({
      where: {
        studentId_semester: { studentId, semester },
      },
    });
  }
}

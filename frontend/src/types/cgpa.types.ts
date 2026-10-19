export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'U' | 'RA';

export interface SubjectCourse {
  code: string;
  name: string;
  credits: number;
  grade?: GradeLetter;
  gradePoint?: number;
  weightedPoints?: number;
  isElective?: boolean;
}

export interface SemesterCalculation {
  semesterNumber: number; // 1 to 8
  courses: SubjectCourse[];
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
  savedAt?: string;
}

export interface SavedCGPAResult {
  id: string;
  semesterNumber: number;
  gpa: number;
  totalCredits: number;
  courses: SubjectCourse[];
  createdAt: string;
}

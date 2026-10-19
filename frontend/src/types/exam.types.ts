export interface ExamItem {
  id: string;
  courseCode: string;
  subjectName: string;
  date: string;
  session: 'FN' | 'AN';
  time: string;
  daysRemaining?: number;
  gapDays?: number;
}

export interface ExamAnalysis {
  totalExams: number;
  startDate: string;
  endDate: string;
  totalDurationDays: number;
  averageGapDays: number;
  examSchedule: ExamItem[];
  studyPlan: string[];
  // AI provider info — tells user which AI processed the image
  aiProvider?: 'GEMINI' | 'OPENAI' | 'GROQ' | 'MOCK' | string;
  aiConfidence?: number; // 0–1
}

export interface ExamExtractResult {
  exams: ExamItem[];
  aiProvider: 'GEMINI' | 'OPENAI' | 'GROQ' | 'MOCK' | string;
  aiConfidence?: number;
  warnings?: string;
}

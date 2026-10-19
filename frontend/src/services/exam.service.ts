import api from './api';
import { ExamItem, ExamAnalysis, ExamExtractResult } from '../types/exam.types';

export const examService = {
  // Returns null if no real saved analysis exists — no dummy data
  async getSavedExamAnalysis(): Promise<ExamAnalysis | null> {
    try {
      const res = await api.get<{ analysis: ExamAnalysis }>('/exam/analysis');
      return res.data.analysis ?? null;
    } catch {
      // Only return locally cached data if the user actually saved it this session
      const stored = localStorage.getItem('campus_exam_analysis');
      if (stored) {
        try { return JSON.parse(stored) as ExamAnalysis; } catch { /* ignore */ }
      }
      return null;  // ← no dummy data
    }
  },

  // Extract timetable from uploaded image — returns AI provider info
  // semester: 1–8 tells the backend AI which semester subjects to focus on
  async extractTimetableFromImage(file: File, semester?: number): Promise<ExamExtractResult> {
    try {
      const formData = new FormData();
      formData.append('timetable', file);
      if (semester && semester >= 1 && semester <= 8) {
        formData.append('semester', String(semester));
      }
      const res = await api.post<{
        exams: ExamItem[];
        aiProvider?: string;
        aiConfidence?: number;
        warnings?: string;
      }>('/exam/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return {
        exams: res.data.exams || [],
        aiProvider: res.data.aiProvider || 'BACKEND',
        aiConfidence: res.data.aiConfidence,
        warnings: res.data.warnings,
      };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unknown error';
      throw new Error(`AI_FAILED:${message}`);
    }
  },

  async saveExamSchedule(exams: ExamItem[], aiProvider?: string, semester?: number): Promise<ExamAnalysis> {
    const sorted = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute gap days between consecutive exams
    const scheduleWithGaps: ExamItem[] = sorted.map((exam, idx) => {
      if (idx === 0) return { ...exam, gapDays: 0 };
      const prev = new Date(sorted[idx - 1].date);
      const curr = new Date(exam.date);
      const gap = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      return { ...exam, gapDays: Math.max(0, gap - 1) };
    });

    // Countdown days from today
    const today = new Date();
    const withCountdown = scheduleWithGaps.map((exam) => {
      const examDate = new Date(exam.date);
      const daysRemaining = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...exam, daysRemaining: Math.max(0, daysRemaining) };
    });

    const startDate = withCountdown[0]?.date || today.toISOString();
    const endDate = withCountdown[withCountdown.length - 1]?.date || today.toISOString();
    const totalDays = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const gapDays = withCountdown.slice(1).map((e) => e.gapDays ?? 0);
    const avgGap = gapDays.length > 0 ? parseFloat((gapDays.reduce((a, b) => a + b, 0) / gapDays.length).toFixed(1)) : 0;

    // Build a personalised study plan using the actual subject list + semester
    const subjectList = withCountdown.map((e) => e.subjectName).filter(Boolean);
    const semLabel = semester && semester >= 1 && semester <= 8
      ? ` (Sem ${['I','II','III','IV','V','VI','VII','VIII'][semester - 1]})`
      : '';
    const firstSubject = subjectList[0] || 'your first subject';
    const lastSubject = subjectList[subjectList.length - 1] || 'your last paper';

    const studyPlan = [
      `Phase 1 — Start now: Cover Unit 1 & 2 of all ${subjectList.length} Semester${semLabel} subjects. Build a master formula sheet for each.`,
      `Phase 2 — Paper practice: Solve 5 previous end-semester question papers for each subject, starting with ${firstSubject}.`,
      `Phase 3 — Group sessions: Form study groups for derivation-heavy and mathematics-based topics across all enrolled papers.`,
      `Phase 4 — Index cards: Create one-page cheat sheets for each subject with definitions, key formulas, and important syntax.`,
      `Gap Day rule: Use every ${avgGap > 0 ? Math.round(avgGap) : 'prep'}-day gap before each exam for full-unit revision and timed mock tests.`,
      `Final sprint: On the eve of ${lastSubject}, review the lab viva, practical theory, and ensure 7+ hours sleep before the 10 AM session.`,
    ];

    const analysis: ExamAnalysis = {
      totalExams: withCountdown.length,
      startDate,
      endDate,
      totalDurationDays: totalDays,
      averageGapDays: avgGap,
      examSchedule: withCountdown,
      aiProvider: aiProvider || 'UNKNOWN',
      studyPlan,
    };

    try {
      await api.post('/exam/schedule', { analysis, semester });
    } catch {
      // Cache locally if backend unreachable
      localStorage.setItem('campus_exam_analysis', JSON.stringify(analysis));
    }
    return analysis;
  },

  clearSavedAnalysis() {
    localStorage.removeItem('campus_exam_analysis');
  },
};

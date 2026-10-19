import api from './api';
import { GradeLetter, SavedCGPAResult, SubjectCourse } from '../types/cgpa.types';

export const GRADE_POINTS_MAP: Record<GradeLetter, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  U: 0,
  RA: 0,
};

export const SEMESTER_PRESETS: Record<number, SubjectCourse[]> = {
  1: [
    { code: 'MA3151', name: 'Matrices and Calculus', credits: 4 },
    { code: 'PH3151', name: 'Engineering Physics', credits: 3 },
    { code: 'CY3151', name: 'Engineering Chemistry', credits: 3 },
    { code: 'GE3151', name: 'Problem Solving and Python Programming', credits: 3 },
    { code: 'GE3152', name: 'Heritage of Tamils / Professional English', credits: 2 },
    { code: 'GE3171', name: 'Problem Solving and Python Lab', credits: 2 },
    { code: 'BS3171', name: 'Physics and Chemistry Laboratory', credits: 2 },
  ],
  2: [
    { code: 'HS3251', name: 'Professional English - II', credits: 2 },
    { code: 'MA3251', name: 'Statistics and Numerical Methods', credits: 4 },
    { code: 'PH3256', name: 'Physics for Information Science', credits: 3 },
    { code: 'BE3251', name: 'Basic Electrical and Electronics Engineering', credits: 3 },
    { code: 'GE3251', name: 'Engineering Graphics', credits: 4 },
    { code: 'CS3251', name: 'Programming in C', credits: 3 },
    { code: 'GE3271', name: 'Engineering Practices Laboratory', credits: 2 },
  ],
  3: [
    { code: 'MA3354', name: 'Discrete Mathematics', credits: 4 },
    { code: 'CS3351', name: 'Digital Principles and Computer Organization', credits: 4 },
    { code: 'CS3352', name: 'Foundations of Data Science', credits: 3 },
    { code: 'CS3301', name: 'Data Structures', credits: 3 },
    { code: 'CS3391', name: 'Object Oriented Programming with Java', credits: 3 },
    { code: 'CS3361', name: 'Data Structures Laboratory', credits: 1.5 },
    { code: 'CS3381', name: 'Object Oriented Programming Laboratory', credits: 1.5 },
  ],
  4: [
    { code: 'CS3452', name: 'Theory of Computation', credits: 3 },
    { code: 'CS3491', name: 'Artificial Intelligence and Machine Learning', credits: 4 },
    { code: 'CS3492', name: 'Database Management Systems', credits: 3 },
    { code: 'CS3401', name: 'Algorithms', credits: 4 },
    { code: 'CS3461', name: 'Operating Systems', credits: 3 },
    { code: 'CS3481', name: 'Database Management Systems Lab', credits: 1.5 },
  ],
  5: [
    { code: 'CS3591', name: 'Computer Networks', credits: 4 },
    { code: 'CS3501', name: 'Compiler Design', credits: 4 },
    { code: 'CB3491', name: 'Cryptography and Cyber Security', credits: 3 },
    { code: 'CS3551', name: 'Professional Elective I (Cloud Computing)', credits: 3, isElective: true },
    { code: 'CS3552', name: 'Professional Elective II (Full Stack Web Dev)', credits: 3, isElective: true },
    { code: 'CS3511', name: 'Networks and Security Laboratory', credits: 1.5 },
  ],
  6: [
    { code: 'CCS335', name: 'Cloud Computing and Virtualization', credits: 3 },
    { code: 'CS3691', name: 'Embedded Systems and IoT', credits: 4 },
    { code: 'CS3601', name: 'Professional Elective III (Deep Learning)', credits: 3, isElective: true },
    { code: 'CS3602', name: 'Open Elective I (Management & Entrepreneurship)', credits: 3, isElective: true },
    { code: 'CS3611', name: 'Mobile App Development Laboratory', credits: 1.5 },
  ],
  7: [
    { code: 'GE3791', name: 'Human Values and Ethics', credits: 2 },
    { code: 'CS3701', name: 'Professional Elective IV (Quantum Computing)', credits: 3, isElective: true },
    { code: 'CS3702', name: 'Professional Elective V (Big Data Analytics)', credits: 3, isElective: true },
    { code: 'CS3703', name: 'Open Elective II (Cyber Law & IPR)', credits: 3, isElective: true },
    { code: 'CS3711', name: 'Summer Internship & Mini Project', credits: 2 },
  ],
  8: [
    { code: 'CS3811', name: 'Project Work / Capstone Phase II', credits: 10 },
  ],
};

export const cgpaService = {
  getSemesterPreset(sem: number): SubjectCourse[] {
    const list = SEMESTER_PRESETS[sem] || SEMESTER_PRESETS[1];
    return list.map((c) => ({
      ...c,
      grade: 'A',
      gradePoint: 8,
      weightedPoints: c.credits * 8,
    }));
  },

  calculateGPA(courses: SubjectCourse[]): { gpa: number; totalCredits: number; earnedPoints: number } {
    let totalCredits = 0;
    let earnedPoints = 0;
    courses.forEach((c) => {
      if (c.grade && c.grade !== 'RA' && c.grade !== 'U') {
        const gp = GRADE_POINTS_MAP[c.grade] ?? 0;
        totalCredits += c.credits;
        earnedPoints += c.credits * gp;
      } else if (c.grade === 'RA' || c.grade === 'U') {
        totalCredits += c.credits;
      }
    });

    const gpa = totalCredits > 0 ? parseFloat((earnedPoints / totalCredits).toFixed(2)) : 0;
    return { gpa, totalCredits, earnedPoints };
  },

  calculateClassification(cgpa: number): string {
    if (cgpa >= 8.5) return 'First Class with Distinction';
    if (cgpa >= 7.0) return 'First Class';
    if (cgpa >= 5.5) return 'Second Class';
    return 'Pass Division';
  },

  cgpaToPercentage(cgpa: number): number {
    // Anna University standard formula: CGPA * 10 or (CGPA - 0.75) * 10
    return parseFloat((cgpa * 10).toFixed(2));
  },

  async getSavedResults(): Promise<SavedCGPAResult[]> {
    try {
      const res = await api.get<{ results: SavedCGPAResult[] }>('/cgpa/saved');
      return res.data.results;
    } catch {
      const stored = localStorage.getItem('mock_cgpa_results');
      return stored
        ? JSON.parse(stored)
        : [
            { id: 'sem-1', semesterNumber: 1, gpa: 8.84, totalCredits: 22, courses: SEMESTER_PRESETS[1], createdAt: new Date().toISOString() },
            { id: 'sem-2', semesterNumber: 2, gpa: 8.65, totalCredits: 23, courses: SEMESTER_PRESETS[2], createdAt: new Date().toISOString() },
            { id: 'sem-3', semesterNumber: 3, gpa: 8.92, totalCredits: 22, courses: SEMESTER_PRESETS[3], createdAt: new Date().toISOString() },
          ];
    }
  },

  async saveResult(semesterNumber: number, courses: SubjectCourse[], gpa: number, totalCredits: number): Promise<SavedCGPAResult> {
    try {
      const res = await api.post<{ result: SavedCGPAResult }>('/cgpa/saved', { semesterNumber, courses, gpa, totalCredits });
      return res.data.result;
    } catch {
      const list = await this.getSavedResults();
      const existingIdx = list.findIndex((r) => r.semesterNumber === semesterNumber);
      const newResult: SavedCGPAResult = {
        id: 'sem-' + semesterNumber,
        semesterNumber,
        gpa,
        totalCredits,
        courses,
        createdAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        list[existingIdx] = newResult;
      } else {
        list.push(newResult);
        list.sort((a, b) => a.semesterNumber - b.semesterNumber);
      }
      localStorage.setItem('mock_cgpa_results', JSON.stringify(list));
      return newResult;
    }
  },

  async deleteSavedResult(id: string): Promise<void> {
    try {
      await api.delete(`/cgpa/saved/${id}`);
    } catch {
      let list = await this.getSavedResults();
      list = list.filter((r) => r.id !== id);
      localStorage.setItem('mock_cgpa_results', JSON.stringify(list));
    }
  },
};

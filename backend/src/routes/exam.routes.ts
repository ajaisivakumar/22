import { Router } from 'express';
import multer from 'multer';

export const examRouter = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const sampleSchedule = [
  { id: 'ex-1', courseCode: 'CS3591', subjectName: 'Computer Networks', date: '2026-11-20', session: 'FN', time: '10:00 AM - 01:00 PM', daysRemaining: 38, gapDays: 0 },
  { id: 'ex-2', courseCode: 'CS3501', subjectName: 'Compiler Design', date: '2026-11-24', session: 'FN', time: '10:00 AM - 01:00 PM', daysRemaining: 42, gapDays: 3 },
  { id: 'ex-3', courseCode: 'CB3491', subjectName: 'Cryptography and Cyber Security', date: '2026-11-28', session: 'FN', time: '10:00 AM - 01:00 PM', daysRemaining: 46, gapDays: 3 },
  { id: 'ex-4', courseCode: 'CS3551', subjectName: 'Cloud Computing Architecture', date: '2026-12-02', session: 'FN', time: '10:00 AM - 01:00 PM', daysRemaining: 50, gapDays: 3 },
  { id: 'ex-5', courseCode: 'CS3552', subjectName: 'Full Stack Web Development', date: '2026-12-06', session: 'FN', time: '10:00 AM - 01:00 PM', daysRemaining: 54, gapDays: 3 },
];

let savedAnalysis = {
  totalExams: 5,
  startDate: '2026-11-20',
  endDate: '2026-12-06',
  totalDurationDays: 17,
  averageGapDays: 3.2,
  examSchedule: sampleSchedule,
  studyPlan: [
    'Week 1: Finish Unit 1 & 2 formula sheets and circuit proofs for Computer Networks.',
    'Week 2: Complete LR parsers, syntax-directed translation, and DAG code generation problems.',
    'Week 3: Deep dive into AES, RSA cryptography algorithms and PKI security concepts.',
    'Week 4: Review AWS EC2/S3 virtual structures and Kubernetes microservices architecture.',
    'Gap Days Strategy: 70% revision of past Anna University question papers + 30% self-mock test.',
    'Eve of Exam: Relax, review one-page cheat sheet, ensure 7+ hours sleep before 10 AM session.',
  ],
};

examRouter.get('/analysis', (req, res) => {
  res.json({ analysis: savedAnalysis });
});

examRouter.post('/extract', upload.single('timetable'), (req, res) => {
  res.json({ exams: sampleSchedule });
});

examRouter.post('/schedule', (req, res) => {
  if (req.body.analysis) {
    savedAnalysis = req.body.analysis;
  }
  res.json({ analysis: savedAnalysis });
});

export default examRouter;

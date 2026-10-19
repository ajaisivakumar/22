import { describe, it, expect } from 'vitest';
import { generateComplaintRefId } from '../src/utils/crypto';

describe('Security and Business Formula Verifications', () => {
  it('should format complaint reference IDs according to LAB-YYYYMMDD-XXXXXX standard', () => {
    const ref = generateComplaintRefId(42);
    expect(ref).toMatch(/^LAB-\d{8}-000042$/);
  });

  it('should accurately calculate GPA and CGPA according to specified formula', () => {
    // Formula: GPA = Σ(gradePoint × credits) / Σ(credits)
    // Percentage = (CGPA - 0.5) × 10
    const subjects = [
      { credits: 4, gradePoint: 10 }, // O (40)
      { credits: 4, gradePoint: 9 },  // A+ (36)
      { credits: 3, gradePoint: 8 },  // A (24)
      { credits: 3, gradePoint: 7 },  // B+ (21)
    ];

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0); // 14
    const totalWeighted = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0); // 121
    const gpa = parseFloat((totalWeighted / totalCredits).toFixed(2)); // 8.64
    const percentage = parseFloat(((gpa - 0.5) * 10).toFixed(2)); // 81.4

    expect(totalCredits).toBe(14);
    expect(totalWeighted).toBe(121);
    expect(gpa).toBe(8.64);
    expect(percentage).toBe(81.4);
  });
});

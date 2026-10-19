import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  Save,
  Trash2,
  Award,
  Percent,
  CheckCircle2,
  BookOpen,
  Download,
} from 'lucide-react';
import { SubjectCourse, GradeLetter, SavedCGPAResult } from '../../types/cgpa.types';
import {
  cgpaService,
  GRADE_POINTS_MAP,
  SEMESTER_PRESETS,
} from '../../services/cgpa.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// PDF Download — uses browser's native print-to-PDF
// A hidden div is rendered off-screen and printed via a new window.
// No external libraries needed.
// ─────────────────────────────────────────────────────────────────────────────
function downloadSemesterPDF(
  semester: number,
  courses: SubjectCourse[],
  gpa: number,
  totalCredits: number,
  earnedPoints: number,
  classification: string
) {
  const semLabel = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][semester - 1];
  const rows = courses
    .map(
      (c) => `
      <tr>
        <td>${c.code || '—'}</td>
        <td>${c.name}</td>
        <td style="text-align:center">${c.credits}</td>
        <td style="text-align:center">${c.grade || 'A'}</td>
        <td style="text-align:center">${GRADE_POINTS_MAP[c.grade || 'A']}</td>
        <td style="text-align:right">${(c.weightedPoints ?? c.credits * 8).toFixed(1)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Semester ${semLabel} GPA Report — Campus Connect</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 32px; }
    .header { border-bottom: 2px solid #E42527; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; font-weight: 700; color: #E42527; }
    .header p  { font-size: 11px; color: #555; margin-top: 2px; }
    .meta { display: flex; gap: 32px; margin-bottom: 20px; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 16px; }
    .meta-box .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
    .meta-box .value { font-size: 22px; font-weight: 800; color: #E42527; margin-top: 2px; }
    .meta-box .sub   { font-size: 10px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 10px;
         text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #d1d5db; }
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .summary { margin-top: 16px; background: #f9fafb; border: 1px solid #e5e7eb;
               border-radius: 6px; padding: 12px 16px; display: flex; gap: 32px; }
    .summary-item .label { font-size: 10px; color: #6b7280; }
    .summary-item .value { font-size: 13px; font-weight: 700; color: #111; }
    .footer { margin-top: 28px; font-size: 9px; color: #9ca3af; text-align: center;
              border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Campus Connect — Anna University GPA Report</h1>
    <p>Regulation 2025 · B.E. Computer Science and Engineering · Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="label">Semester</div>
      <div class="value" style="font-size:16px">Semester ${semester} (Sem ${semLabel})</div>
    </div>
    <div class="meta-box">
      <div class="label">Semester GPA</div>
      <div class="value">${gpa.toFixed(2)}</div>
      <div class="sub">out of 10.00</div>
    </div>
    <div class="meta-box">
      <div class="label">Classification</div>
      <div class="value" style="font-size:14px; color:#111">${classification}</div>
    </div>
    <div class="meta-box">
      <div class="label">Equivalent %</div>
      <div class="value" style="color:#089949">${cgpaService.cgpaToPercentage(gpa).toFixed(1)}%</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th><th>Subject Name</th>
        <th style="text-align:center">Credits</th>
        <th style="text-align:center">Grade</th>
        <th style="text-align:center">Points</th>
        <th style="text-align:right">Weighted</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="summary">
    <div class="summary-item"><div class="label">Total Courses</div><div class="value">${courses.length}</div></div>
    <div class="summary-item"><div class="label">Registered Credits</div><div class="value">${totalCredits}</div></div>
    <div class="summary-item"><div class="label">Earned Credit Points</div><div class="value">${earnedPoints.toFixed(1)}</div></div>
    <div class="summary-item"><div class="label">Formula</div><div class="value" style="font-family:monospace">Σ(C × GP) / Σ(C)</div></div>
  </div>

  <div class="footer">
    This report is generated from Campus Connect and is for personal reference only.
    Verify your official results at coe1.annauniv.edu
  </div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { toast.error('Pop-up blocked — allow pop-ups and try again'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

function downloadCumulativePDF(
  savedResults: SavedCGPAResult[],
  cumulativeCGPA: number,
  cumulativeCredits: number,
  cumulativePercentage: number,
  cumulativeClassification: string
) {
  const rows = savedResults
    .map(
      (r) => `
      <tr>
        <td style="text-align:center">Semester ${r.semesterNumber}</td>
        <td style="text-align:center">${r.totalCredits}</td>
        <td style="text-align:center">${(r.gpa * r.totalCredits).toFixed(1)}</td>
        <td style="text-align:center;font-weight:700;color:#E42527">${r.gpa.toFixed(2)}</td>
        <td style="text-align:center">${cgpaService.cgpaToPercentage(r.gpa).toFixed(1)}%</td>
        <td style="text-align:center">${cgpaService.calculateClassification(r.gpa)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Cumulative CGPA Report — Campus Connect</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 32px; }
    .header { border-bottom: 2px solid #226DB4; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; font-weight: 700; color: #226DB4; }
    .header p  { font-size: 11px; color: #555; margin-top: 2px; }
    .meta { display: flex; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 16px; }
    .meta-box .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
    .meta-box .value { font-size: 22px; font-weight: 800; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 10px;
         text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #d1d5db; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 28px; font-size: 9px; color: #9ca3af; text-align: center;
              border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Campus Connect — Cumulative CGPA Report</h1>
    <p>Regulation 2025 · B.E. Computer Science and Engineering · Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="label">Cumulative CGPA</div>
      <div class="value" style="color:#226DB4">${cumulativeCGPA.toFixed(2)}</div>
    </div>
    <div class="meta-box">
      <div class="label">Equivalent %</div>
      <div class="value" style="color:#089949">${cumulativePercentage.toFixed(1)}%</div>
    </div>
    <div class="meta-box">
      <div class="label">Division</div>
      <div class="value" style="font-size:14px;color:#111">${cumulativeClassification}</div>
    </div>
    <div class="meta-box">
      <div class="label">Semesters Completed</div>
      <div class="value" style="color:#111">${savedResults.length}</div>
    </div>
    <div class="meta-box">
      <div class="label">Total Credits</div>
      <div class="value" style="color:#111">${cumulativeCredits}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center">Semester</th>
        <th style="text-align:center">Credits</th>
        <th style="text-align:center">Weighted Points</th>
        <th style="text-align:center">GPA</th>
        <th style="text-align:center">Percentage</th>
        <th style="text-align:center">Classification</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    This report is generated from Campus Connect and is for personal reference only.
    Verify your official results at coe1.annauniv.edu
  </div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { toast.error('Pop-up blocked — allow pop-ups and try again'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const CGPACalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SEMESTER' | 'CUMULATIVE' | 'PERCENTAGE'>('SEMESTER');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [courses, setCourses] = useState<SubjectCourse[]>([]);
  const [savedResults, setSavedResults] = useState<SavedCGPAResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Standalone converter input
  const [manualCgpaInput, setManualCgpaInput] = useState<string>('8.50');

  useEffect(() => {
    const initialCourses = cgpaService.getSemesterPreset(selectedSemester);
    setCourses(initialCourses);
    cgpaService.getSavedResults().then((res) => setSavedResults(res));
  }, [selectedSemester]);

  const handleSemesterChange = (sem: number) => {
    setSelectedSemester(sem);
    setCourses(cgpaService.getSemesterPreset(sem));
  };

  const handleGradeChange = (index: number, newGrade: GradeLetter) => {
    setCourses((prev) => {
      const updated = [...prev];
      const gp = GRADE_POINTS_MAP[newGrade];
      updated[index] = { ...updated[index], grade: newGrade, gradePoint: gp, weightedPoints: updated[index].credits * gp };
      return updated;
    });
  };

  const handleElectiveNameChange = (index: number, newName: string) => {
    setCourses((prev) => { const updated = [...prev]; updated[index] = { ...updated[index], name: newName }; return updated; });
  };

  const { gpa, totalCredits, earnedPoints } = cgpaService.calculateGPA(courses);
  const classification = cgpaService.calculateClassification(gpa);

  const handleSaveResult = async () => {
    try {
      setIsSaving(true);
      const saved = await cgpaService.saveResult(selectedSemester, courses, gpa, totalCredits);
      setSavedResults((prev) => {
        const filtered = prev.filter((r) => r.semesterNumber !== selectedSemester);
        return [...filtered, saved].sort((a, b) => a.semesterNumber - b.semesterNumber);
      });
      toast.success(`Semester ${selectedSemester} GPA (${gpa}) saved!`);
    } catch { toast.error('Could not save semester result'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteSaved = async (id: string) => {
    await cgpaService.deleteSavedResult(id);
    setSavedResults((prev) => prev.filter((r) => r.id !== id));
    toast.success('Removed saved semester record');
  };

  const cumulativeCredits = savedResults.reduce((acc, curr) => acc + curr.totalCredits, 0);
  const cumulativeWeightedPoints = savedResults.reduce((acc, curr) => acc + curr.gpa * curr.totalCredits, 0);
  const cumulativeCGPA = cumulativeCredits > 0 ? parseFloat((cumulativeWeightedPoints / cumulativeCredits).toFixed(2)) : 0;
  const cumulativeClassification = cgpaService.calculateClassification(cumulativeCGPA);
  const cumulativePercentage = cgpaService.cgpaToPercentage(cumulativeCGPA);

  const parsedManual = parseFloat(manualCgpaInput) || 0;
  const convertedManualPercent = cgpaService.cgpaToPercentage(parsedManual);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          Anna University CGPA Calculator
        </h1>
        <p className="text-sm text-gray-500">
          Accurate credit-weighted semester GPA, overall cumulative CGPA, and official percentage conversions (Regulation 2021/2023).
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200">
        {(['SEMESTER', 'CUMULATIVE', 'PERCENTAGE'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'SEMESTER' && 'Semester GPA Calculator'}
            {tab === 'CUMULATIVE' && `Cumulative CGPA (${savedResults.length} Semesters)`}
            {tab === 'PERCENTAGE' && 'CGPA to Percentage Converter'}
          </button>
        ))}
      </div>

      {/* ── TAB 1: SEMESTER GPA ─────────────────────────────────────────────── */}
      {activeTab === 'SEMESTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex-wrap gap-4">
                <div>
                  <CardTitle>Course Grade Entry</CardTitle>
                  <CardDescription>Select your semester to populate standard Anna University syllabus</CardDescription>
                </div>
                <div className="w-44">
                  <Select value={selectedSemester} onChange={(e) => handleSemesterChange(Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem} (Sem {['I','II','III','IV','V','VI','VII','VIII'][sem-1]})
                      </option>
                    ))}
                  </Select>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-3 sm:px-4">Code</th>
                      <th className="py-3 px-3 sm:px-4">Subject Name</th>
                      <th className="py-3 px-3 text-center">Credits</th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-center">Points</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Weighted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courses.map((course, idx) => (
                      <tr key={course.code + idx} className="hover:bg-gray-50/75 transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-mono font-medium text-gray-700 text-xs">{course.code}</td>
                        <td className="py-3 px-3 sm:px-4 font-medium text-gray-900 max-w-[200px]">
                          {course.isElective ? (
                            <input
                              type="text"
                              value={course.name}
                              onChange={(e) => handleElectiveNameChange(idx, e.target.value)}
                              className="w-full text-xs rounded border border-gray-200 px-2 py-1 bg-white focus:border-primary focus:outline-none"
                            />
                          ) : <span>{course.name}</span>}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-600 font-semibold">{course.credits}</td>
                        <td className="py-3 px-3 text-center">
                          <select
                            value={course.grade || 'A'}
                            onChange={(e) => handleGradeChange(idx, e.target.value as GradeLetter)}
                            aria-label={`Grade for ${course.name}`}
                            className="text-xs font-bold rounded-lg border border-gray-300 bg-white px-2 py-1 focus:border-primary focus:outline-none"
                          >
                            <option value="O">O (10)</option>
                            <option value="A+">A+ (9)</option>
                            <option value="A">A (8)</option>
                            <option value="B+">B+ (7)</option>
                            <option value="B">B (6)</option>
                            <option value="C">C (5)</option>
                            <option value="RA">RA / U (0)</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-600">{GRADE_POINTS_MAP[course.grade || 'A']}</td>
                        <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold text-gray-900">
                          {course.weightedPoints?.toFixed(1) || (course.credits * 8).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Total Courses: {courses.length} | Credits: {totalCredits}
                </span>
                <div className="flex gap-2">
                  {/* ── Download PDF Button ── */}
                  <Button
                    variant="secondary"
                    onClick={() => downloadSemesterPDF(selectedSemester, courses, gpa, totalCredits, earnedPoints, classification)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download PDF
                  </Button>
                  <Button
                    onClick={handleSaveResult}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Semester Result
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* GPA Result Card */}
          <div className="space-y-4">
            <Card className="border-red-100 shadow-sm">
              <CardHeader className="bg-red-50/50">
                <CardTitle className="text-primary flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Live Semester GPA
                </CardTitle>
              </CardHeader>
              <CardBody className="p-6 text-center space-y-3">
                <div className="inline-block p-4 rounded-2xl bg-red-50 border border-red-200">
                  <span className="text-4xl font-extrabold text-primary tracking-tight">{gpa.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 block mt-0.5">out of 10.00</span>
                </div>
                <div className="pt-2 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Provisional Classification</p>
                  <p className="text-sm font-bold text-gray-900">{classification}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-left text-gray-600 border border-gray-100">
                  <div className="flex justify-between"><span>Earned Credit Points:</span><span className="font-semibold text-gray-900">{earnedPoints.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Registered Credits:</span><span className="font-semibold text-gray-900">{totalCredits}</span></div>
                  <div className="flex justify-between"><span>Formula:</span><span className="font-mono text-gray-900">Σ(C × GP) / Σ(C)</span></div>
                </div>
              </CardBody>
            </Card>

            {/* Grade Scale */}
            <Card>
              <CardHeader><CardTitle className="text-xs">Anna University Grade Scale</CardTitle></CardHeader>
              <CardBody className="p-4 text-xs space-y-1 text-gray-600">
                {[['O (Outstanding)','10 Points (91 - 100)'],['A+ (Excellent)','9 Points (81 - 90)'],['A (Very Good)','8 Points (71 - 80)'],['B+ (Good)','7 Points (61 - 70)'],['B (Average)','6 Points (50 - 60)']].map(([g, r]) => (
                  <div key={g} className="flex justify-between py-0.5 border-b border-gray-50 last:border-0">
                    <span className="font-bold text-gray-800">{g}</span><span>{r}</span>
                  </div>
                ))}
                <div className="flex justify-between py-0.5">
                  <span className="font-bold text-red-600">RA (Re-Appear)</span><span>0 Points (&lt; 50)</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: CUMULATIVE CGPA ───────────────────────────────────────────── */}
      {activeTab === 'CUMULATIVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Saved Semester Records</CardTitle>
                  <CardDescription>All saved semester results used to compute cumulative CGPA</CardDescription>
                </div>
              </CardHeader>

              {savedResults.length === 0 ? (
                <CardBody className="text-center py-12">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold text-gray-700 mt-2">No semesters saved yet</p>
                  <p className="text-xs text-gray-500">Use the Semester GPA tab to calculate and save results for Sem 1 through 8.</p>
                </CardBody>
              ) : (
                <div className="divide-y divide-gray-100">
                  {savedResults.map((result) => (
                    <div key={result.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-800 text-sm">
                          S{result.semesterNumber}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Semester {result.semesterNumber}</p>
                          <p className="text-xs text-gray-500">Credits: {result.totalCredits} | Courses: {result.courses?.length || 6}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-primary">{result.gpa.toFixed(2)}</span>
                          <span className="text-xs text-gray-400 block">GPA</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteSaved(result.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50" title="Remove semester record">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Download CGPA PDF Button ── */}
              {savedResults.length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => downloadCumulativePDF(savedResults, cumulativeCGPA, cumulativeCredits, cumulativePercentage, cumulativeClassification)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download CGPA Report PDF
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Cumulative CGPA Card */}
          <div className="space-y-4">
            <Card className="border-brand-blue/30 shadow-sm">
              <CardHeader className="bg-blue-50/40">
                <CardTitle className="text-brand-blue flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Cumulative CGPA
                </CardTitle>
              </CardHeader>
              <CardBody className="p-6 text-center space-y-3">
                <div className="inline-block p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-4xl font-extrabold text-brand-blue tracking-tight">{cumulativeCGPA.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 block mt-0.5">Cumulative (10 Scale)</span>
                </div>
                <div className="pt-2 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Division</p>
                  <p className="text-sm font-bold text-gray-900">{cumulativeClassification}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-left text-gray-600 border border-gray-100">
                  <div className="flex justify-between"><span>Total Semesters:</span><span className="font-semibold text-gray-900">{savedResults.length}</span></div>
                  <div className="flex justify-between"><span>Total Cumulative Credits:</span><span className="font-semibold text-gray-900">{cumulativeCredits}</span></div>
                  <div className="flex justify-between"><span>Equivalent Percentage:</span><span className="font-semibold text-emerald-700">{cumulativePercentage}%</span></div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 3: CGPA TO PERCENTAGE ────────────────────────────────────────── */}
      {activeTab === 'PERCENTAGE' && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Official CGPA to Percentage Calculator
                </CardTitle>
                <CardDescription>Anna University Regulation Formula: Percentage = CGPA × 10</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="p-6 space-y-6">
              <Input
                label="Enter your CGPA (e.g., 8.75)"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={manualCgpaInput}
                onChange={(e) => setManualCgpaInput(e.target.value)}
              />
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Equivalent Percentage</span>
                <p className="text-4xl font-extrabold text-emerald-700">{convertedManualPercent.toFixed(1)}%</p>
                <p className="text-xs text-emerald-900">Classification: <span className="font-bold">{cgpaService.calculateClassification(parsedManual)}</span></p>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-800">Anna University Classification Criteria:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span><strong>First Class with Distinction:</strong> CGPA ≥ 8.50 without arrears</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" /><span><strong>First Class:</strong> CGPA ≥ 7.00 within regulation period</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /><span><strong>Second Class:</strong> CGPA ≥ 5.50</span></div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CGPACalculatorPage;

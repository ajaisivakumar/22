import React, { useState, useEffect } from 'react';
import {
  Timer,
  Upload,
  Calendar,
  Download,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Bot,
  AlertTriangle,
  XCircle,
  Cpu,
} from 'lucide-react';
import { ExamItem, ExamAnalysis } from '../../types/exam.types';
import { examService } from '../../services/exam.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

// ── AI Provider Badge ────────────────────────────────────────────────────────
const AI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GEMINI:  { bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200' },
  OPENAI:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200' },
  GROQ:    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  MOCK:    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300' },
  BACKEND: { bg: 'bg-gray-100',  text: 'text-gray-700',   border: 'border-gray-300' },
  UNKNOWN: { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200' },
};

function AIProviderBadge({ provider, confidence }: { provider: string; confidence?: number }) {
  const key = provider?.toUpperCase() in AI_COLORS ? provider.toUpperCase() : 'UNKNOWN';
  const c = AI_COLORS[key];
  const isMock = key === 'MOCK';

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      {isMock ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      <span>
        {isMock
          ? 'MOCK response — AI backend not configured'
          : `Processed by ${provider}`}
      </span>
      {confidence !== undefined && !isMock && (
        <span className="ml-1 opacity-70">· {Math.round(confidence * 100)}% confidence</span>
      )}
    </div>
  );
}

// ── Countdown days from today ─────────────────────────────────────────────────
function daysFromToday(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

// ─────────────────────────────────────────────────────────────────────────────
export const ExamCountdownPage: React.FC = () => {
  const [step, setStep] = useState<'UPLOAD' | 'EXTRACTING' | 'EDIT_REVIEW' | 'DASHBOARD'>('UPLOAD');
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [extractedExams, setExtractedExams] = useState<ExamItem[]>([]);
  const [extractAiProvider, setExtractAiProvider] = useState<string>('');
  const [extractConfidence, setExtractConfidence] = useState<number | undefined>(undefined);
  const [extractWarnings, setExtractWarnings] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(0); // 0 = not yet selected

  // On mount — check if user has real saved data; if yes go straight to DASHBOARD
  useEffect(() => {
    examService.getSavedExamAnalysis().then((saved) => {
      if (saved && saved.examSchedule.length > 0) {
        setAnalysis(saved);
        setStep('DASHBOARD');
      }
      // else: stay at UPLOAD — no dummy data shown
    });
  }, []);

  // ── File Upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedSemester < 1 || selectedSemester > 8) {
      toast.error('Please select your current semester (1–8) before uploading.');
      // Reset the file input
      e.target.value = '';
      return;
    }

    setStep('EXTRACTING');
    setExtractAiProvider('');
    setExtractWarnings('');

    try {
      const result = await examService.extractTimetableFromImage(file, selectedSemester);

      setExtractedExams(result.exams);
      setExtractAiProvider(result.aiProvider);
      setExtractConfidence(result.aiConfidence);
      setExtractWarnings(result.warnings || '');
      setStep('EDIT_REVIEW');

      // Tell user exactly which AI responded
      const isMock = result.aiProvider?.toUpperCase() === 'MOCK';
      if (isMock) {
        toast('⚠️ AI backend returned a MOCK response — configure GEMINI_API_KEY or OPENAI_API_KEY on Render', {
          icon: '🤖',
          duration: 6000,
          style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
        });
      } else {
        toast.success(`✅ Extracted by ${result.aiProvider}${result.aiConfidence ? ` · ${Math.round(result.aiConfidence * 100)}% confidence` : ''}`);
      }

      if (result.warnings) {
        toast(`⚠️ ${result.warnings}`, { icon: '⚠️', duration: 5000 });
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.startsWith('AI_FAILED:')) {
        const detail = msg.replace('AI_FAILED:', '');
        toast.error(`AI extraction failed: ${detail}`, { duration: 8000 });
      } else {
        toast.error('Could not process timetable image — check backend connection');
      }
      setStep('UPLOAD');
    }
  };

  // ── Edit Review ─────────────────────────────────────────────────────────────
  const handleUpdateExam = (index: number, field: keyof ExamItem, value: string) => {
    setExtractedExams((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleConfirmAndAnalyze = async () => {
    try {
      const result = await examService.saveExamSchedule(extractedExams, extractAiProvider, selectedSemester);
      setAnalysis(result);
      setStep('DASHBOARD');
      toast.success('Timetable analysis & study plan generated!');
    } catch {
      toast.error('Failed to analyze schedule');
    }
  };

  // ── Start Over ───────────────────────────────────────────────────────────────
  const handleStartOver = () => {
    examService.clearSavedAnalysis();
    setAnalysis(null);
    setExtractedExams([]);
    setExtractAiProvider('');
    setSelectedSemester(0);
    setStep('UPLOAD');
  };

  // ── PDF Export ───────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!analysis) return;
    const rows = analysis.examSchedule.map(e =>
      `<tr><td>${formatDate(e.date,'dd MMM yyyy (EEE)')}</td><td>${e.courseCode}</td><td>${e.subjectName}</td><td>${e.session} (${e.time})</td><td>${e.daysRemaining ?? daysFromToday(e.date)} days</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Exam Timetable</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:28px}
    h1{color:#E42527;font-size:18px;border-bottom:2px solid #E42527;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#f3f4f6;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;border-bottom:1px solid #d1d5db}
    td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:11px}
    .footer{margin-top:20px;font-size:9px;color:#9ca3af;text-align:center}</style>
    </head><body>
    <h1>End-Semester Exam Schedule — Campus Connect</h1>
    <p style="font-size:11px;color:#555">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} · AI: ${analysis.aiProvider || 'N/A'}</p>
    <table><thead><tr><th>Date</th><th>Code</th><th>Subject</th><th>Session</th><th>Countdown</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer">Verify official timetable at coe1.annauniv.edu</div>
    </body></html>`;
    const w = window.open('', '_blank', 'width=900,height=650');
    if (!w) { toast.error('Allow pop-ups to export PDF'); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Timer className="w-6 h-6 text-primary" />
            Exam Countdown &amp; AI Timetable Analysis
          </h1>
          <p className="text-sm text-gray-500">
            Upload your semester exam notification image to auto-extract schedules, study gaps, and revision plans.
          </p>
        </div>

        {step === 'DASHBOARD' && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleStartOver} leftIcon={<RotateCcw className="w-4 h-4" />}>
              Upload New Timetable
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownloadPDF} leftIcon={<Download className="w-4 h-4" />}>
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* ── STEP 1: UPLOAD ────────────────────────────────────────────────────── */}
      {step === 'UPLOAD' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Exam Timetable Setup</CardTitle>
              <CardDescription>
                Select your semester and upload your timetable — AI will extract all subjects, dates, and build your study plan
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="p-6 space-y-6">

            {/* ── STEP A: Semester Selector ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <p className="text-sm font-bold text-gray-800">Select Your Current Semester</p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1,2,3,4,5,6,7,8].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`h-12 rounded-xl border-2 font-bold text-sm transition-all ${
                      selectedSemester === sem
                        ? 'border-primary bg-primary text-white shadow-md scale-105'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-red-50/30'
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
              {selectedSemester > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Semester {selectedSemester}</strong> selected — AI will focus on Sem {selectedSemester} subjects only
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">then</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* ── STEP B: Upload Zone ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  selectedSemester > 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>2</span>
                <p className={`text-sm font-bold transition-colors ${selectedSemester > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                  Upload Your Exam Timetable Image
                </p>
              </div>

              <label className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                selectedSemester > 0
                  ? 'border-gray-300 cursor-pointer hover:border-primary hover:bg-red-50/20'
                  : 'border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-60'
              }`}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={selectedSemester < 1}
                  onChange={handleFileUpload}
                />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  selectedSemester > 0 ? 'bg-red-50 text-primary' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Upload className="w-7 h-7" />
                </div>
                <p className={`text-base font-semibold transition-colors ${selectedSemester > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                  {selectedSemester > 0
                    ? 'Click to upload or drag & drop timetable image'
                    : 'Select a semester above to enable upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF up to 10MB</p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Supports handwritten, photocopied, and photographed timetables</span>
                </div>
              </label>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Cpu className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-bold">How does AI extraction work?</p>
                <p>
                  The AI reads your timetable image and filters subjects that match <strong>Semester {selectedSemester > 0 ? selectedSemester : 'N'}</strong>.
                  It extracts course codes, exam dates, session (FN/AN), and builds a personalised 6-line study plan.
                  Uses <strong>Google Gemini</strong> or <strong>OpenAI GPT-4o</strong> depending on backend configuration.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}


      {/* ── STEP 2: EXTRACTING ────────────────────────────────────────────────── */}
      {step === 'EXTRACTING' && (
        <Card>
          <CardBody className="py-20 text-center space-y-4">
            <Spinner size="xl" className="mx-auto" />
            <h3 className="text-lg font-bold text-gray-900 mt-4">
              AI Vision OCR Extraction in Progress...
            </h3>
            {selectedSemester > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-semibold">
                <BookOpen className="w-4 h-4" />
                Filtering Semester {selectedSemester} subjects
              </div>
            )}
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Scanning session timings, course codes, exam dates, and semester subjects.
              This usually takes 5–15 seconds.
            </p>
          </CardBody>
        </Card>
      )}

      {/* ── STEP 3: REVIEW / EDIT ─────────────────────────────────────────────── */}
      {step === 'EDIT_REVIEW' && (
        <div className="space-y-4">
          {/* AI Provider Badge */}
          {extractAiProvider && (
            <div className="flex flex-wrap items-center gap-3">
              <AIProviderBadge provider={extractAiProvider} confidence={extractConfidence} />
              {extractWarnings && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" /> {extractWarnings}
                </span>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Verify Extracted Exam Schedule</CardTitle>
                <CardDescription>Review and correct the AI-extracted course codes and exam dates before generating your study plan</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {extractedExams.length === 0 ? (
                <div className="py-16 text-center">
                  <XCircle className="w-10 h-10 text-red-300 mx-auto" />
                  <p className="text-sm font-semibold text-gray-700 mt-3">No exams could be extracted</p>
                  <p className="text-xs text-gray-500 mt-1">The AI could not read your image. Try a clearer, higher-contrast photo.</p>
                  <Button variant="secondary" className="mt-4" onClick={() => setStep('UPLOAD')} leftIcon={<RotateCcw className="w-4 h-4" />}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Course Code</th>
                          <th className="py-3 px-4">Subject Name</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Session</th>
                          <th className="py-3 px-4">Timing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {extractedExams.map((exam, idx) => (
                          <tr key={exam.id || idx} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                            <td className="p-3">
                              <input type="text" value={exam.courseCode}
                                onChange={(e) => handleUpdateExam(idx, 'courseCode', e.target.value)}
                                className="w-24 text-xs font-mono font-bold rounded border border-gray-300 p-1.5 focus:border-primary focus:outline-none" />
                            </td>
                            <td className="p-3">
                              <input type="text" value={exam.subjectName}
                                onChange={(e) => handleUpdateExam(idx, 'subjectName', e.target.value)}
                                className="w-full text-xs font-medium rounded border border-gray-300 p-1.5 focus:border-primary focus:outline-none" />
                            </td>
                            <td className="p-3">
                              <input type="date" value={exam.date}
                                onChange={(e) => handleUpdateExam(idx, 'date', e.target.value)}
                                className="text-xs rounded border border-gray-300 p-1.5 focus:border-primary focus:outline-none" />
                            </td>
                            <td className="p-3">
                              <select value={exam.session}
                                onChange={(e) => handleUpdateExam(idx, 'session', e.target.value as 'FN' | 'AN')}
                                aria-label={`Session for ${exam.courseCode}`}
                                className="text-xs rounded border border-gray-300 p-1.5 focus:border-primary focus:outline-none font-semibold">
                                <option value="FN">FN (Forenoon)</option>
                                <option value="AN">AN (Afternoon)</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <input type="text" value={exam.time}
                                onChange={(e) => handleUpdateExam(idx, 'time', e.target.value)}
                                className="w-36 text-xs rounded border border-gray-300 p-1.5 focus:border-primary focus:outline-none" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setStep('UPLOAD')}>← Re-upload</Button>
                    <Button variant="primary" onClick={handleConfirmAndAnalyze} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                      Confirm &amp; Generate Study Plan
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── STEP 4: DASHBOARD ─────────────────────────────────────────────────── */}
      {step === 'DASHBOARD' && analysis && (
        <div className="space-y-6">
          {/* AI Provider Banner */}
          {analysis.aiProvider && (
            <AIProviderBadge provider={analysis.aiProvider} confidence={analysis.aiConfidence} />
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Total Papers</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analysis.totalExams}</p>
              <p className="text-[11px] text-gray-400">Theory exams</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Exam Window</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{analysis.totalDurationDays} Days</p>
              <p className="text-[11px] text-gray-400">
                {formatDate(analysis.startDate, 'dd MMM')} to {formatDate(analysis.endDate, 'dd MMM')}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Avg. Gap</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{analysis.averageGapDays} Days</p>
              <p className="text-[11px] text-gray-400">Per subject prep</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Countdown</span>
              <p className="text-2xl font-bold text-primary mt-1">
                {Math.max(0, daysFromToday(analysis.startDate))} Days
              </p>
              <p className="text-[11px] text-gray-400">Until Paper #1</p>
            </div>
          </div>

          {/* Exam Table */}
          <Card>
            <CardHeader>
              <CardTitle>End-Semester Exam Schedule</CardTitle>
              <CardDescription>Verified timetable with session allocation and prep gaps</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4">Study Gap</th>
                    <th className="py-3 px-4 text-right">Countdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analysis.examSchedule.map((exam) => {
                    const days = exam.daysRemaining ?? daysFromToday(exam.date);
                    return (
                      <tr key={exam.id} className="hover:bg-gray-50/75 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                          {formatDate(exam.date, 'dd MMM yyyy (EEE)')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary text-xs">{exam.courseCode}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{exam.subjectName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-brand-blue border border-blue-200">
                            {exam.session} ({exam.time})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(exam.gapDays ?? 0) > 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                              +{exam.gapDays} days prep
                            </span>
                          ) : <span className="text-gray-400 text-xs">Opening Exam</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-xs font-bold ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-gray-800'}`}>
                            {days > 0 ? `in ${days} days` : days === 0 ? 'Today!' : 'Past'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Study Plan */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> 6-Line Strategic Study Plan
              </CardTitle>
              <CardDescription>Pacing based on your extracted exam gap days</CardDescription>
            </CardHeader>
            <CardBody className="p-6">
              <ol className="space-y-3">
                {analysis.studyPlan.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-700">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-primary font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExamCountdownPage;

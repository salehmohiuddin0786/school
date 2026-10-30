'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  Award,
  ArrowLeft,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  School,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function OfficialReportCardsPage() {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load of exams and students
  useEffect(() => {
    fetch('/api/admin/exams/report-cards')
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'success') {
          setExams(d.exams || []);
          setStudents(d.students || []);
          if (d.exams?.length > 0) setSelectedExamId(d.exams[0].id);
          if (d.students?.length > 0) setSelectedStudentId(d.students[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg('Failed to load exams and student roster.');
        setLoading(false);
      });
  }, []);

  // Fetch report card when exam or student selection changes
  useEffect(() => {
    if (selectedExamId && selectedStudentId) {
      loadReportCard(selectedExamId, selectedStudentId);
    }
  }, [selectedExamId, selectedStudentId]);

  const loadReportCard = async (examId, studentId) => {
    setDocLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/exams/report-cards?examId=${examId}&studentId=${studentId}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setReportCard(data.reportCard);
      } else {
        setErrorMsg(data.error || 'No published report card found for this student and exam.');
        setReportCard(null);
      }
    } catch (err) {
      setErrorMsg('Network error while generating official report card.');
      setReportCard(null);
    } finally {
      setDocLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    return name.includes(q) || adm.includes(q);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Screen Header - Hidden on Print */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <Link href="/admin/exams" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Examination Hub
              </Link>
              <span>/</span>
              <span className="text-slate-500">Board Report Cards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-8 h-8 text-indigo-600" />
              CBSE Official Report Card & Marksheet
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Commercial-grade academic evaluation report with 9-point grading, co-scholastic domains, and board-compliant print formatting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={!reportCard || docLoading}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              Print Official Card (A4)
            </button>
          </div>
        </div>

        {/* Filter & Selection Bar - Hidden on Print */}
        <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          {/* Exam Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 text-sm focus:border-indigo-600 focus:bg-white outline-none"
            >
              {exams.length === 0 ? (
                <option value="">No examinations available</option>
              ) : (
                exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.examType})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Student Search & Select */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Student Search & Selection
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter student by name or GR / Admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-indigo-600 focus:bg-white outline-none"
                />
              </div>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 text-sm focus:border-indigo-600 focus:bg-white outline-none"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">No matching student</option>
                ) : (
                  filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) — {s.className || 'Class 10'} {s.sectionName || 'A'}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Error / Empty State */}
        {errorMsg && (
          <div className="print:hidden p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {docLoading && (
          <div className="print:hidden p-12 text-center text-slate-500 font-semibold">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Compiling Official Board Report Card...
          </div>
        )}

        {/* THE OFFICIAL REPORT CARD DOCUMENT (Print Ready Container) */}
        {reportCard && !docLoading && (
          <div className="bg-white rounded-3xl border-2 border-slate-800 p-8 sm:p-12 shadow-xl print:p-0 print:border-none print:shadow-none print:m-0 max-w-5xl mx-auto">
            {/* 1. INSTITUTION OFFICIAL HEADER */}
            <div className="border-b-4 border-double border-slate-800 pb-6 mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <School className="w-10 h-10 text-slate-900 print:text-black" />
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-950 font-serif">
                  {reportCard.institution.name}
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-widest">
                {reportCard.institution.affiliation} | School Code: {reportCard.institution.code}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {reportCard.institution.address}, {reportCard.institution.city}, {reportCard.institution.state} - {reportCard.institution.postalCode}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Phone: {reportCard.institution.phone} | Email: {reportCard.institution.email} | Web: {reportCard.institution.website}
              </p>

              <div className="inline-block mt-4 px-6 py-1.5 rounded-full border-2 border-slate-900 bg-slate-100 print:bg-transparent">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">
                  Continuous Comprehensive Evaluation & Marks Statement
                </h2>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1">
                {reportCard.examination.name} — Academic Session {reportCard.student.academicYear}
              </p>
            </div>

            {/* 2. STUDENT BIO & ENROLLMENT TABLE */}
            <div className="border border-slate-800 rounded-xl p-4 mb-6 bg-slate-50/50 print:bg-transparent">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-xs font-medium">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Student Name</span>
                  <span className="text-slate-950 font-bold text-sm">{reportCard.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Admission / GR No</span>
                  <span className="text-slate-950 font-bold text-sm font-mono">{reportCard.student.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Class & Section</span>
                  <span className="text-slate-950 font-bold text-sm">{reportCard.student.classGrade} - {reportCard.student.section}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Roll Number</span>
                  <span className="text-slate-950 font-bold text-sm font-mono">{reportCard.student.rollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Date of Birth</span>
                  <span className="text-slate-950 font-semibold">{new Date(reportCard.student.dateOfBirth).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Blood Group</span>
                  <span className="text-slate-950 font-semibold">{reportCard.student.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Campus / Center</span>
                  <span className="text-slate-950 font-semibold">{reportCard.student.campus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Attendance Record</span>
                  <span className="text-slate-950 font-bold font-mono">
                    {reportCard.attendance.presentDays} / {reportCard.attendance.totalDays} ({reportCard.attendance.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. PART 1: SCHOLASTIC AREAS MARKSHEET */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
                  Part 1: Scholastic Performance Evaluation
                </h3>
                <span className="text-[11px] font-bold text-slate-600">Standard CBSE 9-Point Scale</span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase text-[11px] print:bg-slate-200 print:text-black">
                      <th className="p-2.5 border-r border-slate-700 print:border-slate-400">Code</th>
                      <th className="p-2.5 border-r border-slate-700 print:border-slate-400">Subject Name</th>
                      <th className="p-2.5 border-r border-slate-700 text-right print:border-slate-400">Max Marks</th>
                      <th className="p-2.5 border-r border-slate-700 text-right print:border-slate-400">Pass Marks</th>
                      <th className="p-2.5 border-r border-slate-700 text-right print:border-slate-400">Marks Obtained</th>
                      <th className="p-2.5 border-r border-slate-700 text-center print:border-slate-400">Grade</th>
                      <th className="p-2.5 border-r border-slate-700 text-center print:border-slate-400">Grade Point</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportCard.scholasticPerformance.subjects.map((sub, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 print:bg-transparent'}>
                        <td className="p-2.5 font-mono font-bold text-slate-600 border-r border-slate-200">{sub.subjectCode}</td>
                        <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{sub.subjectName}</td>
                        <td className="p-2.5 text-right font-mono border-r border-slate-200">{sub.maxMarks}</td>
                        <td className="p-2.5 text-right font-mono border-r border-slate-200">{sub.passMarks}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-950 border-r border-slate-200">
                          {sub.isAbsent ? <span className="text-rose-600">ABSENT</span> : sub.marksObtained}
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono text-indigo-700 print:text-black border-r border-slate-200">
                          {sub.grade}
                        </td>
                        <td className="p-2.5 text-center font-mono border-r border-slate-200">{sub.gradePoint.toFixed(1)}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.status === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black'
                                : 'bg-rose-100 text-rose-800 print:bg-transparent print:text-black'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Grand Total Row */}
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-800 text-slate-950 print:bg-transparent">
                      <td colSpan="2" className="p-2.5 uppercase tracking-wider text-right border-r border-slate-300">
                        Aggregate Total
                      </td>
                      <td className="p-2.5 text-right font-mono border-r border-slate-300">
                        {reportCard.scholasticPerformance.totalMaxMarks}
                      </td>
                      <td className="p-2.5 text-right font-mono border-r border-slate-300">-</td>
                      <td className="p-2.5 text-right font-mono text-sm border-r border-slate-300">
                        {reportCard.scholasticPerformance.totalMarksObtained}
                      </td>
                      <td className="p-2.5 text-center font-mono text-sm text-indigo-800 print:text-black border-r border-slate-300">
                        {reportCard.scholasticPerformance.grade}
                      </td>
                      <td className="p-2.5 text-center font-mono text-sm border-r border-slate-300">
                        {reportCard.scholasticPerformance.gpa?.toFixed(1) || '10.0'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-800 print:text-black">
                        {reportCard.scholasticPerformance.resultStatus}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 4. SUMMARY BADGES & PROMOTION STATUS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl border border-slate-800 bg-slate-50/80 print:bg-transparent">
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200 print:border-none">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Overall Percentage</span>
                <span className="text-xl font-black text-slate-900 font-mono">{reportCard.scholasticPerformance.percentage}%</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200 print:border-none">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Composite Grade</span>
                <span className="text-xl font-black text-indigo-700 print:text-black font-mono">{reportCard.scholasticPerformance.grade}</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200 print:border-none">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Cumulative GPA</span>
                <span className="text-xl font-black text-slate-900 font-mono">{reportCard.scholasticPerformance.gpa?.toFixed(1) || '10.0'}</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200 print:border-none">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Institutional Rank</span>
                <span className="text-xl font-black text-slate-900 font-mono">#{reportCard.scholasticPerformance.rank}</span>
              </div>
            </div>

            <div className="mb-6 p-3 rounded-xl border border-slate-800 bg-emerald-50/50 print:bg-transparent flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Final Result & Promotion Remarks</span>
                <span className="text-sm font-black text-emerald-900 print:text-black uppercase tracking-wide">
                  {reportCard.scholasticPerformance.promotionRemarks}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full border border-emerald-600 bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase print:bg-transparent print:border-black">
                {reportCard.scholasticPerformance.resultStatus}
              </div>
            </div>

            {/* 5. PART 2: CO-SCHOLASTIC AREAS */}
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
                Part 2: Co-Scholastic & Life Skills Assessment
              </h3>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold uppercase text-[10px] text-slate-700 print:bg-slate-200">
                      <th className="p-2 border-r border-slate-300">Activity Domain</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Grade</th>
                      <th className="p-2">Descriptive Indicators & Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportCard.coScholasticAssessment.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{item.area}</td>
                        <td className="p-2 font-bold font-mono text-center text-indigo-700 print:text-black border-r border-slate-200">{item.grade}</td>
                        <td className="p-2 text-slate-600">{item.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. GRADING SCALE LEGEND */}
            <div className="mb-8 p-3 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-transparent">
              <h4 className="text-[10px] font-bold uppercase text-slate-600 mb-1.5 tracking-wider">
                Grading Scale Legend (CBSE 9-Point Scale)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-[9px] text-center font-mono">
                {reportCard.gradingScaleLegend.map((g, idx) => (
                  <div key={idx} className="p-1 rounded border border-slate-200 bg-white print:border-slate-400">
                    <span className="font-bold text-slate-900 block">{g.grade} ({g.gradePoint})</span>
                    <span className="text-slate-500 block text-[8px]">{g.markRange}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. OFFICIAL SIGNATORIES */}
            <div className="grid grid-cols-4 gap-4 pt-12 border-t-2 border-slate-800 text-center text-xs font-bold text-slate-900">
              <div className="border-t border-slate-400 pt-2">
                <span>{reportCard.signatories.classTeacher}</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span>{reportCard.signatories.examIncharge}</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span>{reportCard.signatories.principal}</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span>{reportCard.signatories.parent}</span>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-slate-400 font-mono">
              Report Generated on: {new Date(reportCard.generatedAt).toLocaleString()} | System Authenticated Official Transcript
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

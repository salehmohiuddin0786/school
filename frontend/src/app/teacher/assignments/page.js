'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Award,
  Link as LinkIcon,
  Search,
  ExternalLink
} from 'lucide-react';

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Form states for creating assignment
  const [formTitle, setFormTitle] = useState('');
  const [formClassSubjectId, setFormClassSubjectId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formMaxMarks, setFormMaxMarks] = useState(50);
  const [formDescription, setFormDescription] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Grading states
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/assignments');
      const data = await res.json();
      if (data.status === 'success') {
        setAssignments(data.assignments || []);
        setClassSubjects(data.classSubjects || []);
        if (data.classSubjects?.length > 0 && !formClassSubjectId) {
          setFormClassSubjectId(data.classSubjects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formTitle.trim() || !formClassSubjectId || !formDueDate) {
      setFormError('Please fill in title, target class/subject, and due date.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          classSubjectId: formClassSubjectId,
          dueDate: formDueDate,
          maxMarks: Number(formMaxMarks),
          description: formDescription,
          attachmentUrl: formAttachmentUrl,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Assignment created successfully!');
        setShowCreateModal(false);
        setFormTitle('');
        setFormDescription('');
        setFormAttachmentUrl('');
        fetchAssignments();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setFormError(data.message || 'Failed to create assignment.');
      }
    } catch (err) {
      setFormError('Network error while saving assignment.');
    } finally {
      setSaving(false);
    }
  };

  const openSubmissionsModal = async (asg) => {
    setSelectedAssignment(asg);
    try {
      setLoadingSubmissions(true);
      const res = await fetch(`/api/teacher/assignments/${asg.id}/submissions`);
      const data = await res.json();
      if (data.status === 'success') {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (subId) => {
    if (!gradeMarks) return;
    try {
      setSubmittingGrade(true);
      const res = await fetch(`/api/teacher/assignments/${selectedAssignment.id}/submissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: subId,
          marksAwarded: gradeMarks,
          feedback: gradeFeedback,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSubmissions(prev => prev.map(s => s.id === subId ? {
          ...s,
          status: 'GRADED',
          marksAwarded: Number(gradeMarks),
          feedback: gradeFeedback,
        } : s));
        setGradingSubmissionId(null);
        setGradeMarks('');
        setGradeFeedback('');
      }
    } catch (err) {
      console.error('Failed to grade:', err);
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Homework & Course Assignments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create student tasks, publish curriculum homework, and grade student submissions.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Assignment</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Assignments List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading assignments...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No assignments created yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Click "Create New Assignment" to publish homework for your authorized classes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((asg) => (
                <div key={asg.id} className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        {asg.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {asg.className}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Due {asg.dueDate}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{asg.title}</h3>
                    {asg.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">{asg.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">Max Marks: {asg.maxMarks}</span>
                      {asg.attachmentUrl && (
                        <a
                          href={asg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <LinkIcon className="w-3 h-3" /> Attachment
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openSubmissionsModal(asg)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-xs transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>Submissions ({asg.totalSubmissions})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">New Assignment</h2>
                  <p className="text-xs text-slate-500">Publish task to assigned class & section</p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 4 Trigonometry Problem Set"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Class & Subject *</label>
                    <select
                      value={formClassSubjectId}
                      onChange={(e) => setFormClassSubjectId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      {classSubjects.map((cs) => (
                        <option key={cs.id} value={cs.id}>
                          {cs.courseName || 'Class'} ({cs.sectionName || 'Sec'}) - {cs.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formMaxMarks}
                    onChange={(e) => setFormMaxMarks(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Instructions / Description</label>
                  <textarea
                    rows="3"
                    placeholder="Provide detailed instructions, problem numbers, or reference materials..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Attachment URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://cloud-storage.com/worksheet.pdf"
                    value={formAttachmentUrl}
                    onChange={(e) => setFormAttachmentUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {saving ? 'Publishing...' : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions & Grading Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Student Submissions
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedAssignment.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Max Marks: {selectedAssignment.maxMarks} &bull; Due: {selectedAssignment.dueDate}
                </p>
              </div>

              {loadingSubmissions ? (
                <div className="py-16 text-center text-sm text-slate-400">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-700">No submissions received yet</div>
                  <p className="text-xs text-slate-400 mt-1">Students enrolled in this section haven't submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sub.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Roll: {sub.admissionNumber}</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'GRADED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      {sub.submissionText && (
                        <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                          {sub.submissionText}
                        </div>
                      )}

                      {sub.fileUrl && (
                        <div>
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Submitted File / Document
                          </a>
                        </div>
                      )}

                      {/* Grading Form / Display */}
                      {sub.status === 'GRADED' && gradingSubmissionId !== sub.id ? (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">
                              Marks Awarded: {sub.marksAwarded} / {selectedAssignment.maxMarks}
                            </span>
                            {sub.feedback && (
                              <p className="text-slate-500 text-[11px] mt-0.5">Feedback: "{sub.feedback}"</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setGradingSubmissionId(sub.id);
                              setGradeMarks(String(sub.marksAwarded));
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="text-emerald-700 font-bold hover:underline text-xs"
                          >
                            Edit Grade
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row gap-2 items-center">
                          <input
                            type="number"
                            min="0"
                            max={selectedAssignment.maxMarks}
                            placeholder="Marks"
                            value={gradingSubmissionId === sub.id ? gradeMarks : ''}
                            onChange={(e) => {
                              setGradingSubmissionId(sub.id);
                              setGradeMarks(e.target.value);
                            }}
                            className="w-24 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Feedback (optional)"
                            value={gradingSubmissionId === sub.id ? gradeFeedback : ''}
                            onChange={(e) => {
                              setGradingSubmissionId(sub.id);
                              setGradeFeedback(e.target.value);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs outline-none"
                          />
                          <button
                            onClick={() => handleGradeSubmission(sub.id)}
                            disabled={submittingGrade}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                          >
                            Save Grade
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

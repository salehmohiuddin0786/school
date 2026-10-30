'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  X, 
  ExternalLink, 
  Award,
  Upload,
  Link as LinkIcon
} from 'lucide-react';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/assignments');
      const data = await res.json();
      if (data.status === 'success') {
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = (asg) => {
    setSelectedAssignment(asg);
    setSubmissionText(asg.submission?.submissionText || '');
    setFileUrl(asg.submission?.fileUrl || '');
    setErrorMsg('');
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !fileUrl.trim()) {
      setErrorMsg('Please enter your written solution or provide an attachment file URL.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          submissionText,
          fileUrl,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Homework submitted successfully!');
        setSelectedAssignment(null);
        fetchAssignments();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Could not submit homework.');
      }
    } catch (err) {
      setErrorMsg('Network error while submitting homework.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Class Homework & Tasks
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active assignments, homework submissions, teacher grading, and feedback notes.
            </p>
          </div>
          <div className="bg-violet-50 text-violet-900 border border-violet-200/60 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-sm">
            <BookOpen className="w-4 h-4 text-violet-600" />
            <span>{assignments.length} Course Assignments</span>
          </div>
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
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading assignments...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No active homework</h3>
              <p className="text-xs text-slate-400 mt-1">All course assignments have been completed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((asg) => {
                const sub = asg.submission;
                const isGraded = sub?.status === 'GRADED';
                const isSubmitted = !!sub;

                return (
                  <div key={asg.id} className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60">
                          {asg.subject}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Due: {asg.dueDate}
                        </span>
                        <span className="text-xs text-slate-400">
                          &bull; Teacher: <strong className="text-slate-700">{asg.teacher}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug">{asg.title}</h3>
                      {asg.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>
                      )}

                      {/* Attached worksheet */}
                      {asg.attachmentUrl && (
                        <div className="pt-1">
                          <a
                            href={asg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-violet-700 font-semibold hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Download Teacher's Reference / Worksheet
                          </a>
                        </div>
                      )}

                      {/* Grading and Feedback Display */}
                      {isGraded && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs mt-3 flex items-start gap-3">
                          <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-extrabold text-emerald-900 text-sm">
                              Score: {sub.marksAwarded} / {asg.maxMarks} Marks
                            </div>
                            {sub.feedback && (
                              <p className="text-emerald-800 text-xs mt-0.5">
                                Teacher Remarks: "{sub.feedback}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div>
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            Graded
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 font-bold text-xs">
                            <Clock className="w-4 h-4 text-amber-600" />
                            Pending Submission
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => openSubmitModal(asg)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm ${
                          isSubmitted
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25 hover:scale-105'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isSubmitted ? 'Resubmit Homework' : 'Submit Homework'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Homework Submission Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Submit Homework</h2>
                  <p className="text-xs text-slate-500">{selectedAssignment.title}</p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitHomework} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Written Solution / Answer Text</label>
                  <textarea
                    rows="4"
                    placeholder="Type your homework answers or submission notes here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Document / File URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/your-homework.pdf"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Upload your document to cloud storage (Google Drive, Dropbox, OneDrive) and paste the link here.
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Upload & Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

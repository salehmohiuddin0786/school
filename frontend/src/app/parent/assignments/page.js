'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Award, 
  ArrowLeft,
  ExternalLink 
} from 'lucide-react';

export default function ParentAssignmentsPage() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parent/children')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success' && d.children?.length > 0) {
          setChildren(d.children);
          setSelectedChildId(d.children[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchAssignments(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchAssignments = async (childId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/assignments?studentId=${childId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header & Child Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
              <Link href="/parent" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Parent Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-500">Homework & Tasks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Homework & Course Tasks
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tracking academic submissions, due dates, scores, and teacher remarks for {selectedChild?.name}.
            </p>
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 pr-4 py-1 outline-none"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.class}-{c.section})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading homework records...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No active homework</h3>
              <p className="text-xs text-slate-400 mt-1">All course assignments have been submitted.</p>
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60">
                          {asg.subject}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Due: {asg.dueDate}
                        </span>
                        <span className="text-xs text-slate-400">
                          &bull; Faculty: <strong className="text-slate-700">{asg.teacher}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug">{asg.title}</h3>
                      {asg.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

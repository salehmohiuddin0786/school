'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CalendarCheck, 
  Calendar, 
  Check, 
  X, 
  Save, 
  CheckCircle2, 
  Users 
} from 'lucide-react';

export default function TeacherAttendancePage() {
  const [date, setDate] = useState('2026-10-16');
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setTeacher(d.teacher);
        }
      });
  }, []);

  const loadStudentsAttendance = () => {
    if (!teacher) return;
    setLoading(true);
    const params = new URLSearchParams({
      date,
      class: teacher.class || '10',
      section: teacher.section || 'A',
    });

    fetch(`/api/admin/attendance?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setStudents(data.records);
          const map = {};
          data.records.forEach(r => {
            map[r.student_id] = r.status === '1' || r.status === 1 ? '1' : '0';
          });
          setAttendanceMap(map);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (teacher) {
      loadStudentsAttendance();
    }
  }, [date, teacher]);

  const toggleStatus = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === '1' ? '0' : '1',
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.student_id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const attendanceList = Object.entries(attendanceMap).map(([student_id, status]) => ({
      student_id,
      status,
    }));

    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          className: teacher.class,
          section: teacher.section,
          attendanceList,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Attendance submitted successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === '1').length;
  const totalCount = students.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Class Attendance & Roll Call
            </h2>
            <p className="text-sm text-slate-500">
              Class {teacher?.class || '10'} - Section {teacher?.section || 'A'} &bull; Daily Record
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Submitting...' : 'Submit Attendance'}</span>
          </button>
        </div>

        {/* Date Selector & Shortcuts */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('1')}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAll('0')}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Students</span>
            <span className="text-xl font-extrabold text-slate-900">{totalCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Present</span>
            <span className="text-xl font-extrabold text-emerald-600">{presentCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-teal-600 uppercase">Attendance Rate</span>
            <span className="text-xl font-extrabold text-teal-600">{rate}%</span>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading class roll...</div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No students found in your assigned class.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((s) => {
                    const isPresent = attendanceMap[s.student_id] === '1';
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {s.fname} {s.lname}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-emerald-600 font-bold">
                          {s.student_id}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            isPresent ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isPresent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            <span>{isPresent ? 'Present' : 'Absent'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => toggleStatus(s.student_id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                              isPresent 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Mark as {isPresent ? 'Absent' : 'Present'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

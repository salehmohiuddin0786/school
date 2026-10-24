'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CalendarCheck, 
  Calendar, 
  Check, 
  X, 
  Save, 
  Filter, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function AttendancePage() {
  const [date, setDate] = useState('2026-10-16');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Fetch classes list
  useEffect(() => {
    fetch('/api/admin/classes')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success' && data.classes.length > 0) {
          setClasses(data.classes);
          setSelectedClass(data.classes[0].class);
          setSelectedSection(data.classes[0].section);
        }
      });
  }, []);

  // Fetch attendance records when class/date changes
  const loadAttendance = () => {
    if (!selectedClass) return;
    setLoading(true);
    const params = new URLSearchParams({
      date,
      class: selectedClass,
      section: selectedSection,
    });

    fetch(`/api/admin/attendance?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setStudents(data.records);
          const initialMap = {};
          data.records.forEach(r => {
            initialMap[r.student_id] = r.status === '1' || r.status === 1 ? '1' : '0';
          });
          setAttendanceMap(initialMap);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAttendance();
  }, [date, selectedClass, selectedSection]);

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
          className: selectedClass,
          section: selectedSection,
          attendanceList,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to save');
      }
      setMessage('Attendance successfully saved to database!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === '1').length;
  const totalCount = students.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Attendance</h2>
            <p className="text-sm text-slate-500">Record daily classroom roll call and generate monthly reports.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
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
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white outline-none"
              >
                {classes.map(c => (
                  <option key={`${c.class}-${c.section}`} value={c.class}>
                    Class {c.class}
                  </option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
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

        {/* Attendance Rate Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Class Roll Count</span>
            <span className="text-xl font-extrabold text-slate-900">{totalCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Present Students</span>
            <span className="text-xl font-extrabold text-emerald-600">{presentCount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase">Attendance Rate</span>
            <span className="text-xl font-extrabold text-indigo-600">{rate}%</span>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Student Roll Call Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading roll call...</div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No students found in Class {selectedClass} Section {selectedSection}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Student ID</th>
                    <th className="py-4 px-6">Class / Sec</th>
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
                        <td className="py-4 px-6 font-mono text-xs text-indigo-600">
                          {s.student_id}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          Class {s.class} - {s.section}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isPresent 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
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

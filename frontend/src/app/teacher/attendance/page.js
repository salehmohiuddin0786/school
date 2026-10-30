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
  Users, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function TeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState('rollcall'); // 'rollcall' | 'my_attendance'
  
  // Roll call states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Personal attendance states
  const [myAttendanceData, setMyAttendanceData] = useState(null);
  const [loadingMyAttendance, setLoadingMyAttendance] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') {
          setTeacher(d.teacher);
        }
      });
  }, []);

  // Fetch students roll call
  useEffect(() => {
    if (activeTab === 'rollcall' && teacher) {
      loadStudentsAttendance();
    }
  }, [date, teacher, activeTab]);

  // Fetch personal attendance
  useEffect(() => {
    if (activeTab === 'my_attendance') {
      fetchMyAttendance();
    }
  }, [activeTab]);

  const fetchMyAttendance = async () => {
    try {
      setLoadingMyAttendance(true);
      const res = await fetch('/api/teacher/my-attendance');
      const data = await res.json();
      if (data.status === 'success') {
        setMyAttendanceData(data);
      }
    } catch (err) {
      console.error('Failed to fetch personal attendance:', err);
    } finally {
      setLoadingMyAttendance(false);
    }
  };

  const loadStudentsAttendance = () => {
    if (!teacher) return;
    setLoadingStudents(true);
    setErrorMsg('');
    const params = new URLSearchParams({
      date,
      class: teacher.class || '10',
      section: teacher.section || 'A',
    });

    fetch(`/api/admin/attendance?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setStudents(data.records || []);
          const map = {};
          (data.records || []).forEach(r => {
            map[r.student_id] = r.status === '1' || r.status === 1 ? '1' : '0';
          });
          setAttendanceMap(map);
        } else {
          setErrorMsg(data.error || 'Failed to load students');
        }
        setLoadingStudents(false);
      })
      .catch(() => {
        setErrorMsg('Network error while loading roll call');
        setLoadingStudents(false);
      });
  };

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
    setErrorMsg('');

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
        setMessage('Class attendance submitted successfully!');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setErrorMsg(data.error || 'Could not record attendance.');
      }
    } catch (err) {
      setErrorMsg('Network error while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === '1').length;
  const totalCount = students.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Attendance Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Daily student roll call and read-only personal attendance ledger.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('rollcall')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rollcall'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class Roll Call
            </button>
            <button
              onClick={() => setActiveTab('my_attendance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my_attendance'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Attendance (Read-Only)
            </button>
          </div>
        </div>

        {/* TAB 1: CLASS ROLL CALL */}
        {activeTab === 'rollcall' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Student Roll Call • Class {teacher?.class || '10'}-{teacher?.section || 'A'}
                </h2>
                <p className="text-xs text-slate-500">
                  Authorized class teacher or designated substitute roll call.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Submitting...' : 'Submit Attendance'}</span>
              </button>
            </div>

            {/* Notification Messages */}
            {message && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Selector & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block">Attendance Date</label>
                    <input
                      type="date"
                      max={todayStr}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markAll('1')}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => markAll('0')}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    All Absent
                  </button>
                </div>
              </div>

              <div className="md:col-span-6 grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total Enrolled</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Present</div>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">{presentCount}</div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Turnout %</div>
                  <div className="text-2xl font-extrabold text-blue-600 mt-1">{rate}%</div>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {loadingStudents ? (
                <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading class roster...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="py-20 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No students enrolled</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    No active student records found for Class {teacher?.class || '10'}-{teacher?.section || 'A'}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                        <th className="py-3.5 px-5">ID</th>
                        <th className="py-3.5 px-5">Student Name</th>
                        <th className="py-3.5 px-5">Class & Section</th>
                        <th className="py-3.5 px-5 text-center">Status</th>
                        <th className="py-3.5 px-5 text-right">Quick Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students.map((s) => {
                        const isPresent = attendanceMap[s.student_id] === '1';
                        return (
                          <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5 font-mono text-slate-500 font-bold">
                              STD-{s.student_id}
                            </td>
                            <td className="py-3.5 px-5 font-bold text-slate-900 text-sm">
                              {s.fname} {s.lname}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                {s.class} - {s.section}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                                isPresent 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                              }`}>
                                {isPresent ? 'PRESENT' : 'ABSENT'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => toggleStatus(s.student_id)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  isPresent
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                Mark {isPresent ? 'Absent' : 'Present'}
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
        )}

        {/* TAB 2: MY ATTENDANCE (READ-ONLY) */}
        {activeTab === 'my_attendance' && (
          <div className="space-y-6">
            {/* Read-Only Notice Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Read-Only Personal Record
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your personal staff attendance is logged via administrative timesheets and biometric systems. Teachers cannot mark, modify, or falsify personal attendance records.
                </p>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Recorded</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">
                  {myAttendanceData?.summary?.totalDays || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Working sessions</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Days Present</span>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {myAttendanceData?.summary?.presentDays || 0}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Verified
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Days Absent</span>
                <div className="text-3xl font-extrabold text-rose-600 mt-1">
                  {myAttendanceData?.summary?.absentDays || 0}
                </div>
                <div className="text-[11px] text-rose-600 font-semibold mt-1">Unexcused / Leave</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Turnout Rate</span>
                <div className="text-3xl font-extrabold text-blue-600 mt-1">
                  {myAttendanceData?.summary?.attendanceRate || 100}%
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Monthly Ratio
                </div>
              </div>
            </div>

            {/* Attendance Log Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Attendance Log History</h3>
                  <p className="text-xs text-slate-500">Chronological daily records & check-in timestamps</p>
                </div>
              </div>

              {loadingMyAttendance ? (
                <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading personal records...</span>
                </div>
              ) : !myAttendanceData?.records || myAttendanceData.records.length === 0 ? (
                <div className="py-20 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No attendance history</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    No verified staff attendance records exist for this period yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                        <th className="py-3.5 px-5">Date</th>
                        <th className="py-3.5 px-5">Check-In</th>
                        <th className="py-3.5 px-5">Check-Out</th>
                        <th className="py-3.5 px-5">Lateness</th>
                        <th className="py-3.5 px-5">Remarks</th>
                        <th className="py-3.5 px-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {myAttendanceData.records.map((r) => {
                        const isPresent = r.status === 'PRESENT' || r.status === 'HALF_DAY';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-900">
                              {r.date}
                            </td>
                            <td className="py-3.5 px-5 text-slate-600">
                              {r.checkInTime || '08:30'}
                            </td>
                            <td className="py-3.5 px-5 text-slate-600">
                              {r.checkOutTime || '15:30'}
                            </td>
                            <td className="py-3.5 px-5">
                              {r.lateMinutes > 0 ? (
                                <span className="text-rose-600 font-bold">{r.lateMinutes} mins late</span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">On Time</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-slate-500">
                              {r.remarks || 'Standard Day'}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isPresent
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                              }`}>
                                {r.status}
                              </span>
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
        )}

      </div>
    </DashboardLayout>
  );
}

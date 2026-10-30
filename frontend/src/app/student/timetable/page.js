'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Clock, 
  BookOpen, 
  Calendar, 
  MapPin, 
  User, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react';

export default function StudentTimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (days.includes(todayName)) {
      setActiveDay(todayName);
    }
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/timetable');
      const data = await res.json();
      if (data.status === 'success') {
        setScheduleData(data);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekly = scheduleData?.weekly || {};
  const todaySlots = scheduleData?.todaySlots || [];
  const currentSlots = weekly[activeDay] || [];

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Class Schedule & Timetable
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your daily lecture periods, faculty instructors, rooms, and approved substitute coverage.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700 bg-violet-50 px-4 py-2 rounded-2xl border border-violet-200/60 shadow-sm">
            <Calendar className="w-4 h-4 text-violet-600" />
            <span>Today is {scheduleData?.todayDayName || 'Weekday'}</span>
          </div>
        </div>

        {/* Today's Highlighted Schedule */}
        <div className="bg-gradient-to-r from-violet-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-violet-950/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              <Sparkles className="w-4 h-4" />
              <span>Today's Live Classes ({todaySlots.length} Periods)</span>
            </div>
            <span className="text-xs bg-violet-800/80 px-3 py-1 rounded-xl text-violet-200 font-semibold">
              Live Classroom
            </span>
          </div>

          {todaySlots.length === 0 ? (
            <p className="text-sm text-violet-200">No scheduled classes for today.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-2">
              {todaySlots.map((slot, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.time}
                    </div>
                    <div className="font-bold text-white text-sm leading-snug">
                      {slot.subject}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1 text-xs text-violet-100">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-violet-400 shrink-0" />
                      <span className="font-semibold truncate">{slot.teacher}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-violet-300">
                      <MapPin className="w-3 h-3 text-violet-400 shrink-0" />
                      <span>{slot.room}</span>
                    </div>
                  </div>

                  {slot.isSubstituted && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Substitute Teacher Assigned</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Day Selection Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">Weekly Schedule Planner</h2>
            <span className="text-xs text-slate-400">Select day to inspect periods</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {days.map(d => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  activeDay === d
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading schedule...</span>
            </div>
          ) : currentSlots.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-3xl border border-slate-200/80 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700">No classes scheduled for {activeDay}</div>
              <p className="text-xs text-slate-400 mt-1">Weekend or designated activity break.</p>
            </div>
          ) : (
            currentSlots.map((slot, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-violet-200 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-600">
                      <Clock className="w-4 h-4" />
                      <span>{slot.time}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                      Period {slot.periodNumber || idx + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{slot.subject}</h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.teacher}</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.room}</span>
                  </span>
                </div>

                {slot.isSubstituted && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Substitute Teacher: {slot.teacher} (Covering for {slot.originalTeacher})</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

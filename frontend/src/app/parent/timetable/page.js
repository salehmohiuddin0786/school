'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Clock, 
  BookOpen, 
  Calendar, 
  MapPin, 
  User, 
  AlertCircle, 
  ArrowLeft,
  Sparkles 
} from 'lucide-react';

export default function ParentTimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (days.includes(todayName)) {
      setActiveDay(todayName);
    }

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
      fetchTimetable(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchTimetable = async (childId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/timetable?studentId=${childId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setScheduleData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];
  const weekly = scheduleData?.weekly || {};
  const currentSlots = weekly[activeDay] || [];

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
              <span className="text-slate-500">Timetable</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Class Routine & Periods
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Daily lecture schedule, subject teachers, and substitute coverage for {selectedChild?.name}.
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

        {/* Day selection tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {days.map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                activeDay === d
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Schedule Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
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
              <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-sky-200 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-600">
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

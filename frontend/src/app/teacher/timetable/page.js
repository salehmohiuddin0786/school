'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Clock, BookOpen, Calendar, MapPin } from 'lucide-react';

export default function TeacherTimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');

  const schedule = {
    Monday: [
      { time: '09:00 AM - 09:45 AM', subject: 'Mathematics', class: 'Class 10-A', room: 'Room 201' },
      { time: '10:00 AM - 10:45 AM', subject: 'Hindi / Regional', class: 'Class 12-A', room: 'Room 304' },
      { time: '11:15 AM - 12:00 PM', subject: 'Science & Lab', class: 'Class 9-B', room: 'Physics Lab' },
      { time: '01:00 PM - 01:45 PM', subject: 'Mathematics (Advanced)', class: 'Class 12-A', room: 'Room 304' },
    ],
    Tuesday: [
      { time: '09:00 AM - 09:45 AM', subject: 'Mathematics', class: 'Class 10-A', room: 'Room 201' },
      { time: '10:00 AM - 10:45 AM', subject: 'Problem Solving Workshop', class: 'Class 11-A', room: 'Library' },
      { time: '11:15 AM - 12:00 PM', subject: 'Science', class: 'Class 9-B', room: 'Room 102' },
    ],
    Wednesday: [
      { time: '09:00 AM - 09:45 AM', subject: 'Mathematics', class: 'Class 10-A', room: 'Room 201' },
      { time: '10:00 AM - 10:45 AM', subject: 'Hindi Literature', class: 'Class 12-A', room: 'Room 304' },
      { time: '01:00 PM - 01:45 PM', subject: 'Doubt Clearing Session', class: 'Class 10-A', room: 'Room 201' },
    ],
    Thursday: [
      { time: '09:00 AM - 09:45 AM', subject: 'Mathematics', class: 'Class 10-A', room: 'Room 201' },
      { time: '11:15 AM - 12:00 PM', subject: 'Science Lab Practice', class: 'Class 9-B', room: 'Lab 2' },
      { time: '01:00 PM - 01:45 PM', subject: 'Mathematics', class: 'Class 12-A', room: 'Room 304' },
    ],
    Friday: [
      { time: '09:00 AM - 09:45 AM', subject: 'Weekly Assessment', class: 'Class 10-A', room: 'Exam Hall' },
      { time: '10:00 AM - 10:45 AM', subject: 'Mathematics', class: 'Class 12-A', room: 'Room 304' },
      { time: '11:15 AM - 12:00 PM', subject: 'Faculty Assembly', class: 'All Staff', room: 'Auditorium' },
    ],
    Saturday: [
      { time: '09:00 AM - 10:30 AM', subject: 'Extra Coaching & Remedial', class: 'Class 10-A', room: 'Room 201' },
      { time: '11:00 AM - 12:30 PM', subject: 'Co-Curricular / Activity', class: 'Campus Wide', room: 'Ground' },
    ],
  };

  const currentSlots = schedule[activeDay] || [];

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Weekly Teaching Routine</h2>
          <p className="text-sm text-slate-500">Classroom lectures, lab sessions, and weekly schedule.</p>
        </div>

        {/* Day selection tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {days.map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                activeDay === d
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Schedule Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSlots.map((slot, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{slot.time}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{slot.subject}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {slot.class}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.room}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

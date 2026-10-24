'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Clock, BookOpen, Calendar, MapPin, User } from 'lucide-react';

export default function StudentTimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');

  const studentSchedule = {
    Monday: [
      { time: '08:30 AM - 09:15 AM', subject: 'English Communication', teacher: 'Mrs. Sharma', room: 'Room 201' },
      { time: '09:15 AM - 10:00 AM', subject: 'Mathematics', teacher: 'Mr. Verma', room: 'Room 201' },
      { time: '10:15 AM - 11:00 AM', subject: 'Science (Physics / Chemistry)', teacher: 'Dr. Gupta', room: 'Lab 1' },
      { time: '11:00 AM - 11:45 AM', subject: 'Social Studies', teacher: 'Mr. Khan', room: 'Room 201' },
      { time: '12:30 PM - 01:15 PM', subject: 'Computer Applications', teacher: 'Ms. Patel', room: 'Computer Lab' },
    ],
    Tuesday: [
      { time: '08:30 AM - 09:15 AM', subject: 'Mathematics', teacher: 'Mr. Verma', room: 'Room 201' },
      { time: '09:15 AM - 10:00 AM', subject: 'Hindi / Regional', teacher: 'Mr. Kumar', room: 'Room 201' },
      { time: '10:15 AM - 11:00 AM', subject: 'Biology & Environmental Science', teacher: 'Dr. Gupta', room: 'Bio Lab' },
      { time: '11:00 AM - 11:45 AM', subject: 'Physical Education / Sports', teacher: 'Coach Singh', room: 'Sports Ground' },
    ],
    Wednesday: [
      { time: '08:30 AM - 09:15 AM', subject: 'Science (Chemistry)', teacher: 'Dr. Gupta', room: 'Chem Lab' },
      { time: '09:15 AM - 10:00 AM', subject: 'English Literature', teacher: 'Mrs. Sharma', room: 'Room 201' },
      { time: '10:15 AM - 11:00 AM', subject: 'Mathematics', teacher: 'Mr. Verma', room: 'Room 201' },
      { time: '11:00 AM - 11:45 AM', subject: 'Library Reading Hour', teacher: 'Ms. Roy', room: 'Central Library' },
    ],
    Thursday: [
      { time: '08:30 AM - 09:15 AM', subject: 'History & Civics', teacher: 'Mr. Khan', room: 'Room 201' },
      { time: '09:15 AM - 10:00 AM', subject: 'Geography', teacher: 'Mr. Khan', room: 'Room 201' },
      { time: '10:15 AM - 11:00 AM', subject: 'Science (Physics)', teacher: 'Dr. Gupta', room: 'Physics Lab' },
      { time: '11:00 AM - 11:45 AM', subject: 'Mathematics', teacher: 'Mr. Verma', room: 'Room 201' },
    ],
    Friday: [
      { time: '08:30 AM - 09:15 AM', subject: 'Weekly Unit Assessment', teacher: 'Exam Invigilator', room: 'Room 201' },
      { time: '09:15 AM - 10:00 AM', subject: 'Art & Craft', teacher: 'Mrs. Joshi', room: 'Art Studio' },
      { time: '10:15 AM - 11:00 AM', subject: 'Mathematics Doubt Clearing', teacher: 'Mr. Verma', room: 'Room 201' },
      { time: '11:00 AM - 11:45 AM', subject: 'Value Education', teacher: 'Principal Office', room: 'Assembly Hall' },
    ],
    Saturday: [
      { time: '08:30 AM - 10:00 AM', subject: 'Club Activities & Robotics', teacher: 'Tech Lead', room: 'Innovation Lab' },
      { time: '10:15 AM - 11:45 AM', subject: 'House Competitions & Games', teacher: 'Sports Dept', room: 'Main Ground' },
    ],
  };

  const currentSlots = studentSchedule[activeDay] || [];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Class Routine & Timetable</h2>
          <p className="text-sm text-slate-500">Your daily period timetable, faculty instructors, and assigned rooms.</p>
        </div>

        {/* Day selection tabs */}
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

        {/* Schedule Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSlots.map((slot, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-violet-600 mb-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{slot.time}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{slot.subject}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.teacher}</span>
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

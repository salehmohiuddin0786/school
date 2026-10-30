'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Search, 
  Eye, 
  X, 
  GraduationCap, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function OwnerStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/owner/students?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
              <Link href="/owner" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Owner Overview
              </Link>
              <span>/</span>
              <span className="text-slate-500">Student Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional Students Roster
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Executive oversight of all student enrollments, sections, and parent contact channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-900 border border-amber-200/60 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-sm">
              <Users className="w-4 h-4 text-amber-600" />
              <span>{students.length} Enrolled Students</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading student directory...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No students found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No matching student records located for your institution query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-5">Roll No</th>
                    <th className="py-3.5 px-5">Student Name</th>
                    <th className="py-3.5 px-5">Class & Section</th>
                    <th className="py-3.5 px-5">Campus</th>
                    <th className="py-3.5 px-5">Parent / Guardian</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {s.roll_no || `STD-${s.id}`}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-sm">
                          {s.fname} {s.lname}
                        </div>
                        <div className="text-[11px] text-slate-400">{s.email || 'No email registered'}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {s.class} ({s.section})
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{s.campus || 'Main Campus'}</td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800">{s.father || 'Guardian'}</div>
                        {s.fatherPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {s.fatherPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          s.status === 'ACTIVE' || !s.status 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}>
                          <UserCheck className="w-3 h-3" /> {s.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Owner Student Details Modal (Strictly inside Owner Portal) */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {selectedStudent.fname?.[0]}{selectedStudent.lname?.[0]}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Student Details • Owner Portal
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {selectedStudent.fname} {selectedStudent.lname}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Admission / Roll: {selectedStudent.roll_no || `STD-${selectedStudent.id}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Academic Placement</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedStudent.class} - Section {selectedStudent.section}
                  </div>
                  <div className="text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedStudent.campus || 'Main Campus'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Status & Gender</span>
                  <div className="font-bold text-slate-800 text-sm capitalize">
                    {selectedStudent.gender || 'Not Specified'}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {selectedStudent.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Parent / Guardian</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedStudent.father || 'Not recorded'}
                  </div>
                  {selectedStudent.fatherPhone && (
                    <div className="text-slate-600 mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedStudent.fatherPhone}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Student Contact</span>
                  <div className="text-slate-700 flex items-center gap-1.5 break-all">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {selectedStudent.email || 'No email address'}
                  </div>
                  {selectedStudent.phone && (
                    <div className="text-slate-700 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {selectedStudent.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Link
                  href="/owner/fees"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all"
                >
                  Review Fee Ledger
                </Link>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
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

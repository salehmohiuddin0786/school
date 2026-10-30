'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Search, 
  Eye, 
  X, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowLeft,
  Calendar,
  Award,
  BookOpen
} from 'lucide-react';

export default function OwnerTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, [search]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/owner/teachers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
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
              <span className="text-slate-500">Faculty & Staff Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional Faculty & Staff
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Executive oversight of academic faculty, course assignments, and workload distribution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-900 border border-amber-200/60 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-sm">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>{teachers.length} Active Faculty</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by faculty name, employee code, or designation..."
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

        {/* Teachers Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading faculty directory...</span>
            </div>
          ) : teachers.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No faculty members found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No matching faculty records located for your institution query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-5">Emp Code</th>
                    <th className="py-3.5 px-5">Faculty Name</th>
                    <th className="py-3.5 px-5">Designation</th>
                    <th className="py-3.5 px-5">Specialization</th>
                    <th className="py-3.5 px-5">Campus</th>
                    <th className="py-3.5 px-5 text-center">Scheduled Periods</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {t.employeeCode || `TCH-${t.id}`}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-sm">
                          {t.fname} {t.lname}
                        </div>
                        <div className="text-[11px] text-slate-400">{t.email || 'No email registered'}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {t.designation || 'Teacher'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">
                        {t.specialization || t.qualification || 'General Education'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{t.campus || 'Main Campus'}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {t.scheduledPeriods || 0} periods/wk
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedTeacher(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Owner Teacher Details Modal (Strictly inside Owner Portal) */}
        {selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {selectedTeacher.fname?.[0]}{selectedTeacher.lname?.[0]}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Faculty Profile • Owner Portal
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {selectedTeacher.fname} {selectedTeacher.lname}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Employee Code: {selectedTeacher.employeeCode || `TCH-${selectedTeacher.id}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Designation & Role</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedTeacher.designation || 'Teacher'}
                  </div>
                  <div className="text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedTeacher.campus || 'Main Campus'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Academic Workload</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedTeacher.scheduledPeriods || 0} Scheduled Periods
                  </div>
                  <div className="text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Weekly schedule active
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Qualifications & Specialization</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedTeacher.specialization || 'General'}
                  </div>
                  <div className="text-slate-600 mt-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    {selectedTeacher.qualification || 'Degrees verified'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block mb-1">Direct Contact</span>
                  <div className="text-slate-700 flex items-center gap-1.5 break-all">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {selectedTeacher.email || 'No email registered'}
                  </div>
                  {selectedTeacher.phone && (
                    <div className="text-slate-700 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {selectedTeacher.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedTeacher(null)}
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

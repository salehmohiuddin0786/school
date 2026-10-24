'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Filter, 
  X, 
  Mail, 
  Phone, 
  User, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    father: '',
    gender: 'Male',
    className: '10',
    section: 'A',
    dob: '',
    phone: '',
    email: '',
    address: '',
    password: '123',
  });

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSection) params.set('section', selectedSection);

    Promise.all([
      fetch(`/api/admin/students?${params.toString()}`).then(r => r.json()),
      fetch('/api/admin/classes').then(r => r.json())
    ])
      .then(([sData, cData]) => {
        if (sData.status === 'success') setStudents(sData.students);
        if (cData.status === 'success') setClasses(cData.classes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, selectedClass, selectedSection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to add student');
      }

      setMessage('Student enrolled successfully!');
      setFormData({
        fname: '',
        lname: '',
        father: '',
        gender: 'Male',
        className: '10',
        section: 'A',
        dob: '',
        phone: '',
        email: '',
        address: '',
        password: '123',
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Distinct classes list for filter dropdown
  const uniqueClasses = Array.from(new Set(classes.map(c => c.class)));

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Directory</h2>
            <p className="text-sm text-slate-500">Manage enrolled student profiles, academic records and logins.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white outline-none"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white outline-none"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No students match your query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Class / Sec</th>
                    <th className="py-4 px-6">Father Name</th>
                    <th className="py-4 px-6">Contact</th>
                    <th className="py-4 px-6">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((s) => (
                    <tr key={s.s_no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                          {s.fname ? s.fname[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{s.fname} {s.lname}</div>
                          <div className="text-xs text-slate-400">{s.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-indigo-600 font-bold">
                        {s.id}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                          {s.class} - {s.section}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{s.father || 'N/A'}</td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {s.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{s.phone}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6 capitalize text-slate-600">{s.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Student Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Enroll New Student</h3>
                  <p className="text-xs text-slate-500">Creates student record and user login credentials.</p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {message && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fname}
                      onChange={e => setFormData({ ...formData, fname: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lname}
                      onChange={e => setFormData({ ...formData, lname: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={formData.father}
                      onChange={e => setFormData({ ...formData, father: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10"
                      value={formData.className}
                      onChange={e => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={formData.section}
                      onChange={e => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email (For Login) *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                  <span className="text-[11px] text-slate-400">Default is "123". Student can change it upon logging in.</span>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 disabled:opacity-60"
                  >
                    {submitting ? 'Enrolling...' : 'Save Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

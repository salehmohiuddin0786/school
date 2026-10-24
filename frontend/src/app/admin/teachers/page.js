'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Mail, 
  Phone, 
  BookOpen, 
  Award 
} from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    father: '',
    subject: 'Mathematics',
    gender: 'Male',
    className: '10',
    section: 'A',
    dob: '',
    phone: '',
    email: '',
    address: '',
    password: '123',
  });

  const loadTeachers = () => {
    setLoading(true);
    fetch(`/api/admin/teachers?search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setTeachers(data.teachers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTeachers();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to add teacher');
      }

      setMessage('Teacher added successfully!');
      setModalOpen(false);
      loadTeachers();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty & Teachers</h2>
            <p className="text-sm text-slate-500">Manage teaching staff, designated subjects, and assigned classrooms.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty by name, subject, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading faculty...</div>
          ) : teachers.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No teachers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Faculty Member</th>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6">Assigned Class</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {teachers.map((t) => (
                    <tr key={t.s_no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                          {t.fname ? t.fname[0].toUpperCase() : 'T'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{t.fname} {t.lname}</div>
                          <div className="text-xs text-slate-400">{t.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-emerald-600 font-bold">
                        {t.id}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          {t.subject || 'All Subjects'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {t.class ? `Class ${t.class} - ${t.section || 'A'}` : '—'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {t.phone || '—'}
                      </td>
                      <td className="py-4 px-6 capitalize text-slate-600">{t.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Teacher Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add Faculty Member</h3>
                  <p className="text-xs text-slate-500">Registers teacher and creates teacher portal login credentials.</p>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lname}
                      onChange={e => setFormData({ ...formData, lname: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Specialist Subject *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science, Mathematics"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assigned Class</label>
                    <input
                      type="text"
                      placeholder="e.g. 10"
                      value={formData.className}
                      onChange={e => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={formData.section}
                      onChange={e => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email (For Login) *</label>
                    <input
                      type="email"
                      required
                      placeholder="teacher@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                    />
                  </div>
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
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : 'Add Teacher'}
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

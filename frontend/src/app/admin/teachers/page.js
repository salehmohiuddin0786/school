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
  Award,
  DollarSign,
  History,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    // Salary fields
    basic_salary: 30000,
    allowances: 10000,
    deductions: 2000,
    joining_date: new Date().toISOString().split('T')[0],
    effective_date: new Date().toISOString().split('T')[0],
    employment_status: 'ACTIVE',
  });

  const [editFormData, setEditFormData] = useState({});

  const loadTeachers = () => {
    setLoading(true);
    fetch(`/api/admin/teachers?search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setTeachers(data.teachers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTeachers();
  }, [search]);

  // Handle Add Teacher
  const handleAddSubmit = async (e) => {
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

      setMessage('Teacher and compensation profile added successfully!');
      setTimeout(() => setMessage(''), 3000);
      setAddModalOpen(false);
      loadTeachers();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (t) => {
    setSelectedTeacher(t);
    setEditFormData({
      fname: t.fname || '',
      lname: t.lname || '',
      father: t.father || '',
      subject: t.subject || 'Mathematics',
      gender: t.gender || 'Male',
      className: t.class || '',
      section: t.section || 'A',
      dob: t.dob || '',
      phone: t.phone || '',
      address: t.address || '',
      basic_salary: t.basic_salary || 30000,
      allowances: t.allowances || 10000,
      deductions: t.deductions || 2000,
      joining_date: t.joining_date ? String(t.joining_date).split('T')[0] : '',
      effective_date: t.effective_date ? String(t.effective_date).split('T')[0] : new Date().toISOString().split('T')[0],
      employment_status: t.employment_status || 'ACTIVE',
      remarks: 'Compensation revision',
    });
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/teachers/${selectedTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to update teacher');
      }

      setMessage('Teacher and compensation revision saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      setEditModalOpen(false);
      loadTeachers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // View Salary History
  const viewHistory = (teacher) => {
    setSelectedTeacher(teacher);
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    fetch(`/api/admin/teachers/${teacher.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setSalaryHistory(d.history || []);
        }
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  };

  // Delete Teacher
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete faculty member ${name}? Portal access and salary records will be removed.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Faculty member deleted.');
        setTimeout(() => setMessage(''), 3000);
        loadTeachers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty & Teachers</h2>
            <p className="text-sm text-slate-500">Manage teaching staff, designated subjects, salary structures and compensation revisions.</p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by teacher name, subject, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            />
          </div>
        </div>

        {/* Teachers Table with Compensation */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading faculty members...</div>
          ) : teachers.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No teachers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Faculty Member</th>
                    <th className="py-4 px-6">Subject / Class</th>
                    <th className="py-4 px-6">Basic Salary</th>
                    <th className="py-4 px-6">Allowances / Deductions</th>
                    <th className="py-4 px-6">Net Compensation</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {teachers.map((t) => {
                    const basic = Number(t.basic_salary || 0);
                    const allow = Number(t.allowances || 0);
                    const deduct = Number(t.deductions || 0);
                    const net = basic + allow - deduct;

                    return (
                      <tr key={t.s_no || t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                              {t.fname ? t.fname[0].toUpperCase() : 'T'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{t.fname} {t.lname}</div>
                              <div className="text-xs text-slate-400 font-mono">{t.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{t.subject || 'General'}</div>
                          <div className="text-xs text-slate-400">
                            {t.class ? `Class ${t.class} - ${t.section}` : 'Unassigned'}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          ₹{basic.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-xs">
                          <div className="text-emerald-600 font-semibold">+₹{allow.toLocaleString()} Allow.</div>
                          <div className="text-rose-500 font-semibold">-₹{deduct.toLocaleString()} Deduct.</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-slate-900 text-base">
                            ₹{net.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-normal">per month</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            t.employment_status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {t.employment_status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="Salary Revision History"
                              onClick={() => viewHistory(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              title="Edit Teacher & Compensation"
                              onClick={() => openEditModal(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              title="Delete Teacher"
                              onClick={() => handleDelete(t.id, `${t.fname} ${t.lname}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SALARY REVISION HISTORY MODAL */}
        {historyModalOpen && selectedTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Compensation Revision History</h3>
                    <p className="text-xs text-slate-500">{selectedTeacher.fname} {selectedTeacher.lname} ({selectedTeacher.id})</p>
                  </div>
                </div>
                <button onClick={() => setHistoryModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {historyLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading audit history...</div>
              ) : salaryHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No previous salary revisions recorded.</div>
              ) : (
                <div className="space-y-3">
                  {salaryHistory.map((h, i) => {
                    const basic = Number(h.basic_salary || 0);
                    const allow = Number(h.allowances || 0);
                    const deduct = Number(h.deductions || 0);
                    const net = basic + allow - deduct;

                    return (
                      <div key={h.id || i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">₹{net.toLocaleString()} / month</div>
                          <div className="text-slate-500 mt-0.5">
                            Basic: ₹{basic.toLocaleString()} · Allowances: +₹{allow.toLocaleString()} · Deductions: -₹{deduct.toLocaleString()}
                          </div>
                          {h.remarks && <div className="text-slate-400 mt-1 italic">"{h.remarks}"</div>}
                        </div>
                        <div className="text-right sm:border-l sm:pl-4 border-slate-200">
                          <span className="font-semibold text-slate-700 block">
                            Effective: {h.effective_date ? String(h.effective_date).split('T')[0] : 'Immediate'}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Logged: {new Date(h.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT TEACHER & SALARY MODAL */}
        {editModalOpen && selectedTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Teacher & Salary Setup</h3>
                  <p className="text-xs text-slate-500">Update academic profile, basic salary, allowances, and employment status.</p>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Profile Information</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.fname}
                        onChange={e => setEditFormData({ ...editFormData, fname: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editFormData.lname}
                        onChange={e => setEditFormData({ ...editFormData, lname: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Subject *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.subject}
                        onChange={e => setEditFormData({ ...editFormData, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Class Assigned</label>
                      <input
                        type="text"
                        value={editFormData.className}
                        onChange={e => setEditFormData({ ...editFormData, className: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Section</label>
                      <input
                        type="text"
                        value={editFormData.section}
                        onChange={e => setEditFormData({ ...editFormData, section: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Compensation Section */}
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Compensation & Salary Package</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Basic Salary (₹) *</label>
                      <input
                        type="number"
                        required
                        value={editFormData.basic_salary}
                        onChange={e => setEditFormData({ ...editFormData, basic_salary: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Allowances (₹)</label>
                      <input
                        type="number"
                        value={editFormData.allowances}
                        onChange={e => setEditFormData({ ...editFormData, allowances: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Deductions (₹)</label>
                      <input
                        type="number"
                        value={editFormData.deductions}
                        onChange={e => setEditFormData({ ...editFormData, deductions: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Effective Date</label>
                      <input
                        type="date"
                        value={editFormData.effective_date}
                        onChange={e => setEditFormData({ ...editFormData, effective_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={editFormData.joining_date}
                        onChange={e => setEditFormData({ ...editFormData, joining_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Employment Status</label>
                      <select
                        value={editFormData.employment_status}
                        onChange={e => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PROBATION">PROBATION</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="TERMINATED">TERMINATED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Revision (Audit Log)</label>
                    <input
                      type="text"
                      placeholder="e.g. Annual appraisal increment or policy update"
                      value={editFormData.remarks}
                      onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : 'Save Revisions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD TEACHER MODAL */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add New Faculty & Compensation</h3>
                  <p className="text-xs text-slate-500">Create teaching staff account, login credentials, and initial salary setup.</p>
                </div>
                <button onClick={() => setAddModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Personal Details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fname}
                        onChange={e => setFormData({ ...formData, fname: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lname}
                        onChange={e => setFormData({ ...formData, lname: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Email (For Portal Login) *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Subject Specialization *</label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Class</label>
                      <input
                        type="text"
                        placeholder="e.g. 10"
                        value={formData.className}
                        onChange={e => setFormData({ ...formData, className: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Section</label>
                      <input
                        type="text"
                        placeholder="e.g. A"
                        value={formData.section}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Initial Salary Setup */}
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Initial Salary & Employment Setup</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Basic Salary (₹) *</label>
                      <input
                        type="number"
                        required
                        value={formData.basic_salary}
                        onChange={e => setFormData({ ...formData, basic_salary: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Allowances (₹)</label>
                      <input
                        type="number"
                        value={formData.allowances}
                        onChange={e => setFormData({ ...formData, allowances: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Deductions (₹)</label>
                      <input
                        type="number"
                        value={formData.deductions}
                        onChange={e => setFormData({ ...formData, deductions: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joining_date}
                        onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Effective Date</label>
                      <input
                        type="date"
                        value={formData.effective_date}
                        onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Employment Status</label>
                      <select
                        value={formData.employment_status}
                        onChange={e => setFormData({ ...formData, employment_status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PROBATION">PROBATION</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
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

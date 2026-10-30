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
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bus
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [requireClassSelection, setRequireClassSelection] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    father: '',
    gender: 'Male',
    className: '10',
    section: 'A',
    roll_no: '',
    academic_year: '2025-2026',
    dob: '',
    phone: '',
    email: '',
    address: '',
    bus_id: '',
    password: '123',
  });

  const [editFormData, setEditFormData] = useState({});

  // Fetch classes list once
  useEffect(() => {
    fetch('/api/admin/classes')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.classes)) {
          setClasses(data.classes);
        }
      })
      .catch(console.error);
  }, []);

  const loadData = () => {
    // If no class and no search, require class selection without fetching all
    if (!selectedClass && !search) {
      setStudents([]);
      setRequireClassSelection(true);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSection) params.set('section', selectedSection);
    if (selectedYear) params.set('year', selectedYear);
    params.set('page', page.toString());
    params.set('limit', '10');

    fetch(`/api/admin/students?${params.toString()}`)
      .then(r => r.json())
      .then(sData => {
        if (sData.status === 'success') {
          setStudents(sData.students || []);
          setPagination(sData.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
          setRequireClassSelection(Boolean(sData.requireClassSelection));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, selectedClass, selectedSection, selectedYear, page]);

  // Handle Add Student
  const handleAddSubmit = async (e) => {
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
      setTimeout(() => setMessage(''), 3000);
      setFormData({
        fname: '',
        lname: '',
        father: '',
        gender: 'Male',
        className: selectedClass || '10',
        section: selectedSection || 'A',
        roll_no: '',
        academic_year: selectedYear,
        dob: '',
        phone: '',
        email: '',
        address: '',
        bus_id: '',
        password: '123',
      });
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Student
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      fname: student.fname || '',
      lname: student.lname || '',
      father: student.father || '',
      gender: student.gender || 'Male',
      className: student.class || '',
      section: student.section || 'A',
      roll_no: student.roll_no || '',
      academic_year: student.academic_year || '2025-2026',
      dob: student.dob || '',
      phone: student.phone || '',
      address: student.address || '',
      city: student.city || '',
      state: student.state || '',
      bus_id: student.bus_id || '',
      status: student.status || 'ACTIVE',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to update student');
      }
      setMessage('Student profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Student
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student ${name}? This will revoke their portal login.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Student deleted successfully.');
        setTimeout(() => setMessage(''), 3000);
        loadData();
      } else {
        alert(data.error || 'Failed to delete student');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Distinct classes list for filter dropdown
  const uniqueClasses = Array.from(new Set(classes.map(c => String(c.class || '').trim()))).filter(Boolean);

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
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: CLASS, SECTION & ACADEMIC YEAR SELECTORS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Academic Cohort Filter (Select Class First)</span>
            </div>
            {selectedClass && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                Class: {selectedClass} {selectedSection ? `· Section ${selectedSection}` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Class Selector - Primary Requirement */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Class / Grade <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${
                  !selectedClass 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/20 text-slate-700' 
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                <option value="">-- Choose Class to View Students --</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {/* Section Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Section (Optional)
              </label>
              <select
                value={selectedSection}
                disabled={!selectedClass}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            {/* Academic Year Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white outline-none"
              >
                <option value="2025-2026">Academic Year 2025-2026</option>
                <option value="2024-2025">Academic Year 2024-2025</option>
                <option value="2026-2027">Academic Year 2026-2027</option>
              </select>
            </div>
          </div>

          {/* STEP 2: MANDATORY VISIBLE SEARCH BAR */}
          <div className="pt-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, admission number, roll number, email or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
            </div>
          </div>
        </div>

        {/* STEP 3: STUDENTS LIST / EMPTY STATES */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {requireClassSelection && !search ? (
            /* Clear Empty State when No Class Selected */
            <div className="py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Select a Class to View Enrolled Students</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Please select a grade/class from the dropdown above to load the student directory for that cohort.
              </p>
            </div>
          ) : loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading student directory...</div>
          ) : students.length === 0 ? (
            /* Clear Empty State when No Search/Filter Match */
            <div className="py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Enrolled Students Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                No student records matched Class "{selectedClass || 'Any'}" {selectedSection ? `Section ${selectedSection}` : ''} {search ? `with query "${search}"` : ''}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-6">Admission No</th>
                    <th className="py-4 px-6">Roll No</th>
                    <th className="py-4 px-6">Class / Sec</th>
                    <th className="py-4 px-6">Contact / Father</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((s) => (
                    <tr key={s.s_no || s.id} className="hover:bg-slate-50/80 transition-colors">
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
                        {s.admission_number || s.id}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {s.roll_no || '—'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                          {s.class} - {s.section}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>{s.father ? `F: ${s.father}` : '—'}</div>
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="View Profile"
                            onClick={() => {
                              setSelectedStudent(s);
                              setViewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Student"
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Student"
                            onClick={() => handleDelete(s.id, `${s.fname} ${s.lname}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* VIEW STUDENT PROFILE MODAL */}
        {viewModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-lg">
                    {selectedStudent.fname ? selectedStudent.fname[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedStudent.fname} {selectedStudent.lname}</h3>
                    <p className="text-xs font-mono text-indigo-600 font-semibold">ID: {selectedStudent.id}</p>
                  </div>
                </div>
                <button onClick={() => setViewModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase">Class & Section</span>
                    <span className="font-semibold text-slate-800">Class {selectedStudent.class} - {selectedStudent.section}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase">Roll Number</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.roll_no || 'Not Assigned'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase">Academic Year</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.academic_year || '2025-2026'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold uppercase">Status</span>
                    <span className="font-semibold text-emerald-600">{selectedStudent.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase">Contact & Personal Details</span>
                  <div className="text-xs text-slate-700"><strong>Father:</strong> {selectedStudent.father || 'N/A'}</div>
                  <div className="text-xs text-slate-700"><strong>Email:</strong> {selectedStudent.email || 'N/A'}</div>
                  <div className="text-xs text-slate-700"><strong>Phone:</strong> {selectedStudent.phone || 'N/A'}</div>
                  <div className="text-xs text-slate-700"><strong>Address:</strong> {selectedStudent.address || 'N/A'}, {selectedStudent.city || ''}</div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT STUDENT MODAL */}
        {editModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Student Profile</h3>
                  <p className="text-xs text-slate-500">Update academic registration and contact information.</p>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.fname}
                      onChange={e => setEditFormData({ ...editFormData, fname: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lname}
                      onChange={e => setEditFormData({ ...editFormData, lname: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.className}
                      onChange={e => setEditFormData({ ...editFormData, className: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Section</label>
                    <input
                      type="text"
                      value={editFormData.section}
                      onChange={e => setEditFormData({ ...editFormData, section: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={editFormData.roll_no}
                      onChange={e => setEditFormData({ ...editFormData, roll_no: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none bg-white"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={editFormData.father}
                      onChange={e => setEditFormData({ ...editFormData, father: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
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
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : 'Update Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD STUDENT MODAL */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Enroll New Student</h3>
                  <p className="text-xs text-slate-500">Creates student record and portal login credentials.</p>
                </div>
                <button 
                  onClick={() => setAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Roll Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      value={formData.roll_no}
                      onChange={e => setFormData({ ...formData, roll_no: e.target.value })}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={formData.academic_year}
                      onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Initial Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                    />
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

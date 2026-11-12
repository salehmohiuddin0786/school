'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  School,
  Building2,
  PlusCircle,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  GraduationCap,
  Edit,
  Trash2,
  X,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

export default function CampusManagementPage() {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    isMain: 0
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [meRes, campRes] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()).catch(() => null),
        fetch('/api/v1/owner/campuses').then(r => r.json()).catch(() => null)
      ]);

      if (meRes?.user) setCurrentUser(meRes.user);
      if (campRes?.success || campRes?.status === 'success') {
        setCampuses(campRes.data || campRes.campuses || []);
      }
    } catch {
      showToast('Error connecting to campuses service', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCampus(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      isMain: campuses.length === 0 ? 1 : 0
    });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCampus(c);
    setFormData({
      name: c.name || '',
      code: c.code || '',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      isMain: c.isMain ? 1 : 0
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCampus
        ? `/api/v1/owner/campuses/${editingCampus.id}`
        : '/api/v1/owner/campuses';
      const method = editingCampus ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        showToast(editingCampus ? 'Campus updated successfully' : 'New campus created successfully');
        setModalOpen(false);
        loadData();
      } else {
        showToast(data.error || 'Failed to save campus', 'error');
      }
    } catch {
      showToast('Error saving campus details', 'error');
    }
  };

  const handleToggleActive = async (campus) => {
    try {
      const res = await fetch(`/api/v1/owner/campuses/${campus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: campus.isActive ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        showToast(`Campus status updated to ${campus.isActive ? 'Inactive' : 'Active'}`);
        loadData();
      } else {
        showToast(data.error || 'Failed to toggle status', 'error');
      }
    } catch {
      showToast('Error updating campus status', 'error');
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Floating Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border text-sm font-semibold transition-all ${
            toast.type === 'error' ? 'bg-rose-900/90 text-white border-rose-700' : 'bg-slate-900/90 text-white border-slate-700'
          }`}>
            {toast.type === 'error' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3 uppercase tracking-wider">
              <School className="w-3.5 h-3.5" /> Multi-Campus Infrastructure
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Campus Management
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Manage branches and campuses belonging to <strong>{currentUser?.institutionName || 'your institution'}</strong>. Configure primary headquarters, branch locations, and physical administrative centers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-bold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Campus</span>
            </button>
          </div>
        </div>

        {/* Campuses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
              <span>Loading institutional campuses...</span>
            </div>
          ) : campuses.length === 0 ? (
            <div className="col-span-full py-16 bg-white rounded-3xl border border-slate-200 text-center">
              <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No campuses configured yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Click "Add New Campus" to establish your first educational branch.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Add Campus
              </button>
            </div>
          ) : (
            campuses.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
                  c.isMain ? 'border-indigo-500/60 shadow-md ring-2 ring-indigo-500/10' : 'border-slate-200/90 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      {c.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {c.isMain ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Main Campus
                        </span>
                      ) : null}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mt-3">{c.name}</h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{c.address || 'Address not specified'}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      <strong>{c.studentCount || 0}</strong> Students
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-slate-500">
                      <strong>{c.staffCount || 0}</strong> Staff
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      title="Edit Campus Details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!c.isMain && (
                      <button
                        onClick={() => handleToggleActive(c)}
                        title={c.isActive ? 'Deactivate Campus' : 'Activate Campus'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL: ADD / EDIT CAMPUS */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600">
                  <School className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCampus ? 'Edit Campus Details' : 'Add New Branch Campus'}
                  </h3>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greenwood South Campus or North Valley Branch"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Branch Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SOUTH or NVBR"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Headquarters Campus</label>
                    <select
                      value={formData.isMain}
                      onChange={e => setFormData({ ...formData, isMain: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="0">Standard Branch</option>
                      <option value="1">Primary Headquarters</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Physical Street Address</label>
                  <input
                    type="text"
                    placeholder="Road, Sector, City"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Branch Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Branch Email</label>
                    <input
                      type="email"
                      placeholder="branch@school.edu"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                >
                  {editingCampus ? 'Save Changes' : 'Create Campus'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

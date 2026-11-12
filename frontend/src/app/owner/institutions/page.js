'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  GraduationCap,
  School,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';

export default function InstitutionsManagementPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || '';

  const [institutions, setInstitutions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
    schools: 0,
    colleges: 0,
    mrr: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal States
  const [viewModalData, setViewModalData] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [subModalData, setSubModalData] = useState(null);
  const [inviteModalData, setInviteModalData] = useState(null);
  const [statusModalData, setStatusModalData] = useState(null);
  const [plans, setPlans] = useState([]);

  // Toast / Feedback State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchInstitutions = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/v1/owner/institutions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.data || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      } else {
        showToast(data.error || 'Failed to load institutions', 'error');
      }
    } catch (err) {
      showToast('Network error while fetching institutions', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, typeFilter, page]);

  // Load available subscription plans for modal
  useEffect(() => {
    fetch('/api/v1/owner/subscriptions')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.plans) setPlans(d.plans);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  // Quick Status Update
  const handleStatusChange = async (institutionId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/owner/institutions/${institutionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: `Platform owner updated status to ${newStatus}` })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Institution status updated to ${newStatus}`);
        setStatusModalData(null);
        fetchInstitutions();
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Error updating institution status', 'error');
    }
  };

  // Submit Edit Modal
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalData) return;
    try {
      const res = await fetch(`/api/v1/owner/institutions/${editModalData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModalData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Institution details updated successfully');
        setEditModalData(null);
        fetchInstitutions();
      } else {
        showToast(data.error || 'Failed to update details', 'error');
      }
    } catch {
      showToast('Error updating institution', 'error');
    }
  };

  // Submit Subscription Change
  const handleSubSubmit = async (e) => {
    e.preventDefault();
    if (!subModalData) return;
    try {
      const res = await fetch(`/api/v1/owner/institutions/${subModalData.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: subModalData.newPlanId,
          extendMonths: parseInt(subModalData.extendMonths || 1, 10),
          status: subModalData.status || 'ACTIVE'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Subscription plan updated successfully');
        setSubModalData(null);
        fetchInstitutions();
      } else {
        showToast(data.error || 'Failed to update subscription', 'error');
      }
    } catch {
      showToast('Error updating subscription', 'error');
    }
  };

  // Send / Resend Owner Invitation
  const handleSendInvite = async (inst) => {
    try {
      const res = await fetch(`/api/v1/owner/institutions/${inst.id}/invite-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setInviteModalData({
          institution: inst,
          activationLink: data.activationLink,
          token: data.token,
          expiresAt: data.expiresAt
        });
        showToast('Owner invitation token generated successfully');
      } else {
        showToast(data.error || 'Failed to generate invitation', 'error');
      }
    } catch {
      showToast('Error generating invitation', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Active</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20"><ShieldAlert className="w-3 h-3" /> Suspended</span>;
      case 'INACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20"><Clock className="w-3 h-3" /> Inactive</span>;
      case 'ARCHIVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20"><AlertTriangle className="w-3 h-3" /> Archived</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
              <Sparkles className="w-3.5 h-3.5" /> Multi-Tenant SaaS Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Institution Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Centralized platform administration across all onboarded schools and colleges. Provision workspaces, monitor tenant health, enforce subscriptions, and manage institutional owners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchInstitutions}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-bold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/owner/institutions/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Institution</span>
            </Link>
          </div>
        </div>

        {/* Platform Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Total Institutions</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Multi-campus workspaces</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Active Tenants</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{stats.active}</div>
            <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">Healthy & in good standing</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Suspended</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-2">{stats.suspended}</div>
            <div className="text-[11px] text-rose-700/80 mt-1 font-medium">Access blocked/pending</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Schools vs Colleges</span>
              <School className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
              <span className="text-blue-600">{stats.schools} S</span>
              <span className="text-slate-300">/</span>
              <span className="text-purple-600">{stats.colleges} C</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">K-12 & Higher Ed mix</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Monthly Recurring Rev</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              ₹{Number(stats.mrr || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">SaaS Subscription Run-rate</div>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Tab Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: '', label: 'All Institutions' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'INACTIVE', label: 'Inactive' },
              { id: 'SUSPENDED', label: 'Suspended' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <span className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

            {/* Type Filter Pills */}
            {[
              { id: '', label: 'All Types' },
              { id: 'SCHOOL', label: 'Schools' },
              { id: 'COLLEGE', label: 'Colleges' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setTypeFilter(tab.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  typeFilter === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, code, email, city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Institutions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Institution</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Owner Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Subscription</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                      <span>Loading institution directory...</span>
                    </td>
                  </tr>
                ) : institutions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No institutions found matching criteria.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or add a new institution.</p>
                    </td>
                  </tr>
                ) : (
                  institutions.map((inst) => {
                    const sub = inst.subscription;
                    const planName = inst.subscriptionPlan || sub?.plan?.name || 'Starter School';
                    const expiry = inst.subscriptionExpiry || (sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A');
                    const isExpiringSoon = expiry !== 'N/A' && (new Date(expiry) - new Date() < 7 * 86400000);
                    const ownerName = inst.owner?.name || [inst.owner?.firstName, inst.owner?.lastName].filter(Boolean).join(' ') || inst.ownerFirstName || 'Assigned Admin';
                    const ownerEmail = inst.owner?.email || inst.ownerEmail || inst.email || '—';
                    const ownerPhone = inst.owner?.phone || inst.ownerPhone || inst.phone || '';
                    const regDate = inst.registrationDate || (inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : 'N/A');
                    const branches = inst.branchCount || inst.campusesCount || 1;

                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Institution Name & Code */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                              {inst.logoUrl ? (
                                <img src={inst.logoUrl} alt={inst.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                inst.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{inst.name}</span>
                                {inst.code && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                    {inst.code}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{branches} campus{branches > 1 ? 'es' : ''}</span>
                                <span>&bull;</span>
                                <span>Reg: {regDate}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            inst.type === 'COLLEGE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {inst.type === 'COLLEGE' ? <GraduationCap className="w-3 h-3" /> : <School className="w-3 h-3" />}
                            {inst.type}
                          </span>
                        </td>

                        {/* Owner Contact */}
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-semibold text-slate-900">{ownerName}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{ownerEmail}</span>
                            </div>
                            {ownerPhone && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{ownerPhone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{inst.city || 'N/A'}{inst.state ? `, ${inst.state}` : ''}</span>
                          </div>
                          {inst.website && (
                            <a
                              href={inst.website.startsWith('http') ? inst.website : `https://${inst.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <span>{inst.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>

                        {/* Subscription */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-bold text-slate-900">{planName}</span>
                            <div className={`text-[11px] font-semibold mt-0.5 ${isExpiringSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                              Exp: {expiry}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(inst.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="View Institution Profile"
                              onClick={() => setViewModalData(inst)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              title="Edit Institution Metadata"
                              onClick={() => setEditModalData({
                                id: inst.id,
                                name: inst.name,
                                type: inst.type,
                                email: inst.email || '',
                                phone: inst.phone || '',
                                address: inst.address || '',
                                city: inst.city || '',
                                state: inst.state || '',
                                pincode: inst.pincode || '',
                                website: inst.website || '',
                                status: inst.status
                              })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              title="Change Subscription Plan"
                              onClick={() => setSubModalData({
                                id: inst.id,
                                name: inst.name,
                                currentPlanId: sub?.plan?.id || '',
                                newPlanId: sub?.plan?.id || plans[0]?.id || '',
                                extendMonths: 1,
                                status: sub?.status || 'ACTIVE'
                              })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>

                            <button
                              title="Invite/Manage Owner"
                              onClick={() => handleSendInvite(inst)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            {inst.status === 'ACTIVE' ? (
                              <button
                                title="Suspend Institution"
                                onClick={() => setStatusModalData({ id: inst.id, name: inst.name, targetStatus: 'SUSPENDED' })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                title="Activate Institution"
                                onClick={() => handleStatusChange(inst.id, 'ACTIVE')}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
            <div>
              Showing {institutions.length} of {pagination.total} institutions &bull; Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 px-2">{page}</span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL: VIEW INSTITUTION DETAILS */}
        {viewModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    {viewModalData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{viewModalData.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">Tenant ID: {viewModalData.id}</p>
                  </div>
                </div>
                <button onClick={() => setViewModalData(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 py-5 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Institution Type</span>
                  <span className="text-sm font-extrabold text-slate-800">{viewModalData.type}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">System Code</span>
                  <span className="text-sm font-mono font-bold text-indigo-600">{viewModalData.code || 'N/A'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Contact Email</span>
                  <span className="text-xs font-semibold text-slate-800">{viewModalData.email || 'N/A'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Phone Number</span>
                  <span className="text-xs font-semibold text-slate-800">{viewModalData.phone || 'N/A'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Physical Address</span>
                  <span className="text-xs text-slate-700">
                    {viewModalData.address || 'No address specified'}, {viewModalData.city || ''} {viewModalData.state || ''} {viewModalData.pincode || ''}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Subscription Tier</span>
                  <span className="text-xs font-bold text-emerald-700">{viewModalData.subscription?.plan?.name || 'Starter'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</span>
                  <div>{getStatusBadge(viewModalData.status)}</div>
                </div>
              </div>

              {/* Institution Owner Details */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Primary Institutional Owner</h4>
                {viewModalData.owner ? (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-indigo-950">{viewModalData.owner.firstName} {viewModalData.owner.lastName}</div>
                      <div className="text-indigo-700/80">{viewModalData.owner.email}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                      OWNER
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                    No primary owner account bound. Use "Invite Owner" to generate credentials.
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewModalData(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT METADATA */}
        {editModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleEditSubmit} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Edit Institution Information</h3>
                <button type="button" onClick={() => setEditModalData(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 py-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institution Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editModalData.name}
                    onChange={e => setEditModalData({ ...editModalData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Institution Type</label>
                    <select
                      value={editModalData.type}
                      onChange={e => setEditModalData({ ...editModalData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="SCHOOL">SCHOOL</option>
                      <option value="COLLEGE">COLLEGE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={editModalData.status}
                      onChange={e => setEditModalData({ ...editModalData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={editModalData.email}
                      onChange={e => setEditModalData({ ...editModalData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={editModalData.phone}
                      onChange={e => setEditModalData({ ...editModalData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editModalData.address}
                    onChange={e => setEditModalData({ ...editModalData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editModalData.city}
                      onChange={e => setEditModalData({ ...editModalData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editModalData.state}
                      onChange={e => setEditModalData({ ...editModalData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={editModalData.pincode}
                      onChange={e => setEditModalData({ ...editModalData, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editModalData.website}
                    onChange={e => setEditModalData({ ...editModalData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: CHANGE SUBSCRIPTION */}
        {subModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleSubSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manage Subscription</h3>
                  <p className="text-xs text-slate-500 font-semibold">{subModalData.name}</p>
                </div>
                <button type="button" onClick={() => setSubModalData(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Select SaaS Plan</label>
                  <select
                    value={subModalData.newPlanId}
                    onChange={e => setSubModalData({ ...subModalData, newPlanId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{Number(p.price).toLocaleString()} / {p.billingCycle.toLowerCase()} (Max {p.maxStudents} students)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Extend License Duration</label>
                  <select
                    value={subModalData.extendMonths}
                    onChange={e => setSubModalData({ ...subModalData, extendMonths: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="1">Extend by 1 Month</option>
                    <option value="3">Extend by 3 Months (Quarterly)</option>
                    <option value="6">Extend by 6 Months</option>
                    <option value="12">Extend by 12 Months (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Subscription Status</label>
                  <select
                    value={subModalData.status}
                    onChange={e => setSubModalData({ ...subModalData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Apply Subscription
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: INVITE / ACTIVATE OWNER */}
        {inviteModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Send className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">Institution Owner Activation</h3>
                </div>
                <button onClick={() => setInviteModalData(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-xs">
                <p className="text-slate-600">
                  A cryptographic onboarding token has been generated for <strong>{inviteModalData.institution.name}</strong>. Share this invitation link with the Institutional Owner to configure their account.
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl break-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Activation Link</span>
                  <span className="font-mono text-indigo-600 font-semibold text-xs select-all">{inviteModalData.activationLink}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Security Token</span>
                  <span className="font-mono text-slate-800 text-xs font-bold select-all">{inviteModalData.token}</span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Token expires on {new Date(inviteModalData.expiresAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteModalData.activationLink);
                    showToast('Activation link copied to clipboard');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setInviteModalData(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SUSPEND / STATUS CONFIRMATION */}
        {statusModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Suspend Institution</h3>
                  <p className="text-xs text-slate-500 font-semibold">{statusModalData.name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Suspending this institution will immediately block access for all student, teacher, staff, and institutional admin accounts under this tenant. Are you sure you wish to proceed?
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setStatusModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(statusModalData.id, 'SUSPENDED')}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

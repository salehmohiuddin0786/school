'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bell, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function NoticesAdminPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    body: '',
    role: 'all',
    importance: '1',
  });

  const loadNotices = () => {
    setLoading(true);
    fetch('/api/admin/notices')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setNotices(d.notices);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || data.message || 'Failed to publish notice');
      }

      setMessage('Notice published successfully!');
      setTimeout(() => setMessage(''), 3000);
      setModalOpen(false);
      setForm({ title: '', body: '', role: 'all', importance: '1' });
      loadNotices();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await fetch(`/api/admin/notices?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('Notice removed.');
        setTimeout(() => setMessage(''), 3000);
        loadNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Noticeboard</h2>
            <p className="text-sm text-slate-500">Publish public announcements, circulars, and target audience alerts.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Notices Cards */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            Loading announcements...
          </div>
        ) : notices.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            No notices on the board.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notices.map((n) => (
              <div key={n.s_no} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700">
                      Audience: {n.role || 'All'}
                    </span>
                    <button
                      onClick={() => handleDelete(n.s_no)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{n.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                  <span>Posted by {n.sender_id}</span>
                  <span>{new Date(n.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Notice */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Publish Campus Notice</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePostNotice} className="space-y-4 text-sm">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notice Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Sports Meet 2026 Registration"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notice Content *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide circular details..."
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Audience</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="all">All School (Staff, Students & Parents)</option>
                    <option value="student">Students & Parents Only</option>
                    <option value="teacher">Faculty & Staff Only</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Publish Notice</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

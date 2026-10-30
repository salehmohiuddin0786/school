'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bell, 
  Calendar, 
  ExternalLink, 
  Search 
} from 'lucide-react';

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data.status === 'success') {
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              School Circulars & Notices
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Official school announcements, examination schedules, holiday circulars, and events.
            </p>
          </div>
          <div className="bg-violet-50 text-violet-900 border border-violet-200/60 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-sm">
            <Bell className="w-4 h-4 text-violet-600" />
            <span>{notices.length} Active Circulars</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 outline-none placeholder-slate-400"
          />
        </div>

        {/* Notices Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading student circulars...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-slate-200/80 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No circulars published</h3>
              <p className="text-xs text-slate-400 mt-1">Check back later for school administration updates.</p>
            </div>
          ) : (
            filteredNotices.map((n) => (
              <div
                key={n.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-violet-200 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      n.priority === 'HIGH' || n.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200/60'
                        : 'bg-violet-50 text-violet-700 border border-violet-200/60'
                    }`}>
                      {n.priority || 'NORMAL'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> Published {n.publishedAt}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    By: {n.author}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{n.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{n.content}</p>

                {n.attachmentUrl && (
                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-violet-700 font-bold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Official Attachment / Document
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

'use client';
import Link from 'next/link';
import { School, ArrowLeft, Home, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <School className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
            Error 404 &bull; Resource Unreachable
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            The institutional destination you requested does not exist, has been archived, or requires role-authorized credentials.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <Home className="w-4 h-4" />
            <span>Return to Portal</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="pt-6 border-t border-white/10 text-[11px] text-slate-500">
          SchoolNext ERP Multi-Tenant SaaS Platform &bull; Enterprise Reliability
        </div>
      </div>
    </div>
  );
}

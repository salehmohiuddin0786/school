'use client';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, GraduationCap, ShieldCheck, Phone, BookOpen } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent block">
              Digital Crowd
            </span>
            <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase block">
              School Management System
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
          <Link href="#portals" className="hover:text-indigo-600 transition-colors">Portals</Link>
          <Link href="#about" className="hover:text-indigo-600 transition-colors">About</Link>
          <Link href="#contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Portal Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

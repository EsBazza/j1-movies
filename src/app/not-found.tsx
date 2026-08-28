import React from 'react';
import Link from 'next/link';
import { Film, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-20">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shadow-2xl shadow-red-950/50">
          <Film className="w-12 h-12 text-red-500" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-red-600/20 blur-xl pointer-events-none -z-10" />
      </div>

      <span className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">
        Error 404
      </span>

      <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
        Page Not Found
      </h1>

      <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
        The movie, series, or page you were looking for doesn&apos;t exist or may have been moved.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 transition-all hover:scale-105"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/movies"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm border border-zinc-700 transition-colors"
        >
          <span>Browse Movies</span>
        </Link>
      </div>
    </div>
  );
}

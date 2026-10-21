'use client';

import React, { useEffect, useState } from 'react';
import { Key, ExternalLink, WifiOff, RefreshCw } from 'lucide-react';

/**
 * Shown when a page couldn't load TMDB data. Asks the proxy whether credentials are
 * configured so we only show API-key setup steps when that's actually the problem.
 */
export function ApiKeyWarning() {
  const [reason, setReason] = useState<'checking' | 'missing-key' | 'unreachable'>('checking');

  useEffect(() => {
    let ignore = false;
    fetch('/api/tmdb/genre/movie/list')
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!ignore) setReason(res.status === 503 && body?.error === 'TMDB_NOT_CONFIGURED' ? 'missing-key' : 'unreachable');
      })
      .catch(() => !ignore && setReason('unreachable'));
    return () => {
      ignore = true;
    };
  }, []);

  if (reason === 'checking') return <div className="min-h-[50vh]" />;

  if (reason === 'unreachable') {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 mt-24 text-center" role="alert">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <WifiOff className="w-7 h-7 text-zinc-300" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white">Couldn&apos;t load titles</h2>
        <p className="text-sm text-zinc-400 mt-1">TMDB isn&apos;t responding right now. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 mt-20" role="alert">
      <div className="rounded-2xl bg-zinc-900/90 p-6 md:p-8 text-center sm:text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Key className="w-7 h-7 text-accent" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">TMDB API key required</h2>
            <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
              Add <code className="bg-surface-3 text-accent px-2 py-0.5 rounded text-xs">TMDB_API_KEY</code> or{' '}
              <code className="bg-surface-3 text-accent px-2 py-0.5 rounded text-xs">TMDB_READ_ACCESS_TOKEN</code> to{' '}
              <code className="bg-surface-3 text-accent px-2 py-0.5 rounded text-xs">.env.local</code> (or your Vercel project
              settings) and restart the server.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Step 1: Sign up at TMDB &rarr; Step 2: Generate an API key in Settings &rarr; Step 3: Add it as a server env var
          </div>
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-semibold text-xs transition-colors shadow-lg"
          >
            <span>Get a free TMDB key</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

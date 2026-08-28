'use client';

import React from 'react';
import { AlertCircle, Key, ExternalLink } from 'lucide-react';

export function ApiKeyWarning() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 mt-20">
      <div className="rounded-2xl bg-zinc-900/90 border border-red-500/30 p-6 md:p-8 text-center sm:text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Key className="w-7 h-7 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <span>TMDB API Key Required</span>
            </h3>
            <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
              To fetch movies, TV series, backdrops, and cast information, please add your free TMDB API key to <code className="bg-zinc-800 text-red-400 px-2 py-0.5 rounded text-xs">.env.local</code>.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Step 1: Sign up at TMDB &rarr; Step 2: Generate API key in Settings &rarr; Step 3: Add to <code className="text-zinc-300">.env.local</code>
          </div>
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-600/30"
          >
            <span>Get Free TMDB Key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-24" role="alert">
      <AlertTriangle className="w-10 h-10 text-accent mb-4" aria-hidden="true" />
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Something went wrong</h1>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">This page hit an unexpected error. You can try again or head back home.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
        <Link href="/" className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors">
          Return home
        </Link>
      </div>
    </div>
  );
}

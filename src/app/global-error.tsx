'use client';

// Replaces the root layout when it fails, so it must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f1014', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
        <main
          role="alert"
          style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, textAlign: 'center' }}
        >
          <h1 style={{ fontSize: 28, margin: 0 }}>J1 Movies is having trouble</h1>
          <p style={{ color: '#a1a1aa', margin: 0 }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 12, padding: '10px 24px', borderRadius: 9999, border: 0, background: '#e50914', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

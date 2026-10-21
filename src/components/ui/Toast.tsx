'use client';

import { useSyncExternalStore } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'info';
  action?: { label: string; onClick: () => void };
}

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Shows a short-lived notification, optionally with an action such as "Undo". */
export function toast(
  message: string,
  options: { tone?: ToastItem['tone']; action?: ToastItem['action']; duration?: number } = {}
) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, tone: options.tone ?? 'success', action: options.action }];
  emit();
  setTimeout(() => dismiss(id), options.duration ?? (options.action ? 6000 : 3000));
}

const EMPTY: ToastItem[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY
  );

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed inset-x-0 bottom-24 md:bottom-6 z-[var(--z-toast)] flex flex-col items-center gap-2 px-4 pointer-events-none"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 max-w-md w-full sm:w-auto pl-4 pr-2 py-2.5 rounded-full bg-surface-2/95 backdrop-blur-xl shadow-2xl text-sm text-white animate-slide-up"
        >
          {t.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1 min-w-0 truncate">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id);
              }}
              className="px-3 py-1 rounded-full text-xs font-bold text-accent hover:bg-white/10 transition-colors"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

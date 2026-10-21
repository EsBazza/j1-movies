'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible description shown under the title */
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** `center` dialog, right-side `drawer`, full-screen `sheet`, or mobile `bottom` sheet */
  variant?: 'center' | 'drawer' | 'sheet' | 'bottom';
  /** Hide the built-in header (the content must then provide its own close control) */
  hideHeader?: boolean;
}

// Ref-counted scroll lock so stacked overlays don't unlock the page early.
let scrollLocks = 0;
function lockScroll() {
  if (scrollLocks++ === 0) document.documentElement.style.overflow = 'hidden';
}
function unlockScroll() {
  if (--scrollLocks <= 0) {
    scrollLocks = 0;
    document.documentElement.style.overflow = '';
  }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  variant = 'center',
  hideHeader = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();

    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first || dialog)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[var(--z-overlay)] flex',
        variant === 'center' && 'items-center justify-center p-4 sm:p-6 md:p-10',
        variant === 'drawer' && 'justify-end',
        variant === 'sheet' && 'items-stretch',
        variant === 'bottom' && 'items-end'
      )}
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex flex-col bg-surface-1 text-zinc-100 shadow-2xl outline-none',
          variant === 'center' &&
            'w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-panel p-6 animate-scale-in',
          variant === 'drawer' &&
            'h-full w-full max-w-md overflow-hidden p-5 sm:p-6 animate-slide-in-right',
          variant === 'sheet' && 'w-full h-full overflow-y-auto p-4 sm:p-6 animate-fade-in',
          variant === 'bottom' &&
            'w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up',
          className
        )}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 pb-2 mb-4 flex-shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-xs text-zinc-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCloseRef.current()}
              className="p-2 -m-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className={cn('relative', variant === 'drawer' && 'flex-1 min-h-0 flex flex-col')}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

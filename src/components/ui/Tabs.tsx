'use client';

import React, { useId, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}

/**
 * Accessible tab list (WAI-ARIA tabs pattern): roving tabindex, arrow/Home/End keys,
 * animated accent underline. Pair panels with `tabPanelProps(id)`.
 */
export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAt = (index: number) => {
    const i = (index + items.length) % items.length;
    refs.current[i]?.focus();
    onChange(items[i].id);
  };

  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 overflow-x-auto no-scrollbar', className)}>
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={`${baseId}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`tabpanel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') focusAt(index + 1);
              else if (e.key === 'ArrowLeft') focusAt(index - 1);
              else if (e.key === 'Home') focusAt(0);
              else if (e.key === 'End') focusAt(items.length - 1);
              else return;
              e.preventDefault();
            }}
            className={cn(
              'relative h-11 px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200',
              selected ? 'text-white' : 'text-muted hover:text-white'
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="ml-1.5 text-xs text-subtle">{item.count}</span>}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-3 right-3 bottom-1 h-0.5 rounded-full bg-accent origin-center transition-transform duration-300 ease-out-expo',
                selected ? 'scale-x-100' : 'scale-x-0'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(id: string) {
  return { role: 'tabpanel' as const, id: `tabpanel-${id}`, tabIndex: 0 };
}

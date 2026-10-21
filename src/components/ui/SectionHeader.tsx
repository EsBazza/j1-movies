import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  id?: string;
  /** Optional small line under the title */
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

/** One heading style for every row/section on the site. */
export function SectionHeader({ title, id, subtitle, href, linkLabel = 'See all', className, children }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-4 sm:mb-6', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
          {title}
        </h2>
        {subtitle && <p className="text-xs sm:text-sm text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
      {children}
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-muted hover:text-white transition-colors flex-shrink-0"
        >
          {linkLabel}
          <span className="sr-only"> {title}</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

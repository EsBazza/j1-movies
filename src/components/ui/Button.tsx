import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  // Solid, follows the title's dynamic accent; text colour picked for contrast
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  // Translucent neutral
  secondary: 'bg-white/12 text-white hover:bg-white/20 backdrop-blur-md',
  ghost: 'text-zinc-200 hover:text-white hover:bg-white/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-[15px]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant = 'primary', size = 'md', className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: icon-only controls need an accessible name */
  'aria-label': string;
  variant?: Exclude<Variant, 'primary'> | 'solid';
  size?: Size;
};

const iconSizes: Record<Size, string> = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-12 h-12' };

export function IconButton({ variant = 'secondary', size = 'md', className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full flex-shrink-0 transition-[background-color,color,transform] duration-200 active:scale-[0.94] disabled:opacity-50',
        variant === 'solid' ? 'bg-accent text-on-accent hover:bg-accent-hover' : variants[variant],
        iconSizes[size],
        className
      )}
      {...props}
    />
  );
}

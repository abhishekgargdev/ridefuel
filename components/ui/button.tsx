import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-md',
      amber: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
      outline: 'border border-slate-700 hover:border-amber-500/60 bg-transparent hover:bg-slate-800 text-slate-200',
      danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md',
      ghost: 'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-slate-100',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-4 py-2 rounded-xl gap-2',
      lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
      icon: 'p-2 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

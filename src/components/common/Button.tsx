import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  iconLeft,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs space-x-1',
    sm: 'px-3 py-1.5 text-xs sm:text-sm space-x-1.5',
    md: 'px-4 py-2 text-sm space-x-2',
    lg: 'px-5 py-2.5 text-base space-x-2.5',
    xl: 'px-6 py-3.5 text-lg space-x-3',
  };

  const variantClasses = {
    primary:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 focus-visible:ring-rose-500',
    secondary:
      'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 focus-visible:ring-slate-500',
    outline:
      'border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-slate-400',
    ghost:
      'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-slate-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 focus-visible:ring-red-500',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 focus-visible:ring-emerald-500',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        iconLeft && <span>{iconLeft}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconRight && <span>{iconRight}</span>}
    </button>
  );
};

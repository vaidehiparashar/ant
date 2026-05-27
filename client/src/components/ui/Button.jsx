import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  disabled, 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border border-border text-text-primary hover:border-text-muted hover:bg-surface',
    ghost: 'text-text-muted hover:text-text-primary hover:bg-surface',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, variants[variant], sizes[size]), className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

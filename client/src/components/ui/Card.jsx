import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Card({ children, className, ...props }) {
  return (
    <div 
      className={twMerge(
        clsx(
          'bg-surface border border-border rounded-xl p-5 shadow-sm transition-all hover:shadow-glow'
        ),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

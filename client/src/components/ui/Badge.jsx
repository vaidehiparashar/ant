import { clsx } from 'clsx';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-surface text-text-primary border border-border',
    success: 'bg-secondary/10 text-secondary border border-secondary/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    primary: 'bg-primary/10 text-primary border border-primary/20',
  };

  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

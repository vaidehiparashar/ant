import { clsx } from 'clsx';

export default function Avatar({ src, alt, size = 'md', className, initials }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  return (
    <div className={clsx('relative rounded-full overflow-hidden bg-border flex items-center justify-center flex-shrink-0', sizes[size], className)}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-text-primary uppercase">
          {initials || alt?.charAt(0) || '?'}
        </span>
      )}
    </div>
  );
}

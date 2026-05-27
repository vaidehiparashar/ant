import { Bell } from 'lucide-react';
import { useState } from 'react';

export default function NotificationBell() {
  const [hasUnread, setHasUnread] = useState(true);

  return (
    <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors focus:outline-none">
      <Bell className="w-5 h-5" />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface"></span>
      )}
    </button>
  );
}

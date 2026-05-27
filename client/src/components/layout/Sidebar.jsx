import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, Users, Calendar, DollarSign, Award, Settings, UserPlus, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { ROLES } from '../../constants';

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);

  const getLinks = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
          { to: '/admin/users', label: 'Users', icon: Users },
          { to: '/admin/audit', label: 'Audit Log', icon: FileText },
          { to: '/admin/settings', label: 'Settings', icon: Settings },
        ];
      case ROLES.HR:
        return [
          { to: '/hr/dashboard', label: 'Dashboard', icon: Home },
          { to: '/hr/employees', label: 'Employees', icon: Users },
          { to: '/hr/attendance', label: 'Attendance', icon: Calendar },
          { to: '/hr/payroll', label: 'Payroll', icon: DollarSign },
          { to: '/hr/interns', label: 'Interns', icon: UserPlus },
          { to: '/hr/org-health', label: 'Org Health', icon: FileText },
        ];
      case ROLES.EMPLOYEE:
        return [
          { to: '/employee/dashboard', label: 'Dashboard', icon: Home },
          { to: '/employee/attendance', label: 'Attendance', icon: Calendar },
          { to: '/employee/leaves', label: 'Leaves', icon: Calendar },
          { to: '/employee/payslips', label: 'Payslips', icon: DollarSign },
          { to: '/employee/performance', label: 'Performance', icon: Award },
          { to: '/employee/recognitions', label: 'Recognitions', icon: Award },
        ];
      case ROLES.INTERN:
        return [
          { to: '/intern/dashboard', label: 'Dashboard', icon: Home },
          { to: '/intern/status', label: 'My Status', icon: FileText },
          { to: '/intern/goals', label: 'Goals', icon: Award },
          { to: '/intern/feedback', label: 'Feedback', icon: Award },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="font-display text-2xl text-primary">antHR</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-background hover:text-text-primary'
                )
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-primary font-medium text-sm">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

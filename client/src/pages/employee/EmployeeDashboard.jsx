import React from 'react';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

export default function EmployeeDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display text-primary">Welcome, {user?.name || user?.email}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Today's Status</h3>
          <p className="text-2xl mt-2 font-display text-secondary">Checked In</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Leave Balance</h3>
          <p className="text-2xl mt-2 font-display text-text-primary">12 Days</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Performance Score</h3>
          <p className="text-2xl mt-2 font-display text-primary">88/100</p>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-medium mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors">
            Check In Now
          </button>
          <button className="bg-surface border border-border text-text-primary px-4 py-2 rounded-md hover:border-text-muted transition-colors">
            Apply Leave
          </button>
        </div>
      </div>
    </div>
  );
}

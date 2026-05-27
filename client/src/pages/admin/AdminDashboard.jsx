import React from 'react';
import Card from '../../components/ui/Card';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display text-primary">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Total Users</h3>
          <p className="text-3xl mt-2 font-display text-text-primary">150</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">System Status</h3>
          <p className="text-3xl mt-2 font-display text-secondary">Healthy</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Recent Logins</h3>
          <p className="text-3xl mt-2 font-display text-text-primary">45 Today</p>
        </Card>
      </div>
    </div>
  );
}

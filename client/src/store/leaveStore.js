import { create } from 'zustand';
import * as api from '../services/api';

export const useLeaveStore = create((set) => ({
  myLeaves: [],
  pendingLeaves: [],
  balance: {},
  loading: false,
  error: null,

  applyLeave: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.applyLeave(data);
      set((state) => ({ myLeaves: [res.data, ...state.myLeaves], loading: false }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMyLeaves: async () => {
    set({ loading: true, error: null });
    const myMockLeaves = [
      { id: 'l1', type: 'Sick Leave', startDate: '2026-05-10', endDate: '2026-05-12', status: 'approved', reason: 'Flu' },
      { id: 'l2', type: 'Annual Leave', startDate: '2026-08-01', endDate: '2026-08-10', status: 'pending', reason: 'Vacation' }
    ];
    setTimeout(() => {
      set({ myLeaves: myMockLeaves, loading: false });
    }, 400);
  },

  fetchPendingLeaves: async () => {
    set({ loading: true, error: null });
    const mockPending = [
      { id: 'pl1', userName: 'John Smith', type: 'Annual Leave', startDate: '2026-06-15', endDate: '2026-06-20', reason: 'Family trip', status: 'pending' },
      { id: 'pl2', userName: 'Emma Johnson', type: 'Sick Leave', startDate: '2026-05-28', endDate: '2026-05-29', reason: 'Fever', status: 'pending' },
      { id: 'pl3', userName: 'Michael Davis', type: 'Casual Leave', startDate: '2026-06-05', endDate: '2026-06-05', reason: 'Personal work', status: 'pending' },
      { id: 'pl4', userName: 'Sarah Wilson', type: 'Maternity Leave', startDate: '2026-07-01', endDate: '2026-10-01', reason: 'Maternity', status: 'pending' },
      { id: 'pl5', userName: 'David Miller', type: 'Annual Leave', startDate: '2026-08-10', endDate: '2026-08-20', reason: 'Europe trip', status: 'pending' },
      { id: 'pl6', userName: 'Olivia Taylor', type: 'Sick Leave', startDate: '2026-05-30', endDate: '2026-05-31', reason: 'Migraine', status: 'pending' }
    ];
    setTimeout(() => {
      set({ pendingLeaves: mockPending, loading: false });
    }, 600);
  },

  approveLeave: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.approveLeave(id);
      set((state) => ({ 
        pendingLeaves: state.pendingLeaves.filter(l => l.id !== id),
        loading: false 
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  rejectLeave: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      await api.rejectLeave(id, reason);
      set((state) => ({ 
        pendingLeaves: state.pendingLeaves.filter(l => l.id !== id),
        loading: false 
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchBalance: async (uid) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getLeaveBalance(uid);
      set({ balance: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

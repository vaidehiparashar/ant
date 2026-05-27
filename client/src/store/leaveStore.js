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
    try {
      const res = await api.getMyLeaves();
      set({ myLeaves: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPendingLeaves: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getPendingLeaves();
      set({ pendingLeaves: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
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

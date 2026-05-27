import { create } from 'zustand';
import * as api from '../services/api';

export const usePayrollStore = create((set) => ({
  allPayroll: [],
  myPayroll: [],
  loading: false,
  error: null,

  fetchAllPayroll: async (month, year) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getAllPayroll(month, year);
      set({ allPayroll: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMyPayroll: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getMyPayroll();
      set({ myPayroll: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  generatePayroll: async (uid) => {
    set({ loading: true, error: null });
    try {
      const res = await api.generatePayroll(uid);
      set((state) => ({
        allPayroll: state.allPayroll.map(p => p.uid === uid ? res.data : p),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  markPaid: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.markPaid(id);
      set((state) => ({
        allPayroll: state.allPayroll.map(p => p.id === id ? res.data : p),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

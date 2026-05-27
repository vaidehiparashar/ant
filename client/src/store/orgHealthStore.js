import { create } from 'zustand';
import * as api from '../services/api';

export const useOrgHealthStore = create((set) => ({
  health: {},
  loading: false,
  error: null,

  fetchOrgHealth: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getOrgHealth();
      set({ health: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  calculateOrgHealth: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.calculateOrgHealth();
      set({ health: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

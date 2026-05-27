import { create } from 'zustand';
import * as api from '../services/api';

export const usePerformanceStore = create((set) => ({
  records: [],
  currentScore: null,
  loading: false,
  error: null,

  fetchPerformance: async (uid) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getPerformance(uid);
      set({ records: res.data.records || [], currentScore: res.data.currentScore, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  calculatePerformance: async (uid, taskScore) => {
    set({ loading: true, error: null });
    try {
      const res = await api.calculatePerformance(uid, taskScore);
      set({ currentScore: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getAIReview: async (uid) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getAIReview(uid);
      set({ loading: false });
      return res.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  publishReview: async (id, finalReview) => {
    set({ loading: true, error: null });
    try {
      const res = await api.publishReview(id, finalReview);
      set((state) => ({
        records: state.records.map(r => r.id === id ? res.data : r),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

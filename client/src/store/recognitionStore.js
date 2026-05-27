import { create } from 'zustand';
import * as api from '../services/api';

export const useRecognitionStore = create((set) => ({
  received: [],
  leaderboard: [],
  loading: false,
  error: null,

  sendRecognition: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.sendRecognition(data);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLeaderboard: async (month, year) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getLeaderboard(month, year);
      set({ leaderboard: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMyRecognitions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getMyRecognitions();
      set({ received: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

import { create } from 'zustand';
import * as api from '../services/api';

export const useAttendanceStore = create((set) => ({
  myAttendance: [],
  teamAttendance: [],
  todayRecord: null,
  stats: null,
  loading: false,
  error: null,

  checkIn: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.checkIn();
      set({ todayRecord: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  checkOut: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.checkOut();
      set({ todayRecord: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMyAttendance: async (month, year) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getMyAttendance(month, year);
      set({ myAttendance: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTeamAttendance: async (month, year, dept) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getTeamAttendance(month, year, dept);
      set({ teamAttendance: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStats: async (uid, month, year) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getAttendanceStats(uid, month, year);
      set({ stats: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

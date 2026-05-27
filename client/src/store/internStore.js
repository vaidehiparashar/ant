import { create } from 'zustand';
import * as api from '../services/api';

export const useInternStore = create((set) => ({
  interns: [],
  loading: false,
  error: null,

  fetchInterns: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getInterns();
      set({ interns: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createIntern: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.createIntern(data);
      set((state) => ({ interns: [res.data, ...state.interns], loading: false }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateStage: async (id, stage) => {
    set({ loading: true, error: null });
    try {
      const res = await api.updateInternStage(id, stage);
      set((state) => ({
        interns: state.interns.map(i => i.id === id ? res.data : i),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateIntern: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.updateIntern(id, data);
      set((state) => ({
        interns: state.interns.map(i => i.id === id ? res.data : i),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  deleteIntern: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteIntern(id);
      set((state) => ({
        interns: state.interns.filter(i => i.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

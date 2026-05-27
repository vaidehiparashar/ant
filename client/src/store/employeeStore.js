import { create } from 'zustand';
import * as api from '../services/api';

export const useEmployeeStore = create((set) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getEmployees();
      set({ employees: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchEmployee: async (uid) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getEmployee(uid);
      set({ selectedEmployee: res.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateEmployee: async (uid, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.updateEmployee(uid, data);
      set((state) => ({ 
        employees: state.employees.map(e => e.id === uid ? res.data : e),
        selectedEmployee: state.selectedEmployee?.id === uid ? res.data : state.selectedEmployee,
        loading: false 
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  deactivateEmployee: async (uid) => {
    set({ loading: true, error: null });
    try {
      await api.deactivateEmployee(uid);
      set((state) => ({ 
        employees: state.employees.map(e => e.id === uid ? { ...e, status: 'inactive' } : e),
        loading: false 
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

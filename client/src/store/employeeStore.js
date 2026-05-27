import { create } from 'zustand';
import * as api from '../services/api';

export const useEmployeeStore = create((set) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    
    // Generate 100 mock employees for the presentation
    const mockEmployees = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Olivia', 'William', 'Sophia', 'James', 'Isabella', 'Daniel', 'Mia', 'Matthew', 'Charlotte', 'Joseph', 'Amelia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];
    const departments = ['Engineering', 'Design', 'Human Resources', 'Management', 'Sales', 'Marketing', 'Customer Support', 'Finance'];
    const roles = ['employee', 'employee', 'employee', 'intern', 'hr', 'admin'];
    const statuses = ['active', 'active', 'active', 'active', 'inactive'];

    for (let i = 1; i <= 100; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      mockEmployees.push({
        id: `mock-user-${i}`,
        name: `${fName} ${lName}`,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@anthr.com`,
        role: roles[Math.floor(Math.random() * roles.length)],
        department: departments[Math.floor(Math.random() * departments.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        joinDate: new Date(Date.now() - Math.random() * 100000000000).toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${fName}+${lName}&background=random`,
        basicSalary: Math.floor(Math.random() * 90000) + 40000
      });
    }

    setTimeout(() => {
      set({ employees: mockEmployees, loading: false });
    }, 600);
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

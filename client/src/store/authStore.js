import { create } from 'zustand';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import * as api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: false,
  error: null,
  
  setUser: (user, role) => set({ user, role }),
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      const res = await api.getMe();
      set({ user: res.data.user, role: res.data.user.role, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      const res = await api.getMe();
      set({ user: res.data.user, role: res.data.user.role, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  logout: async () => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      await signOut(auth);
      set({ user: null, role: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getMe();
      set({ user: res.data.user, role: res.data.user.role, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

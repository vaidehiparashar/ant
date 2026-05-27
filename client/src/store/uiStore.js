import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  toast: { text: '', type: 'info', visible: false },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  openModal: (modalName) => set({ activeModal: modalName }),
  
  closeModal: () => set({ activeModal: null }),
  
  showToast: (text, type = 'info') => {
    set({ toast: { text, type, visible: true } });
    setTimeout(() => {
      set({ toast: { text: '', type: 'info', visible: false } });
    }, 4000);
  },
  
  hideToast: () => set({ toast: { text: '', type: 'info', visible: false } })
}));

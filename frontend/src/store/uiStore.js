import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * UI store for global ephemeral state:
 * - sidebar collapsed state
 * - active task panel
 * - toast notifications
 * - appearance settings (persisted)
 */
export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      activePanelTaskId: null,
      projectModalOpen: false,
      theme: 'light',
      density: 'comfortable',
      toasts: [],

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },

      setDensity: (density) => {
        set({ density })
        document.documentElement.setAttribute('data-density', density)
      },

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

      openTaskPanel: (taskId) => set({ activePanelTaskId: taskId }),
      closeTaskPanel: () => set({ activePanelTaskId: null }),
      setProjectModalOpen: (open) => set({ projectModalOpen: open }),

      addToast: (toast) => {
        const id = crypto.randomUUID()
        set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
        setTimeout(() => get().removeToast(id), toast.duration ?? 4000)
        return id
      },

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      toast: {
        success: (message) =>
          get().addToast({ type: 'success', message }),
        error: (message) =>
          get().addToast({ type: 'error', message, duration: 6000 }),
        info: (message) =>
          get().addToast({ type: 'info', message }),
      },
    }),
    {
      name: 'ui-settings',
      partialize: (state) => ({ 
        theme: state.theme, 
        density: state.density,
        sidebarCollapsed: state.sidebarCollapsed 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme)
          document.documentElement.setAttribute('data-density', state.density)
        }
      }
    }
  )
)

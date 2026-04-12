import { create } from 'zustand';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  createdAt: number;
  isRead: boolean;
  source: 'system' | 'staff' | 'ai';
}

interface AlertState {
  alerts: Alert[];
  isNotifPanelOpen: boolean;
  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isRead'>) => void;
  resolveAlert: (id: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  toggleNotifPanel: () => void;
  setNotifPanelOpen: (open: boolean) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [
    {
      id: 'sys-1',
      title: 'High Density – East Stand',
      body: 'East 1 section is at 95% capacity. Recommend diverting fans to West 1.',
      severity: 'critical',
      createdAt: Date.now() - 120000,
      isRead: false,
      source: 'system',
    },
    {
      id: 'sys-2',
      title: 'Gate C – Long Queue',
      body: 'Wait time at Gate C has exceeded 30 minutes. Best alternative: Gate B.',
      severity: 'warning',
      createdAt: Date.now() - 60000,
      isRead: false,
      source: 'system',
    },
  ],
  isNotifPanelOpen: false,

  addAlert: (alertData) =>
    set((state) => ({
      alerts: [
        {
          ...alertData,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
          isRead: false,
        },
        ...state.alerts,
      ].slice(0, 50), // max 50 alerts
    })),

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  markRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    })),

  markAllRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, isRead: true })),
    })),

  toggleNotifPanel: () => set((state) => ({ isNotifPanelOpen: !state.isNotifPanelOpen })),
  setNotifPanelOpen: (open) => set({ isNotifPanelOpen: open }),
}));

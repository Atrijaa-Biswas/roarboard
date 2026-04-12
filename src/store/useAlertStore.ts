import { create } from 'zustand';

interface AlertState {
  alerts: any[];
}

export const useAlertStore = create<AlertState>((_set) => ({
  alerts: [],
}));

import { create } from 'zustand';

export interface SectionData {
  name: string;
  capacity: number;
  currentCount: number;
  density: number; // 0 to 100
  updatedAt: number;
}

export interface GateData {
  name: string;
  waitMinutes: number;
  status: 'low' | 'medium' | 'high';
  updatedAt: number;
}

export interface TickerItem {
  text: string;
  priority: number;
  createdAt: number;
}

interface VenueState {
  sections: Record<string, SectionData>;
  gates: Record<string, GateData>;
  stalls: Record<string, any>;
  ticker: TickerItem[];
  setSections: (sections: Record<string, SectionData>) => void;
  setGates: (gates: Record<string, GateData>) => void;
  setTicker: (ticker: TickerItem[]) => void;
}

const initialSections: Record<string, SectionData> = {
  n1: { name: 'North 1', capacity: 5000, currentCount: 4100, density: 82, updatedAt: Date.now() },
  s1: { name: 'South 1', capacity: 5000, currentCount: 2000, density: 40, updatedAt: Date.now() },
  e1: { name: 'East 1', capacity: 8000, currentCount: 7600, density: 95, updatedAt: Date.now() },
  w1: { name: 'West 1', capacity: 8000, currentCount: 3000, density: 37, updatedAt: Date.now() },
};

const initialGates: Record<string, GateData> = {
  gA: { name: 'Gate A', waitMinutes: 12, status: 'medium', updatedAt: Date.now() },
  gB: { name: 'Gate B', waitMinutes: 4, status: 'low', updatedAt: Date.now() },
  gC: { name: 'Gate C', waitMinutes: 35, status: 'high', updatedAt: Date.now() },
  gD: { name: 'Gate D', waitMinutes: 8, status: 'low', updatedAt: Date.now() },
};

const initialTicker: TickerItem[] = [
  { text: 'Welcome to RoarBoard! Secure, Smart, Instantly Responsive.', priority: 1, createdAt: Date.now() },
  { text: 'Current Wait Time at Gate C is High. Please divert to Gate B or D.', priority: 2, createdAt: Date.now() },
];

export const useVenueStore = create<VenueState>((set) => ({
  sections: initialSections,
  gates: initialGates,
  stalls: {},
  ticker: initialTicker,
  setSections: (sections) => set({ sections }),
  setGates: (gates) => set({ gates }),
  setTicker: (ticker) => set({ ticker }),
}));

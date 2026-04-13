import { create } from 'zustand';

export interface SectionData {
  name: string;
  capacity: number;
  currentCount: number;
  density: number; // 0 to 100
  updatedAt: number;
  trend?: 'stable' | 'increasing' | 'decreasing';
  rate?: number;
  confidence?: number;
  history?: { time: number; val: number }[];
}

export interface GateData {
  name: string;
  waitMinutes: number;
  status: 'low' | 'medium' | 'high';
  updatedAt: number;
  trend?: 'stable' | 'increasing' | 'decreasing';
  rate?: number;
  confidence?: number;
  history?: { time: number; val: number }[];
}

export interface UserPreferences {
  seatLocation: string;
  accessibleMode: boolean;
  points: number;
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
  userPrefs: UserPreferences;
  activePath: string[];
  isChatOpen: boolean;
  isFocusMode: boolean;
  isFollowMode: boolean;
  setActivePath: (path: string[]) => void;
  setIsChatOpen: (isOpen: boolean) => void;
  setIsFocusMode: (isFocus: boolean) => void;
  setFollowMode: (follow: boolean) => void;
  addPoints: (pts: number) => void;
  setSections: (sections: Record<string, Partial<SectionData>>) => void;
  setGates: (gates: Record<string, Partial<GateData>>) => void;
  setTicker: (ticker: TickerItem[]) => void;
  updateUserPrefs: (prefs: Partial<UserPreferences>) => void;
}

const initialSections: Record<string, SectionData> = {
  n1: { name: 'North 1', capacity: 5000, currentCount: 4100, density: 82, updatedAt: Date.now(), trend: 'increasing', rate: 2.1, confidence: 92, history: [] },
  s1: { name: 'South 1', capacity: 5000, currentCount: 2000, density: 40, updatedAt: Date.now(), trend: 'stable', rate: 0.2, confidence: 88, history: [] },
  e1: { name: 'East 1', capacity: 8000, currentCount: 7600, density: 95, updatedAt: Date.now(), trend: 'decreasing', rate: -1.5, confidence: 95, history: [] },
  w1: { name: 'West 1', capacity: 8000, currentCount: 3000, density: 37, updatedAt: Date.now(), trend: 'stable', rate: -0.1, confidence: 75, history: [] },
};

const initialGates: Record<string, GateData> = {
  gA: { name: 'Gate A', waitMinutes: 12, status: 'medium', updatedAt: Date.now(), trend: 'stable', rate: 0.5, confidence: 85, history: [] },
  gB: { name: 'Gate B', waitMinutes: 4, status: 'low', updatedAt: Date.now(), trend: 'decreasing', rate: -1.2, confidence: 90, history: [] },
  gC: { name: 'Gate C', waitMinutes: 35, status: 'high', updatedAt: Date.now(), trend: 'increasing', rate: 3.4, confidence: 96, history: [] },
  gD: { name: 'Gate D', waitMinutes: 8, status: 'low', updatedAt: Date.now(), trend: 'stable', rate: 0.1, confidence: 82, history: [] },
  gE: { name: 'Gate E', waitMinutes: 44, status: 'high', updatedAt: Date.now(), trend: 'increasing', rate: 1.1, confidence: 92, history: [] },
  gF: { name: 'Gate F', waitMinutes: 1, status: 'low', updatedAt: Date.now(), trend: 'stable', rate: 0.0, confidence: 99, history: [] },
};

// The ONLY valid gate keys — any other keys from Firebase are rejected
const CANONICAL_GATE_KEYS = new Set(['gA', 'gB', 'gC', 'gD', 'gE', 'gF']);

const initialTicker: TickerItem[] = [
  { text: 'Welcome to RoarBoard! Secure, Smart, Instantly Responsive.', priority: 1, createdAt: Date.now() },
  { text: 'Current Wait Time at Gate C is High. Please divert to Gate B or D.', priority: 2, createdAt: Date.now() },
];

export const useVenueStore = create<VenueState>((set) => ({
  sections: initialSections,
  gates: initialGates,
  stalls: {},
  ticker: initialTicker,
  userPrefs: { seatLocation: 'N1-42', accessibleMode: false, points: 1250 },
  activePath: [],
  isChatOpen: false,
  isFocusMode: false,
  isFollowMode: true,
  setActivePath: (path) => set({ activePath: path, isFocusMode: path.length > 0 }),
  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  setIsFocusMode: (isFocus) => set({ isFocusMode: isFocus }),
  setFollowMode: (follow) => set({ isFollowMode: follow }),
  addPoints: (pts) => set((state) => ({ userPrefs: { ...state.userPrefs, points: state.userPrefs.points + pts } })),

  setSections: (sections) => set((state) => {
    const newSections = { ...state.sections };
    const now = Date.now();
    for (const [key, section] of Object.entries(sections)) {
      const old = newSections[key];
      const history = old?.history || [];
      const density = section.density ?? old?.density ?? 0;
      
      const newHistory = [...history, { time: section.updatedAt || now, val: density }].slice(-10);
      
      let rate = old?.rate || 0;
      let trend: 'stable' | 'increasing' | 'decreasing' = old?.trend || 'stable';
      let confidence = old?.confidence || 50;

      if (newHistory.length > 1) {
        const first = newHistory[0];
        const last = newHistory[newHistory.length - 1];
        const timeDiffMins = Math.max((last.time - first.time) / 60000, 1);
        rate = Number(((last.val - first.val) / timeDiffMins).toFixed(1));
        
        if (rate > 1) trend = 'increasing';
        else if (rate < -1) trend = 'decreasing';
        
        // Simulating robust real-world constraints via latency staleness decay
        const staleness = now - last.time;
        confidence = Math.max(10, 100 - Math.floor(staleness / 5000)); 
        if (newHistory.length > 3) Math.min(confidence, 95);
      }

      newSections[key] = {
        ...(old || {}),
        ...section,
        trend, rate, confidence, history: newHistory
      } as SectionData;
    }
    return { sections: newSections };
  }),

  setGates: (gates) => set((state) => {
    const newGates = { ...state.gates };
    const now = Date.now();
    for (const [key, gate] of Object.entries(gates)) {
      // Reject any key that isn't one of the 6 canonical gates
      if (!CANONICAL_GATE_KEYS.has(key)) continue;
      const old = newGates[key];
      const history = old?.history || [];
      const waitMinutes = gate.waitMinutes ?? old?.waitMinutes ?? 0;
      
      const newHistory = [...history, { time: gate.updatedAt || now, val: waitMinutes }].slice(-10);
      
      let rate = old?.rate || 0;
      let trend: 'stable' | 'increasing' | 'decreasing' = old?.trend || 'stable';
      let confidence = old?.confidence || 50;

      if (newHistory.length > 1) {
        const first = newHistory[0];
        const last = newHistory[newHistory.length - 1];
        const timeDiffMins = Math.max((last.time - first.time) / 60000, 1);
        rate = Number(((last.val - first.val) / timeDiffMins).toFixed(1));
        
        if (rate > 0.5) trend = 'increasing';
        else if (rate < -0.5) trend = 'decreasing';
        
        const staleness = now - last.time;
        confidence = Math.max(10, 100 - Math.floor(staleness / 5000));
      }

      newGates[key] = {
        ...(old || {}),
        ...gate,
        trend, rate, confidence, history: newHistory
      } as GateData;
    }
    return { gates: newGates };
  }),

  setTicker: (ticker) => set({ ticker }),
  updateUserPrefs: (prefs) => set((state) => ({ userPrefs: { ...state.userPrefs, ...prefs } }))
}));

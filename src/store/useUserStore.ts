import { create } from 'zustand';

export interface User {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  role: 'attendee' | 'staff' | null;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

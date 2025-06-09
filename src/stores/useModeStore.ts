import { create } from "zustand";

type Mode = 'solo' | 'group' | null;

interface ModeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
}));

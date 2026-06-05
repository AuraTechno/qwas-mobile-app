/**
 * Settings store — local preferences (theme, notifications, etc).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface SettingsState {
  theme: ThemeMode;
  accentColor: string | null;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  setTheme: (v: ThemeMode) => void;
  setAccent: (v: string | null) => void;
  setPush: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setVibrate: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'auto',
      accentColor: null,
      pushEnabled: true,
      soundEnabled: true,
      vibrateEnabled: true,
      setTheme: (v) => set({ theme: v }),
      setAccent: (v) => set({ accentColor: v }),
      setPush: (v) => set({ pushEnabled: v }),
      setSound: (v) => set({ soundEnabled: v }),
      setVibrate: (v) => set({ vibrateEnabled: v }),
    }),
    {
      name: 'qwas-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

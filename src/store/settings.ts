/**
 * Settings store — local preferences (theme, notifications, etc).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type WallpaperId = 'none' | 'aurora' | 'sunset' | 'ocean' | 'forest' | 'dusk' | 'midnight' | 'rose' | 'paper' | 'graphite';

export const WALLPAPERS: { id: WallpaperId; name: string; light: [string, string]; dark: [string, string] }[] = [
  { id: 'none',      name: 'Без фона',     light: ['#ffffff', '#ffffff'], dark: ['#000000', '#000000'] },
  { id: 'aurora',    name: 'Аврора',       light: ['#a8edea', '#fed6e3'], dark: ['#0f0c29', '#302b63'] },
  { id: 'sunset',    name: 'Закат',        light: ['#f6d365', '#fda085'], dark: ['#3a1c71', '#d76d77'] },
  { id: 'ocean',     name: 'Океан',        light: ['#74ebd5', '#9face6'], dark: ['#0f2027', '#2c5364'] },
  { id: 'forest',    name: 'Лес',          light: ['#dce35b', '#45b649'], dark: ['#134e5e', '#71b280'] },
  { id: 'dusk',      name: 'Сумерки',      light: ['#ffdde1', '#ee9ca7'], dark: ['#232526', '#414345'] },
  { id: 'midnight',  name: 'Полночь',      light: ['#243949', '#517fa4'], dark: ['#0f0c29', '#24243e'] },
  { id: 'rose',      name: 'Роза',         light: ['#fad0c4', '#ffd1ff'], dark: ['#373b44', '#4286f4'] },
  { id: 'paper',     name: 'Бумага',       light: ['#fdfcfb', '#e2d1c3'], dark: ['#2c3e50', '#4ca1af'] },
  { id: 'graphite',  name: 'Графит',       light: ['#e6e9f0', '#eef1f5'], dark: ['#232526', '#1c1c1c'] },
];

interface SettingsState {
  theme: ThemeMode;
  accentColor: string | null;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  wallpaper: WallpaperId;
  setTheme: (v: ThemeMode) => void;
  setAccent: (v: string | null) => void;
  setPush: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setVibrate: (v: boolean) => void;
  setWallpaper: (v: WallpaperId) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'auto',
      accentColor: null,
      pushEnabled: true,
      soundEnabled: true,
      vibrateEnabled: true,
      wallpaper: 'none',
      setTheme: (v) => set({ theme: v }),
      setAccent: (v) => set({ accentColor: v }),
      setPush: (v) => set({ pushEnabled: v }),
      setSound: (v) => set({ soundEnabled: v }),
      setVibrate: (v) => set({ vibrateEnabled: v }),
      setWallpaper: (v) => set({ wallpaper: v }),
    }),
    {
      name: 'qwas-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

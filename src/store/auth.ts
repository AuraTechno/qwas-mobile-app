/**
 * Zustand auth store.
 */

import { create } from 'zustand';
import * as authApi from '@/api/auth';
import type { User } from '@/types';

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  user: User | null;
  error: string | null;

  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  error: null,

  async bootstrap() {
    set({ status: 'loading' });
    try {
      const hasToken = await authApi.hasToken();
      if (!hasToken) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      try {
        const user = await authApi.me();
        set({ status: 'authenticated', user, error: null });
      } catch {
        set({ status: 'unauthenticated', user: null });
      }
    } catch (e: any) {
      set({ status: 'unauthenticated', user: null, error: e?.message });
    }
  },

  async login(username, password) {
    set({ status: 'loading', error: null });
    try {
      const res = await authApi.login({ username, password });
      set({ status: 'authenticated', user: res.user });
    } catch (e: any) {
      set({ status: 'unauthenticated', error: e?.message || 'Login failed' });
      throw e;
    }
  },

  async register(username, displayName, password) {
    set({ status: 'loading', error: null });
    try {
      const res = await authApi.register({ username, displayName, password });
      set({ status: 'authenticated', user: res.user });
    } catch (e: any) {
      set({ status: 'unauthenticated', error: e?.message || 'Register failed' });
      throw e;
    }
  },

  async logout() {
    await authApi.logout();
    set({ status: 'unauthenticated', user: null });
  },

  async refresh() {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {}
  },

  setUser(user) {
    set({ user });
  },
}));

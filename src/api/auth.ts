/**
 * Auth API — login, register, me, sessions, logout.
 */

import {
  apiGet,
  apiPost,
  setToken,
  loadToken,
  apiDelete,
} from './client';
import type { AuthResponse, User, Chat } from '@/types';

export async function checkUsername(username: string): Promise<{ available: boolean; reason?: string }> {
  return apiGet(`/api/v1/auth/check-username?username=${encodeURIComponent(username)}`, {
    auth: false,
  });
}

export async function register(input: {
  username: string;
  displayName: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/api/v1/auth/register', input, { auth: false });
  setToken(res.token);
  return res;
}

export async function login(input: { username: string; password: string }): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/api/v1/auth/login', input, { auth: false });
  setToken(res.token);
  return res;
}

export async function logout(): Promise<void> {
  try {
    await apiPost('/api/v1/auth/logout', {});
  } catch {}
  setToken(null);
}

export async function me(): Promise<User> {
  return apiGet<User>('/api/v1/auth/me');
}

export type Session = {
  id: string;
  deviceInfo?: string | null;
  ip?: string | null;
  lastActive: string;
  createdAt: string;
  isCurrent?: boolean;
};

export async function listSessions(): Promise<Session[]> {
  return apiGet<Session[]>('/api/v1/auth/sessions');
}

export async function terminateSession(id: string): Promise<void> {
  await apiDelete(`/api/v1/auth/sessions/${id}`);
}

export async function terminateAllSessions(): Promise<void> {
  await apiPost('/api/v1/auth/terminate-all', {});
}

export async function updateMe(input: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  return apiPost<User>('/api/v1/users/me', input);
}

export async function hasToken(): Promise<boolean> {
  const t = await loadToken();
  return !!t;
}

export type { User, Chat };

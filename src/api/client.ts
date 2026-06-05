/**
 * API client — fetch wrapper с JWT auto-refresh.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api-qwas.academinctools.pw';

const TOKEN_KEY = 'qwas.token';
let cachedToken: string | null = null;

export function setToken(token: string | null) {
  cachedToken = token;
  if (token) {
    // Persist
    try {
      const { default: Storage } = require('expo-secure-store');
      Storage.setItemAsync(TOKEN_KEY, token).catch(() => {});
    } catch {}
  } else {
    try {
      const { default: Storage } = require('expo-secure-store');
      Storage.deleteItemAsync(TOKEN_KEY).catch(() => {});
    } catch {}
  }
}

export async function loadToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    const { default: Storage } = require('expo-secure-store');
    cachedToken = await Storage.getItemAsync(TOKEN_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: any;
  json?: any;
  formData?: FormData;
  auth?: boolean;
  timeoutMs?: number;
};

export async function api<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const {
    body,
    json,
    formData,
    auth = true,
    headers = {},
    timeoutMs = 30000,
    ...rest
  } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  let finalBody: BodyInit | undefined;

  if (formData) {
    finalBody = formData as any;
  } else if (json !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(json);
  } else if (body !== undefined) {
    finalBody = body as any;
  }

  if (auth) {
    const token = await loadToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });

    const text = await res.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `HTTP ${res.status}`;
      throw new ApiError(res.status, data, message);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new ApiError(0, null, 'Превышено время ожидания');
    }
    throw new ApiError(0, null, err?.message || 'Сеть недоступна');
  } finally {
    clearTimeout(timeout);
  }
}

export const apiGet = <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body' | 'json'> = {}) =>
  api<T>(path, { ...opts, method: 'GET' });

export const apiPost = <T>(path: string, json: any, opts: Omit<RequestOptions, 'method' | 'body' | 'json'> = {}) =>
  api<T>(path, { ...opts, method: 'POST', json });

export const apiPatch = <T>(path: string, json: any, opts: Omit<RequestOptions, 'method' | 'body' | 'json'> = {}) =>
  api<T>(path, { ...opts, method: 'PATCH', json });

export const apiDelete = <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body' | 'json'> = {}) =>
  api<T>(path, { ...opts, method: 'DELETE' });

export const apiUpload = <T>(path: string, formData: FormData, opts: Omit<RequestOptions, 'method' | 'body' | 'json' | 'formData'> = {}) =>
  api<T>(path, { ...opts, method: 'POST', formData });

export function mediaUrl(mediaUrl: string | null | undefined): string | null {
  if (!mediaUrl) return null;
  if (mediaUrl.startsWith('http')) return mediaUrl;
  return `${API_URL}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`;
}

export const platform = Platform.OS;

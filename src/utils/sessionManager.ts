// src/utils/sessionManager.ts
import { Pengguna } from '../types';

const SESSION_KEY = 'beryl_auth_session';
const SESSION_EXPIRY_DAYS = 7; // Otomatis logout setelah 7 hari
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Jam tidak ada aktivitas

interface StoredSession {
  user: Pengguna;
  loginTime: number;
  lastActiveTime: number;
}

export const saveUserSession = (user: Pengguna): void => {
  const now = Date.now();
  const session: StoredSession = {
    user,
    loginTime: now,
    lastActiveTime: now,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getUserSession = (): Pengguna | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session: StoredSession = JSON.parse(raw);
    const now = Date.now();

    // 1. Cek batas maksimal sesi (7 Hari)
    const maxExpiryMs = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (now - session.loginTime > maxExpiryMs) {
      clearUserSession();
      return null;
    }

    // 2. Cek masa tidak aktif (24 Jam)
    if (now - session.lastActiveTime > INACTIVITY_TIMEOUT_MS) {
      clearUserSession();
      return null;
    }

    // Perbarui waktu aktif terakhir
    session.lastActiveTime = now;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session.user;
  } catch (err) {
    clearUserSession();
    return null;
  }
};

export const updateLastActiveTime = (): void => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const session: StoredSession = JSON.parse(raw);
    session.lastActiveTime = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    // Ignore error
  }
};

export const clearUserSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};
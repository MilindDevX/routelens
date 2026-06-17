/**
 * Safe localStorage wrapper — never throws.
 * Returns typed results, sets STORAGE_UNAVAILABLE on first failure.
 */

let storageAvailable: boolean | null = null;

function checkStorage(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const testKey = '__rl_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export const safeStorage = {
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return checkStorage();
  },

  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    if (!checkStorage()) return fallback;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  set(key: string, value: unknown): boolean {
    if (typeof window === 'undefined') return false;
    if (!checkStorage()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      // QuotaExceededError or other
      console.warn('[routelens] localStorage.setItem failed:', e);
      return false;
    }
  },

  remove(key: string): boolean {
    if (typeof window === 'undefined') return false;
    if (!checkStorage()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  getRaw(key: string): string | null {
    if (typeof window === 'undefined') return null;
    if (!checkStorage()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setRaw(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false;
    if (!checkStorage()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};

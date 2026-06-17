'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '@/lib/storage';

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (val: T | ((prev: T) => T)) => void;
  isStorageAvailable: boolean;
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  // Start as false: server never has localStorage, and on client we check in useEffect.
  // This prevents a flash of the wrong state (incognito users seeing banner disappear).
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const available = safeStorage.isAvailable();
    setIsStorageAvailable(available);
    if (available) {
      const stored = safeStorage.get<T>(key, defaultValue);
      setValueState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
        safeStorage.set(key, next);
        return next;
      });
    },
    [key]
  );

  return { value, setValue, isStorageAvailable };
}

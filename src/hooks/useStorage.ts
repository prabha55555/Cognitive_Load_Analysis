/**
 * Storage Hooks
 * 
 * TODO: Implement persistent storage hooks
 * - localStorage integration
 * - sessionStorage integration
 * - Type-safe storage access
 * 
 * Related Flaw: Module 1 - Session State Lost on Refresh (HIGH)
 * @see docs/FLAWS_AND_ISSUES.md
 */

import { useState, useEffect, useCallback } from 'react';

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Generic storage hook factory
 */
const createStorageHook = (storageType: StorageType) => {
  return <T>(key: string, initialValue: T) => {
    const storage = typeof window !== 'undefined' 
      ? window[storageType] 
      : null;

    // Get initial value from storage or use default
    const [storedValue, setStoredValue] = useState<T>(() => {
      if (!storage) return initialValue;
      
      try {
        const item = storage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.warn(`Error reading ${storageType} key "${key}":`, error);
        return initialValue;
      }
    });

    // Update storage when value changes
    useEffect(() => {
      if (!storage) return;
      
      try {
        if (storedValue === undefined) {
          storage.removeItem(key);
        } else {
          storage.setItem(key, JSON.stringify(storedValue));
        }
      } catch (error) {
        console.warn(`Error setting ${storageType} key "${key}":`, error);
      }
    }, [key, storedValue, storage]);

    // Listen for storage changes from other tabs
    useEffect(() => {
      if (!storage || storageType !== 'localStorage') return;

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === key && event.newValue) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.warn('Error parsing storage event:', error);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [key, storage]);

    // Wrapper for setValue with type safety
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const newValue = value instanceof Function ? value(prev) : value;
        return newValue;
      });
    }, []);

    // Remove value from storage
    const removeValue = useCallback(() => {
      setStoredValue(initialValue);
      storage?.removeItem(key);
    }, [key, initialValue, storage]);

    return [storedValue, setValue, removeValue] as const;
  };
};

/**
 * Hook for localStorage with persistence across sessions
 */
export const useLocalStorage = createStorageHook('localStorage');

/**
 * Hook for sessionStorage (persists until tab closes)
 */
export const useSessionStorage = createStorageHook('sessionStorage');

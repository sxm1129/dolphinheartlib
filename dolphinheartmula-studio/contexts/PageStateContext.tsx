/**
 * Page State Preservation
 *
 * Keeps per-view state across:
 * 1. View switches (in-memory store; used together with "keep views mounted" in App).
 * 2. Page refresh (optional sessionStorage per view).
 *
 * Usage:
 * - usePageStateSlice(viewId, key, initialValue, { persist?: boolean })
 *   Use multiple times per page for each piece of state you want to preserve.
 * - State for a view is stored as store[viewId][key] = value.
 * - If persist: true, the whole store[viewId] is also written to sessionStorage
 *   under key "page_state_${viewId}" (JSON). Non-serializable values (e.g. File)
 *   are not persisted; they only live in memory while the view stays mounted.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ViewMode } from '../types';

const STORAGE_PREFIX = 'page_state_';

const memoryStore: Record<string, Record<string, unknown>> = {};

function getFromStorage(viewId: string): Record<string, unknown> {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + viewId);
    if (raw) return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // ignore
  }
  return {};
}

function saveToStorage(viewId: string, data: Record<string, unknown>) {
  try {
    const json = JSON.stringify(data);
    sessionStorage.setItem(STORAGE_PREFIX + viewId, json);
  } catch {
    // ignore (quota, private mode, non-serializable values)
  }
}

function getStoredValue<T>(viewId: string, key: string, initial: T, persist: boolean): T {
  if (!memoryStore[viewId]) {
    memoryStore[viewId] = persist ? getFromStorage(viewId) : {};
  }
  const stored = memoryStore[viewId][key];
  if (stored !== undefined) return stored as T;
  const fromStorage = persist ? getFromStorage(viewId)[key] : undefined;
  if (fromStorage !== undefined) return fromStorage as T;
  return initial;
}

function setStoredValue(viewId: string, key: string, value: unknown, persist: boolean) {
  if (!memoryStore[viewId]) memoryStore[viewId] = {};
  memoryStore[viewId][key] = value;
  if (persist) saveToStorage(viewId, memoryStore[viewId]);
}

export interface PageStateContextValue {
  usePageStateSlice: <T>(
    viewId: ViewMode,
    key: string,
    initialValue: T,
    options?: { persist?: boolean }
  ) => [T, (value: T | ((prev: T) => T)) => void];
  getPageState: <T>(viewId: ViewMode, key: string) => T | undefined;
  setPageState: (viewId: ViewMode, key: string, value: unknown) => void;
}

const PageStateContext = createContext<PageStateContextValue | undefined>(undefined);

export const PageStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const usePageStateSlice = useCallback(
    function usePageStateSlice<T>(
      viewId: ViewMode,
      key: string,
      initialValue: T,
      options?: { persist?: boolean }
    ): [T, (value: T | ((prev: T) => T)) => void] {
      const persist = options?.persist ?? false;
      const [state, setState] = useState<T>(() =>
        getStoredValue(viewId, key, initialValue, persist)
      );
      const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
          setState((prev) => {
            const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
            try {
              setStoredValue(viewId, key, next, persist);
            } catch {
              // non-serializable values (e.g. File) are not persisted; only in-memory
              if (persist) setStoredValue(viewId, key, next, false);
            }
            return next;
          });
        },
        [viewId, key, persist]
      );
      return [state, setValue];
    },
    []
  );

  const getPageState = useCallback(<T,>(viewId: ViewMode, key: string): T | undefined => {
    const data = memoryStore[viewId] ?? getFromStorage(viewId);
    const v = data[key];
    return v as T | undefined;
  }, []);

  const setPageState = useCallback((viewId: ViewMode, key: string, value: unknown) => {
    if (!memoryStore[viewId]) memoryStore[viewId] = {};
    memoryStore[viewId][key] = value;
    try {
      saveToStorage(viewId, memoryStore[viewId]);
    } catch {
      // ignore
    }
  }, []);

  const value = useRef<PageStateContextValue>({
    usePageStateSlice,
    getPageState,
    setPageState,
  }).current;
  value.usePageStateSlice = usePageStateSlice;
  value.getPageState = getPageState;
  value.setPageState = setPageState;

  return (
    <PageStateContext.Provider value={value}>
      {children}
    </PageStateContext.Provider>
  );
};

export function usePageState(): PageStateContextValue {
  const ctx = useContext(PageStateContext);
  if (ctx === undefined) {
    throw new Error('usePageState must be used within PageStateProvider');
  }
  return ctx;
}

/**
 * Hook to preserve a single slice of state for the current view.
 * Use from inside a page component; viewId should be that page's ViewMode.
 *
 * @param viewId - ViewMode (e.g. ViewMode.STUDIO)
 * @param key - Unique key within the view (e.g. 'lyrics', 'tags')
 * @param initialValue - Default when no stored value exists
 * @param options.persist - If true, also persist to sessionStorage (survives refresh). Values must be JSON-serializable.
 */
export function usePageStateSlice<T>(
  viewId: ViewMode,
  key: string,
  initialValue: T,
  options?: { persist?: boolean }
): [T, (value: T | ((prev: T) => T)) => void] {
  const { usePageStateSlice: useSlice } = usePageState();
  return useSlice(viewId, key, initialValue, options);
}

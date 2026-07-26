import { StateStorage } from 'zustand/middleware';

let migratedLocalStorage = false;

/** One-time migration: earlier versions persisted via localStorage, which a forcefully killed
 * process can silently corrupt/reset. Pull anything still sitting there into SQLite so nothing
 * intact gets stranded by the switch. Only fills in keys the database doesn't already have. */
async function migrateLocalStorageOnce(): Promise<void> {
  if (migratedLocalStorage || !window.nexus) return;
  migratedLocalStorage = true;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('nexus:') || key === 'nexus:theme') continue;
    const value = localStorage.getItem(key);
    if (value == null) continue;
    const existing = await window.nexus.dbReadKey(key);
    if (existing == null) await window.nexus.dbWriteKey(key, value);
  }
}

/** Crash-safe replacement for zustand's default localStorage-backed persistence — every store
 * reads/writes its own row in a SQLite database on disk instead, via the Electron main process. */
export const fileStorage: StateStorage = {
  getItem: async (name) => {
    if (!window.nexus) return null;
    await migrateLocalStorageOnce();
    return window.nexus.dbReadKey(name);
  },
  setItem: async (name, value) => {
    if (!window.nexus) return;
    await window.nexus.dbWriteKey(name, value);
  },
  removeItem: async (name) => {
    if (!window.nexus) return;
    await window.nexus.dbDeleteKey(name);
  },
};

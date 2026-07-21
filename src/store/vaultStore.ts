import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PasswordEntry } from '@/types';
import { createId } from '@/utils/id';
import { decryptText, deriveKey, encryptText, generateSaltB64 } from '@/utils/vaultCrypto';

interface VaultState {
  salt: string | null;
  iv: string | null;
  cipher: string | null;

  isUnlocked: boolean;
  entries: PasswordEntry[];
  error: string | null;
  key: CryptoKey | null;

  createVault: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  clearError: () => void;

  addEntry: (e: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addEntries: (list: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateEntry: (id: string, patch: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

async function persistEntries(
  set: (partial: Partial<VaultState>) => void,
  key: CryptoKey,
  entries: PasswordEntry[],
) {
  const { ivB64, cipherB64 } = await encryptText(key, JSON.stringify(entries));
  set({ entries, iv: ivB64, cipher: cipherB64 });
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      salt: null,
      iv: null,
      cipher: null,
      isUnlocked: false,
      entries: [],
      error: null,
      key: null,

      createVault: async (password) => {
        const salt = generateSaltB64();
        const key = await deriveKey(password, salt);
        const { ivB64, cipherB64 } = await encryptText(key, JSON.stringify([]));
        set({ salt, iv: ivB64, cipher: cipherB64, key, entries: [], isUnlocked: true, error: null });
      },

      unlock: async (password) => {
        const { salt, iv, cipher } = get();
        if (!salt || !iv || !cipher) return false;
        try {
          const key = await deriveKey(password, salt);
          const json = await decryptText(key, iv, cipher);
          const entries: PasswordEntry[] = JSON.parse(json);
          set({ key, entries, isUnlocked: true, error: null });
          return true;
        } catch {
          set({ error: 'Incorrect master password.' });
          return false;
        }
      },

      lock: () => set({ isUnlocked: false, entries: [], key: null, error: null }),
      clearError: () => set({ error: null }),

      addEntry: async (e) => {
        const { key, entries } = get();
        if (!key) return;
        const now = new Date().toISOString();
        const next = [...entries, { ...e, id: createId(), createdAt: now, updatedAt: now }];
        await persistEntries(set, key, next);
      },

      addEntries: async (list) => {
        const { key, entries } = get();
        if (!key || list.length === 0) return;
        const now = new Date().toISOString();
        const additions = list.map((e) => ({ ...e, id: createId(), createdAt: now, updatedAt: now }));
        await persistEntries(set, key, [...entries, ...additions]);
      },

      updateEntry: async (id, patch) => {
        const { key, entries } = get();
        if (!key) return;
        const next = entries.map((entry) =>
          entry.id === id ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry,
        );
        await persistEntries(set, key, next);
      },

      removeEntry: async (id) => {
        const { key, entries } = get();
        if (!key) return;
        await persistEntries(set, key, entries.filter((entry) => entry.id !== id));
      },

      changeMasterPassword: async (oldPassword, newPassword) => {
        const { salt, iv, cipher, entries } = get();
        if (!salt || !iv || !cipher) return false;
        try {
          const oldKey = await deriveKey(oldPassword, salt);
          await decryptText(oldKey, iv, cipher);
        } catch {
          set({ error: 'Current master password is incorrect.' });
          return false;
        }
        const newSalt = generateSaltB64();
        const newKey = await deriveKey(newPassword, newSalt);
        const { ivB64, cipherB64 } = await encryptText(newKey, JSON.stringify(entries));
        set({ salt: newSalt, iv: ivB64, cipher: cipherB64, key: newKey, error: null });
        return true;
      },
    }),
    {
      name: 'nexus:vault',
      partialize: (state) => ({ salt: state.salt, iv: state.iv, cipher: state.cipher }),
    },
  ),
);

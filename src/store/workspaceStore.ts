import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, WorkspaceApp } from '@/types';
import { createId } from '@/utils/id';

interface WorkspaceState {
  workspaces: Workspace[];
  addWorkspace: (name: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  removeWorkspace: (id: string) => void;
  addAppToWorkspace: (workspaceId: string, app: Omit<WorkspaceApp, 'id'>) => void;
  addAppsToWorkspace: (workspaceId: string, apps: Omit<WorkspaceApp, 'id'>[]) => void;
  removeAppFromWorkspace: (workspaceId: string, appId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      addWorkspace: (name) =>
        set((state) => ({
          workspaces: [...state.workspaces, { id: createId(), name, apps: [], createdAt: new Date().toISOString() }],
        })),
      renameWorkspace: (id, name) =>
        set((state) => ({ workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, name } : w)) })),
      removeWorkspace: (id) => set((state) => ({ workspaces: state.workspaces.filter((w) => w.id !== id) })),
      addAppToWorkspace: (workspaceId, app) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, apps: [...w.apps, { ...app, id: createId() }] } : w,
          ),
        })),
      addAppsToWorkspace: (workspaceId, apps) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, apps: [...w.apps, ...apps.map((a) => ({ ...a, id: createId() }))] } : w,
          ),
        })),
      removeAppFromWorkspace: (workspaceId, appId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, apps: w.apps.filter((a) => a.id !== appId) } : w,
          ),
        })),
    }),
    { name: 'nexus:workspaces' },
  ),
);

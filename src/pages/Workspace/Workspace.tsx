import { FormEvent, useState } from 'react';
import { AppWindow, Plus, Play, X, Trash2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import AddAppModal from '@/components/AddAppModal';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { WorkspaceApp } from '@/types';

function WorkspaceCard({ workspaceId }: { workspaceId: string }) {
  const { workspaces, removeWorkspace, addAppsToWorkspace, removeAppFromWorkspace } = useWorkspaceStore();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [appToRemove, setAppToRemove] = useState<WorkspaceApp | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!workspace) return null;

  async function launchAll() {
    if (!window.nexus || workspace!.apps.length === 0) return;
    setError(null);
    setLaunching(true);
    const { errors } = await window.nexus.launchApps(workspace!.apps.map((a) => a.path));
    setLaunching(false);
    if (errors.length) setError(errors.join(' · '));
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-glow">
            <AppWindow size={16} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-surface-100">{workspace.name}</h3>
            <p className="text-[11px] text-surface-500">
              {workspace.apps.length} app{workspace.apps.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAddOpen(true)} className={buttonGhostIconClass}>
            <Plus size={15} />
          </button>
          <button onClick={() => setConfirmDelete(true)} className={buttonGhostIconClass}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {workspace.apps.length === 0 ? (
        <EmptyState icon={AppWindow} label="No apps yet — add one to this workspace." />
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {workspace.apps.map((a) => (
            <div
              key={a.id}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-surface-800 p-3 text-center transition-colors hover:border-surface-700 hover:bg-surface-800/40"
            >
              {a.icon ? (
                <img src={a.icon} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-800 text-surface-500">
                  <AppWindow size={18} />
                </div>
              )}
              <span className="line-clamp-2 text-[11.5px] leading-tight text-surface-300">{a.name}</span>
              <button
                onClick={() => setAppToRemove(a)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-surface-800 bg-surface-900 text-surface-500 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={launchAll}
        disabled={workspace.apps.length === 0 || launching}
        className={`w-full ${buttonPrimaryClass} disabled:opacity-40`}
      >
        <Play size={14} /> {launching ? 'Launching…' : 'Launch all'}
      </button>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete workspace"
        message={`Delete "${workspace.name}"? This only removes the workspace group — it won't uninstall or delete any of the apps themselves.`}
        onConfirm={() => {
          removeWorkspace(workspace!.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={!!appToRemove}
        title="Remove app"
        message={`Remove "${appToRemove?.name}" from "${workspace.name}"? This won't uninstall or delete the app itself.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (appToRemove) removeAppFromWorkspace(workspace!.id, appToRemove.id);
          setAppToRemove(null);
        }}
        onCancel={() => setAppToRemove(null)}
      />

      <AddAppModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(apps) => addAppsToWorkspace(workspace!.id, apps)}
      />
    </Card>
  );
}

function NewWorkspaceForm({ onDone }: { onDone: () => void }) {
  const { addWorkspace } = useWorkspaceStore();
  const [name, setName] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkspace(name.trim());
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace name (e.g. Night Shift)"
        className={`w-full ${inputClass}`}
        autoFocus
      />
      <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
        <Plus size={14} /> Create workspace
      </button>
    </form>
  );
}

export default function Workspace() {
  const { workspaces } = useWorkspaceStore();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Workspace Manager"
        subtitle="Group apps together and launch them all at once."
        actions={
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> New workspace
          </button>
        }
      />
      <div className="p-8">
        {workspaces.length === 0 ? (
          <Card>
            <EmptyState icon={AppWindow} label="No workspaces yet. Create one to group the apps you use together." />
            <div className="mt-3 flex justify-center">
              <button onClick={() => setOpen(true)} className={buttonSecondaryClass}>
                <Plus size={13} /> New workspace
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((w) => (
              <WorkspaceCard key={w.id} workspaceId={w.id} />
            ))}
          </div>
        )}
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="New workspace">
        <NewWorkspaceForm onDone={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}

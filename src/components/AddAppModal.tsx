import { useEffect, useState } from 'react';
import { AppWindow, Plus, FolderOpen, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass } from './ui';

interface DetectedApp {
  name: string;
  path: string;
  icon: string | null;
}

export default function AddAppModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (apps: DetectedApp[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<DetectedApp[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !window.nexus) return;
    setQuery('');
    setSelected(new Set());
    setError(null);
    setLoading(true);
    window.nexus.scanInstalledApps().then(({ results, error: err }) => {
      setApps(results);
      if (err) setError(err);
      setLoading(false);
    });
  }, [open]);

  const filtered = apps.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function confirmSelected() {
    onAdd(apps.filter((a) => selected.has(a.path)));
    onClose();
  }

  async function browseManually() {
    if (!window.nexus) return;
    const picked = await window.nexus.pickApp();
    if (picked) {
      onAdd([{ name: picked.name, path: picked.path, icon: picked.icon }]);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add apps to workspace">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search detected apps…"
        className={`mb-3 w-full ${inputClass}`}
        autoFocus
      />

      {loading ? (
        <p className="py-6 text-center text-[13px] text-surface-500">Scanning Desktop and Start Menu…</p>
      ) : error ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-surface-500">No matches — try Browse instead.</p>
      ) : (
        <div className="max-h-80 space-y-0.5 overflow-y-auto">
          {filtered.map((a) => (
            <label
              key={a.path}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-800/60"
            >
              <input
                type="checkbox"
                checked={selected.has(a.path)}
                onChange={() => toggle(a.path)}
                className="h-4 w-4 shrink-0 rounded border-surface-700 bg-surface-850 accent-accent-500"
              />
              {a.icon ? (
                <img src={a.icon} alt="" className="h-7 w-7 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-800 text-surface-500">
                  <AppWindow size={14} />
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] text-surface-200">{a.name}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button onClick={confirmSelected} disabled={selected.size === 0} className={`flex-1 ${buttonPrimaryClass} disabled:opacity-40`}>
          <Plus size={14} /> Add {selected.size > 0 ? selected.size : ''} selected
        </button>
        <button onClick={browseManually} className={buttonSecondaryClass}>
          <FolderOpen size={13} /> Browse…
        </button>
      </div>
    </Modal>
  );
}

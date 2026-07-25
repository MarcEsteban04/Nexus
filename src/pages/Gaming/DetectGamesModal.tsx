import { useEffect, useState } from 'react';
import { Loader2, ScanSearch, Check, X } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui';
import { Game } from '@/types';

interface Draft {
  name: string;
  path: string;
  spawnPath: string | null;
  icon: string | null;
  selected: boolean;
}

export default function DetectGamesModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (games: Omit<Game, 'id' | 'createdAt'>[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  useEffect(() => {
    if (open) {
      setDrafts(null);
      setError(null);
      runScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function runScan() {
    if (!window.nexus) {
      setError('Detection only works inside the Nexus desktop app.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await window.nexus.scanDesktopGames();
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.results.length === 0) {
      setError('No shortcuts or .exe files found on your Desktop.');
      return;
    }
    setDrafts(res.results.map((r) => ({ name: r.name, path: r.path, spawnPath: r.spawnPath, icon: r.icon, selected: false })));
  }

  function toggle(i: number) {
    setDrafts((prev) => (prev ? prev.map((d, idx) => (idx === i ? { ...d, selected: !d.selected } : d)) : prev));
  }

  function rename(i: number, name: string) {
    setDrafts((prev) => (prev ? prev.map((d, idx) => (idx === i ? { ...d, name } : d)) : prev));
  }

  function commit() {
    if (!drafts) return;
    const selected = drafts.filter((d) => d.selected);
    if (selected.length === 0) return;
    onAdd(
      selected.map((d) => ({
        title: d.name,
        platform: 'Desktop',
        status: 'installed',
        hoursPlayed: 0,
        achievementsUnlocked: 0,
        achievementsTotal: 0,
        lastPlayed: '',
        notes: '',
        execPath: d.path,
        spawnPath: d.spawnPath,
        iconDataUrl: d.icon,
      })),
    );
    onClose();
  }

  const selectedCount = drafts?.filter((d) => d.selected).length ?? 0;

  return (
    <Modal open={open} onClose={onClose} title="Detect games from Desktop" width="max-w-2xl">
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <Loader2 size={28} className="animate-spin text-accent-400" />
          <p className="text-[13px] text-surface-400">Scanning your Desktop for shortcuts and apps…</p>
        </div>
      )}

      {!loading && error && (
        <div className="py-6">
          <EmptyState icon={ScanSearch} label={error} />
          <button onClick={runScan} className={`mx-auto mt-2 flex ${buttonSecondaryClass}`}>
            Try again
          </button>
        </div>
      )}

      {!loading && drafts && (
        <div>
          <p className="mb-3 text-[12px] text-surface-500">
            Found {drafts.length} shortcut{drafts.length === 1 ? '' : 's'} / apps on your Desktop. Check the ones that
            are actually games — everything else on your Desktop got picked up too, since there's no reliable way to
            tell a game shortcut from any other app shortcut. Ones marked{' '}
            <span className="text-emerald-400">Auto playtime</span> resolve to a real local .exe, so Nexus can time
            your session automatically; the rest (usually launcher-protocol shortcuts like Steam's) need a manual
            Stop click when you're done.
          </p>
          <div className="mb-4 max-h-[50vh] space-y-1 overflow-y-auto">
            {drafts.map((d, i) => (
              <div key={d.path} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
                <input type="checkbox" checked={d.selected} onChange={() => toggle(i)} className="accent-accent-500" />
                {d.icon ? (
                  <img src={d.icon} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
                ) : (
                  <div className="h-6 w-6 shrink-0 rounded bg-surface-800" />
                )}
                <input
                  value={d.name}
                  onChange={(e) => rename(i, e.target.value)}
                  className={`min-w-0 flex-1 ${inputClass}`}
                />
                <span className="truncate text-[11px] text-surface-500" title={d.path}>
                  {d.path}
                </span>
                {d.spawnPath && (
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">
                    Auto playtime
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={commit} disabled={selectedCount === 0} className={buttonPrimaryClass}>
              <Check size={14} /> Add {selectedCount} {selectedCount === 1 ? 'game' : 'games'}
            </button>
            <button onClick={onClose} className={buttonSecondaryClass}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

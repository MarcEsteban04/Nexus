import { useEffect, useMemo, useState } from 'react';
import { Gamepad2, Trophy, Clock, Heart, X, Play, Square, ScanSearch } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import Select from '@/components/Select';
import { buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useGamingStore } from '@/store/gamingStore';
import { GameStatus } from '@/types';
import DetectGamesModal from './DetectGamesModal';

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'installed', label: 'Installed' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_LABEL: Record<GameStatus, string> = {
  wishlist: 'Wishlist',
  installed: 'Installed',
  playing: 'Playing',
  completed: 'Completed',
};

const FILTERS = ['all', ...STATUS_OPTIONS.map((o) => o.value)] as const;

function GameCard({ id }: { id: string }) {
  const { games, logPlaytime, removeGame, updateGame } = useGamingStore();
  const game = games.find((g) => g.id === id)!;
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [manualSessionStart, setManualSessionStart] = useState<number | null>(null);
  const isAutoTracked = playing && !!game.spawnPath;

  useEffect(() => {
    return window.nexus?.onGameSessionEnded(({ gameId, hours }) => {
      if (gameId !== game.id) return;
      logPlaytime(game.id, hours);
      setPlaying(false);
    });
  }, [game.id, logPlaytime]);

  const achievementPct =
    game.achievementsTotal > 0 ? (game.achievementsUnlocked / game.achievementsTotal) * 100 : 0;

  async function handlePlayClick() {
    if (playing && !game.spawnPath) {
      // Manual session in progress — this click stops and logs it.
      if (manualSessionStart) {
        const hours = (Date.now() - manualSessionStart) / 3_600_000;
        logPlaytime(game.id, hours);
      }
      setPlaying(false);
      setManualSessionStart(null);
      return;
    }

    if (!game.execPath || !window.nexus) return;
    setLaunchError(null);
    const res = await window.nexus.launchGame(game.id, game.execPath, game.spawnPath);
    if (res.error) {
      setLaunchError(res.error);
      return;
    }
    setPlaying(true);
    if (!res.tracked) setManualSessionStart(Date.now());
  }

  return (
    <div className="rounded-xl border border-surface-800 p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {game.iconDataUrl ? (
            <img src={game.iconDataUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-800 text-surface-500">
              <Gamepad2 size={15} />
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-surface-100">{game.title}</p>
            <p className="text-[11px] text-surface-500">{game.platform}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {game.execPath && (
            <button
              onClick={handlePlayClick}
              disabled={isAutoTracked}
              title={playing ? (isAutoTracked ? 'Playing — tracked automatically' : 'Stop and log session') : 'Launch'}
              className={`transition-colors ${
                playing
                  ? isAutoTracked
                    ? 'text-emerald-400'
                    : 'text-rose-400 hover:text-rose-300'
                  : 'text-surface-400 hover:text-accent-400'
              }`}
            >
              {playing ? <Square size={14} className={isAutoTracked ? 'animate-pulse' : ''} /> : <Play size={15} />}
            </button>
          )}
          <button onClick={() => removeGame(game.id)} className={buttonGhostIconClass}>
            <X size={14} />
          </button>
        </div>
      </div>
      {launchError && <p className="mb-2 text-[11px] text-rose-400">{launchError}</p>}
      {playing && (
        <p className="mb-2 text-[11px] text-emerald-400">
          {isAutoTracked ? 'Playing now — logging automatically when you close it.' : 'Playing now — click Stop when done.'}
        </p>
      )}

      <div className="mb-2">
        <Select
          value={game.status}
          onChange={(v) => updateGame(game.id, { status: v as GameStatus })}
          options={STATUS_OPTIONS}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between text-[12px] text-surface-400">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {game.hoursPlayed.toFixed(1)}h played
        </span>
        {game.achievementsTotal > 0 && (
          <span className="flex items-center gap-1">
            <Trophy size={12} /> {game.achievementsUnlocked}/{game.achievementsTotal}
          </span>
        )}
      </div>
      {game.achievementsTotal > 0 && <ProgressBar value={achievementPct} tone="positive" />}
    </div>
  );
}

export default function Gaming() {
  const { games, addGames } = useGamingStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [detectOpen, setDetectOpen] = useState(false);

  const totalHours = games.reduce((a, g) => a + g.hoursPlayed, 0);
  const installedCount = games.filter((g) => g.status === 'installed' || g.status === 'playing').length;
  const wishlistCount = games.filter((g) => g.status === 'wishlist').length;
  const completedCount = games.filter((g) => g.status === 'completed').length;

  const filtered = useMemo(
    () => (filter === 'all' ? games : games.filter((g) => g.status === filter)),
    [games, filter],
  );

  return (
    <div>
      <PageHeader
        title="Gaming Dashboard"
        subtitle="Manage your gaming life without opening multiple launchers."
        actions={
          <button onClick={() => setDetectOpen(true)} className={buttonSecondaryClass}>
            <ScanSearch size={13} /> Detect games
          </button>
        }
      />
      <div className="p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total playtime" value={`${totalHours}h`} icon={Clock} />
          <StatCard label="Installed / playing" value={String(installedCount)} icon={Gamepad2} />
          <StatCard label="Wishlist" value={String(wishlistCount)} icon={Heart} />
          <StatCard label="Completed" value={String(completedCount)} icon={Trophy} tone="positive" />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                filter === f ? 'bg-accent-gradient text-white shadow-glow' : 'text-surface-300 hover:bg-surface-800'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f as GameStatus]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Gamepad2} label="No games here yet. Use Detect games above to add some." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <GameCard key={g.id} id={g.id} />
            ))}
          </div>
        )}
      </div>

      <DetectGamesModal open={detectOpen} onClose={() => setDetectOpen(false)} onAdd={addGames} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, Sparkles } from 'lucide-react';

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.nexus?.isMaximized().then(setMaximized);
    return window.nexus?.onMaximizedChange(setMaximized);
  }, []);

  return (
    <div className="app-drag flex h-11 shrink-0 items-center justify-between border-b border-surface-800 bg-surface-950 pl-4">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-gradient">
          <Sparkles size={12} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-surface-100">Nexus</span>
        <span className="text-[11px] text-surface-500">v0.1.0</span>
      </div>

      <div className="app-no-drag flex h-full">
        <button
          onClick={() => window.nexus?.minimize()}
          className="flex h-full w-11 items-center justify-center text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-100"
        >
          <Minus size={15} />
        </button>
        <button
          onClick={() => window.nexus?.toggleMaximize()}
          className="flex h-full w-11 items-center justify-center text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-100"
        >
          {maximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button
          onClick={() => window.nexus?.close()}
          className="flex h-full w-11 items-center justify-center text-surface-400 transition-colors hover:bg-accent-600 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

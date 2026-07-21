import { useState } from 'react';
import { buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function format() {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function minify() {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button onClick={format} className={buttonPrimaryClass}>
          Format
        </button>
        <button onClick={minify} className={buttonSecondaryClass}>
          Minify
        </button>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste JSON here..."
        rows={16}
        className="w-full rounded-lg border border-surface-800 bg-surface-950 p-3 font-mono text-[13px] text-surface-100 outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20"
      />
      {error && <p className="mt-2 text-[13px] text-rose-400">{error}</p>}
    </div>
  );
}

import { useState } from 'react';
import { buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui';

export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function encode() {
    try {
      setInput(btoa(unescape(encodeURIComponent(input))));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function decode() {
    try {
      setInput(decodeURIComponent(escape(atob(input))));
      setError('');
    } catch (e) {
      setError('Invalid Base64 string');
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button onClick={encode} className={buttonPrimaryClass}>
          Encode
        </button>
        <button onClick={decode} className={buttonSecondaryClass}>
          Decode
        </button>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Text or Base64..."
        rows={12}
        className="w-full rounded-lg border border-surface-800 bg-surface-950 p-3 font-mono text-[13px] text-surface-100 outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20"
      />
      {error && <p className="mt-2 text-[13px] text-rose-400">{error}</p>}
    </div>
  );
}

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { buttonPrimaryClass } from '@/components/ui';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = LOWER.toUpperCase();
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');

  function generate() {
    let pool = LOWER;
    if (useUpper) pool += UPPER;
    if (useDigits) pool += DIGITS;
    if (useSymbols) pool += SYMBOLS;

    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    const result = Array.from(bytes, (b) => pool[b % pool.length]).join('');
    setPassword(result);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4 text-[13px] text-surface-300">
        <label className="flex items-center gap-2">
          Length
          <input
            type="number"
            min={4}
            max={128}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10) || 16)}
            className="w-20 rounded-lg border border-surface-800 bg-surface-850 px-2 py-1 outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} className="accent-accent-500" />
          Uppercase
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useDigits} onChange={(e) => setUseDigits(e.target.checked)} className="accent-accent-500" />
          Digits
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} className="accent-accent-500" />
          Symbols
        </label>
        <button onClick={generate} className={buttonPrimaryClass}>
          Generate
        </button>
      </div>
      {password && (
        <div
          onClick={() => navigator.clipboard.writeText(password)}
          title="Click to copy"
          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface-950 px-3 py-2.5 font-mono text-[13px] text-surface-100"
        >
          <span className="break-all">{password}</span>
          <Copy size={14} className="shrink-0 text-surface-500" />
        </div>
      )}
    </div>
  );
}

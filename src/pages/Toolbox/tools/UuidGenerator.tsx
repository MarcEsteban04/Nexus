import { useState } from 'react';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui';

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([crypto.randomUUID()]);
  const [count, setCount] = useState(5);

  function generate() {
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()));
  }

  function copyAll() {
    navigator.clipboard.writeText(uuids.join('\n'));
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
          className={`w-20 ${inputClass}`}
        />
        <button onClick={generate} className={buttonPrimaryClass}>
          Generate
        </button>
        <button onClick={copyAll} className={buttonSecondaryClass}>
          Copy all
        </button>
      </div>
      <ul className="space-y-1 font-mono text-[13px]">
        {uuids.map((u) => (
          <li key={u} className="rounded-lg bg-surface-950 px-3 py-1.5 text-surface-200">
            {u}
          </li>
        ))}
      </ul>
    </div>
  );
}

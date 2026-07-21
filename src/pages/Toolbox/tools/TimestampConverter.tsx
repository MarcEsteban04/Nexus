import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { inputClass, buttonPrimaryClass } from '@/components/ui';

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState(String(Math.floor(Date.now() / 1000)));
  const [iso, setIso] = useState(new Date().toISOString());

  function fromTimestamp() {
    const n = parseInt(timestamp, 10);
    if (!isNaN(n)) setIso(new Date(n * 1000).toISOString());
  }

  function fromIso() {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) setTimestamp(String(Math.floor(d.getTime() / 1000)));
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
          Unix Timestamp (seconds)
        </label>
        <div className="flex gap-2">
          <input value={timestamp} onChange={(e) => setTimestamp(e.target.value)} className={`flex-1 font-mono ${inputClass}`} />
          <button onClick={fromTimestamp} className={buttonPrimaryClass}>
            <ArrowRight size={14} /> Date
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">ISO Date</label>
        <div className="flex gap-2">
          <input value={iso} onChange={(e) => setIso(e.target.value)} className={`flex-1 font-mono ${inputClass}`} />
          <button onClick={fromIso} className={buttonPrimaryClass}>
            <ArrowRight size={14} /> Timestamp
          </button>
        </div>
      </div>
    </div>
  );
}

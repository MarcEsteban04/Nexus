import { FormEvent, useState } from 'react';
import { Copy, X, Plus, Code2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useAiWorkspaceStore } from '@/store/aiWorkspaceStore';

export default function Snippets() {
  const { snippets, addSnippet, removeSnippet } = useAiWorkspaceStore();
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [code, setCode] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title || !code) return;
    addSnippet({ title, language: language || 'text', code });
    setTitle('');
    setLanguage('');
    setCode('');
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Snippet title" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
          <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language (e.g. tsx)" className={`w-40 ${inputClass}`} />
        </div>
        <div className="flex items-start gap-2">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste code…"
            rows={4}
            className={`w-full font-mono text-[12px] ${inputClass}`}
          />
          <button type="submit" title="Save snippet" className={buttonIconPrimaryClass}>
            <Plus size={16} />
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {snippets.length === 0 && <EmptyState icon={Code2} label="No snippets saved yet." />}
        {snippets.map((s) => (
          <div key={s.id} className="rounded-xl border border-surface-800 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-surface-100">{s.title}</p>
                <span className="rounded-full bg-surface-800 px-2 py-0.5 text-[11px] text-surface-400">{s.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigator.clipboard.writeText(s.code)} className={buttonGhostIconClass}>
                  <Copy size={14} />
                </button>
                <button onClick={() => removeSnippet(s.id)} className={buttonGhostIconClass}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[12px] text-surface-400">{s.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { Star, Copy, X, Plus, Sparkles } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useAiWorkspaceStore } from '@/store/aiWorkspaceStore';
import { AiModel } from '@/types';

const MODEL_OPTIONS: { value: AiModel; label: string }[] = [
  { value: 'ChatGPT', label: 'ChatGPT' },
  { value: 'Claude', label: 'Claude' },
  { value: 'Gemini', label: 'Gemini' },
  { value: 'DeepSeek', label: 'DeepSeek' },
  { value: 'Ollama', label: 'Ollama (local)' },
  { value: 'Other', label: 'Other' },
];

export default function Prompts() {
  const { prompts, addPrompt, toggleFavoritePrompt, removePrompt } = useAiWorkspaceStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [model, setModel] = useState<AiModel>('ChatGPT');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title || !body) return;
    addPrompt({ title, body, category, model });
    setTitle('');
    setBody('');
    setCategory('');
  }

  const sorted = [...prompts].sort((a, b) => Number(b.favorite) - Number(a.favorite));

  return (
    <div>
      <form onSubmit={submit} className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prompt title" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-32 ${inputClass}`} />
          <Select value={model} onChange={(v) => setModel(v as AiModel)} options={MODEL_OPTIONS} className="w-40" />
        </div>
        <div className="flex items-start gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Prompt text…"
            rows={3}
            className={`w-full font-mono text-[12px] ${inputClass}`}
          />
          <button type="submit" title="Save prompt" className={buttonIconPrimaryClass}>
            <Plus size={16} />
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {sorted.length === 0 && <EmptyState icon={Sparkles} label="No prompts saved yet." />}
        {sorted.map((p) => (
          <div key={p.id} className="rounded-xl border border-surface-800 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-surface-100">{p.title}</p>
                <span className="rounded-full bg-surface-800 px-2 py-0.5 text-[11px] text-surface-400">{p.model}</span>
                {p.category && <span className="text-[11px] text-surface-500">{p.category}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleFavoritePrompt(p.id)} className={p.favorite ? 'text-amber-400' : 'text-surface-500 hover:text-amber-400'}>
                  <Star size={14} className={p.favorite ? 'fill-amber-400' : ''} />
                </button>
                <button onClick={() => navigator.clipboard.writeText(p.body)} className={buttonGhostIconClass}>
                  <Copy size={14} />
                </button>
                <button onClick={() => removePrompt(p.id)} className={buttonGhostIconClass}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <p className="whitespace-pre-wrap font-mono text-[12px] text-surface-400">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

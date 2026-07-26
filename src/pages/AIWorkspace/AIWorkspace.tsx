import { FormEvent, useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Trash2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useAiAssistantStore } from '@/store/aiAssistantStore';
import { buildAssistantContext } from '@/utils/assistantContext';

const SUGGESTIONS = [
  'How much do I have across all my accounts?',
  "What bills do I still need to pay this month?",
  "What's on my calendar this week?",
  'How much am I spending on subscriptions monthly?',
];

export default function AIWorkspace() {
  const { messages, addMessage, clearMessages } = useAiAssistantStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setError(null);
    addMessage('user', trimmed);
    setInput('');
    setLoading(true);

    const history = [...useAiAssistantStore.getState().messages].map((m) => ({ role: m.role, content: m.content }));
    const context = buildAssistantContext();

    if (!window.nexus) {
      setError('Assistant is only available in the desktop app.');
      setLoading(false);
      return;
    }

    const { reply, error: err } = await window.nexus.askAssistant(history, context);
    if (err || !reply) {
      setError(err ?? 'No response from the assistant.');
      setLoading(false);
      return;
    }
    addMessage('assistant', reply);
    setLoading(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div>
      <PageHeader title="Nexus AI" subtitle="Knows your app data. Never sees your Password Vault." />
      <div className="p-8">
        <Card className="flex h-[calc(100vh-14rem)] flex-col">
          {messages.length > 0 && (
            <div className="mb-3 flex items-center justify-end">
              <button onClick={() => clearMessages()} className={buttonGhostIconClass}>
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <EmptyState icon={Sparkles} label="Ask me anything about your data." />
                <div className="flex flex-wrap justify-center gap-2 px-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="rounded-full border border-surface-800 bg-surface-850 px-3 py-1.5 text-[12px] text-surface-300 transition-colors hover:border-accent-500/60 hover:text-surface-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-accent-gradient text-white shadow-glow'
                        : 'border border-surface-800 bg-surface-850 text-surface-200'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-surface-800 bg-surface-850 px-3.5 py-2.5 text-[13px] text-surface-500">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your money, calendar, games, receipts, wishlist…"
              className={`flex-1 ${inputClass}`}
            />
            <button type="submit" disabled={loading || !input.trim()} className={`${buttonPrimaryClass} disabled:opacity-40`}>
              <Send size={14} />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

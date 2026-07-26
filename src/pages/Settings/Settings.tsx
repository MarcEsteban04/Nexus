import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import ConfirmDialog from '@/components/ConfirmDialog';
import { inputClass, buttonPrimaryClass, buttonGhostIconClass } from '@/components/ui';

type ApiKeyName = 'OPENAI_API_KEY' | 'GROK_API_KEY';

const KEY_INFO: Record<ApiKeyName, { label: string; helpUrl: string; helpLabel: string; placeholder: string }> = {
  OPENAI_API_KEY: {
    label: 'OpenAI API Key',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com/api-keys',
    placeholder: 'sk-...',
  },
  GROK_API_KEY: {
    label: 'Groq API Key',
    helpUrl: 'https://console.groq.com/keys',
    helpLabel: 'console.groq.com/keys',
    placeholder: 'gsk_...',
  },
};

function ApiKeyCard({ name }: { name: ApiKeyName }) {
  const info = KEY_INFO[name];
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);

  async function refreshStatus() {
    if (!window.nexus) return;
    const status = await window.nexus.getApiKeyStatus();
    setConfigured(status[name]);
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || !window.nexus) return;
    setError(null);
    setSaving(true);
    const { error: err } = await window.nexus.setApiKey(name, value.trim());
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setValue('');
    setSavedJustNow(true);
    setTimeout(() => setSavedJustNow(false), 2000);
    refreshStatus();
  }

  async function clearKey() {
    if (!window.nexus) return;
    await window.nexus.clearApiKey(name);
    setConfirmClear(false);
    refreshStatus();
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
            <KeyRound size={16} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-surface-100">{info.label}</h3>
            {configured != null && (
              <p className={`flex items-center gap-1 text-[11px] ${configured ? 'text-emerald-400' : 'text-surface-500'}`}>
                {configured && <CheckCircle2 size={11} />}
                {configured ? 'Configured' : 'Not set'}
              </p>
            )}
          </div>
        </div>
        {configured && (
          <button onClick={() => setConfirmClear(true)} className={buttonGhostIconClass}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="password"
          placeholder={configured ? '••••••••••••••••' : info.placeholder}
          className={`flex-1 ${inputClass}`}
        />
        <button type="submit" disabled={saving || !value.trim()} className={`${buttonPrimaryClass} disabled:opacity-40`}>
          {saving ? 'Saving…' : savedJustNow ? 'Saved ✓' : 'Save'}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-surface-500">
        Get a key at{' '}
        <a href={info.helpUrl} target="_blank" rel="noreferrer" className="text-accent-400 hover:text-accent-300">
          {info.helpLabel}
        </a>
        . Stored encrypted on this device only — it's never sent anywhere except directly to that provider's API.
      </p>

      <ConfirmDialog
        open={confirmClear}
        title={`Remove ${info.label}`}
        message={`Remove the saved ${info.label}? Features that use it will stop working until you add one again.`}
        confirmLabel="Remove"
        onConfirm={clearKey}
        onCancel={() => setConfirmClear(false)}
      />
    </Card>
  );
}

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your own API keys for Nexus's AI-powered features." />
      <div className="space-y-4 p-8">
        <ApiKeyCard name="OPENAI_API_KEY" />
        <ApiKeyCard name="GROK_API_KEY" />
      </div>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Plus,
  X,
  Pencil,
  RefreshCw,
  KeyRound,
  ExternalLink,
  Upload,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass, buttonIconPrimaryClass } from '@/components/ui';
import { useVaultStore } from '@/store/vaultStore';
import { PasswordEntry } from '@/types';
import ImportModal from './ImportModal';

const PASSWORD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';

function generatePassword(length = 18) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('');
}

function CreateVaultView() {
  const { createVault, error, clearError } = useVaultStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    clearError();
    if (password.length < 8) {
      setLocalError('Use at least 8 characters for your master password.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    setLocalError(null);
    createVault(password);
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400">
            <ShieldCheck size={22} />
          </div>
          <h3 className="text-[15px] font-semibold text-surface-100">Create your vault</h3>
          <p className="mt-1 text-[12px] text-surface-500">
            Everything is encrypted on this device with AES-256, locked behind one master password. There is no
            recovery — if you forget it, the vault can't be unlocked.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Master password"
            type="password"
            className={`w-full ${inputClass}`}
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm master password"
            type="password"
            className={`w-full ${inputClass}`}
          />
          {(localError || error) && <p className="text-[12px] text-rose-400">{localError || error}</p>}
          <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
            <ShieldCheck size={14} /> Create vault
          </button>
        </form>
      </Card>
    </div>
  );
}

function UnlockVaultView() {
  const { unlock, error, clearError } = useVaultStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setLoading(true);
    await unlock(password);
    setLoading(false);
    setPassword('');
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400">
            <Lock size={22} />
          </div>
          <h3 className="text-[15px] font-semibold text-surface-100">Vault locked</h3>
          <p className="mt-1 text-[12px] text-surface-500">Enter your master password to unlock.</p>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Master password"
            type="password"
            autoFocus
            className={`w-full ${inputClass}`}
          />
          {error && <p className="text-[12px] text-rose-400">{error}</p>}
          <button type="submit" disabled={loading} className={`w-full ${buttonPrimaryClass}`}>
            <Unlock size={14} /> {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
      </Card>
    </div>
  );
}

function EntryForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: PasswordEntry;
  onCancel?: () => void;
  onSubmit: (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [username, setUsername] = useState(initial?.username ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [reveal, setReveal] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title || !password) return;
    onSubmit({ title, username, password, url, notes });
    if (!initial) {
      setTitle('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Gmail)" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username / email" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
      <div className="relative min-w-0 flex-1 basis-32">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type={reveal ? 'text' : 'password'}
          className={`w-full pr-8 ${inputClass}`}
        />
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-200"
        >
          {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <button type="button" title="Generate password" onClick={() => setPassword(generatePassword())} className={buttonSecondaryClass}>
        <RefreshCw size={13} />
      </button>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Site URL (optional)" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
      {initial && onCancel && (
        <button type="button" onClick={onCancel} className={buttonSecondaryClass}>
          Cancel
        </button>
      )}
      <button type="submit" title={initial ? 'Save changes' : 'Add entry'} className={buttonIconPrimaryClass}>
        {initial ? <Pencil size={16} /> : <Plus size={16} />}
      </button>
    </form>
  );
}

function EntryRow({ entry }: { entry: PasswordEntry }) {
  const { updateEntry, removeEntry } = useVaultStore();
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null);

  function copy(text: string, which: 'user' | 'pass') {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-surface-800 p-3">
        <EntryForm
          initial={entry}
          onCancel={() => setEditing(false)}
          onSubmit={(data) => {
            updateEntry(entry.id, data);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-surface-800 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-surface-100">{entry.title}</p>
          {entry.url && (
            <a href={entry.url} target="_blank" rel="noreferrer" className="text-surface-500 hover:text-accent-400">
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-surface-400">
          {entry.username && (
            <button onClick={() => copy(entry.username, 'user')} className="flex items-center gap-1 hover:text-surface-200">
              {entry.username}
              <Copy size={11} />
              {copied === 'user' && <span className="text-emerald-400">Copied</span>}
            </button>
          )}
          <button onClick={() => copy(entry.password, 'pass')} className="flex items-center gap-1 font-mono hover:text-surface-200">
            {reveal ? entry.password : '••••••••'}
            <Copy size={11} />
            {copied === 'pass' && <span className="text-emerald-400">Copied</span>}
          </button>
          <button onClick={() => setReveal((r) => !r)} className="text-surface-500 hover:text-surface-200">
            {reveal ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        {entry.notes && <p className="mt-1 truncate text-[11px] text-surface-500">{entry.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => setEditing(true)} className={buttonGhostIconClass}>
          <Pencil size={14} />
        </button>
        <button onClick={() => removeEntry(entry.id)} className={buttonGhostIconClass}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function ChangeMasterPassword() {
  const { changeMasterPassword, error, clearError } = useVaultStore();
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSuccess(false);
    const ok = await changeMasterPassword(oldPassword, newPassword);
    if (ok) {
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={buttonSecondaryClass}>
        <KeyRound size={13} /> Change master password
      </button>
    );
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <input value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} type="password" placeholder="Current master password" className={`min-w-0 flex-1 basis-40 ${inputClass}`} />
        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New master password" className={`min-w-0 flex-1 basis-40 ${inputClass}`} />
        <button type="submit" className={buttonPrimaryClass}>
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonSecondaryClass}>
          Cancel
        </button>
      </form>
      {error && <p className="mt-2 text-[12px] text-rose-400">{error}</p>}
      {success && <p className="mt-2 text-[12px] text-emerald-400">Master password updated.</p>}
    </Card>
  );
}

function UnlockedView() {
  const { entries, lock, addEntry, addEntries } = useVaultStore();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChangeMasterPassword />
          <button onClick={() => setImportOpen(true)} className={buttonSecondaryClass}>
            <Upload size={13} /> Import
          </button>
        </div>
        <button onClick={lock} className={buttonSecondaryClass}>
          <Lock size={13} /> Lock vault
        </button>
      </div>
      <Card>
        <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Add password</h3>
        <EntryForm onSubmit={addEntry} />
      </Card>
      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <EmptyState icon={KeyRound} label="No passwords saved yet. Add your first one above." />
        ) : (
          entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
        )}
      </div>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={addEntries} />
    </div>
  );
}

export default function Vault() {
  const { salt, isUnlocked } = useVaultStore();

  return (
    <div>
      <PageHeader title="Password Vault" subtitle="Your passwords, encrypted on this device. Never in a notepad again." />
      <div className="p-8">
        {!salt ? <CreateVaultView /> : !isUnlocked ? <UnlockVaultView /> : <UnlockedView />}
      </div>
    </div>
  );
}

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Sparkles, Loader2, X, Check, AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { ExtractedCredential } from '@/types';

const LOADING_MESSAGES = ['Reading your notes…', 'Finding logins…', 'Sorting out usernames and passwords…', 'Almost done…'];

function ParseLoading() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % LOADING_MESSAGES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <Loader2 size={28} className="animate-spin text-accent-400" />
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[13px] text-surface-400"
        >
          {LOADING_MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

interface Draft extends ExtractedCredential {
  selected: boolean;
}

export default function ImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (entries: ExtractedCredential[]) => void;
}) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRawText('');
      setDrafts(null);
      setError(null);
    }
  }, [open]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  }

  async function runParse() {
    if (!window.nexus) {
      setError('Import only works inside the Nexus desktop app.');
      return;
    }
    if (!rawText.trim()) {
      setError('Paste your notes or choose a .txt file first.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await window.nexus.parseImportText(rawText);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.results.length === 0) {
      setError("Couldn't find any credentials in that text.");
      return;
    }
    setDrafts(res.results.map((r) => ({ ...r, selected: true })));
  }

  function updateDraft(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => (prev ? prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) : prev));
  }

  function removeDraft(i: number) {
    setDrafts((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
  }

  function commitImport() {
    if (!drafts) return;
    const selected = drafts.filter((d) => d.selected).map(({ selected: _s, ...rest }) => rest);
    if (selected.length === 0) return;
    onImport(selected);
    onClose();
  }

  const selectedCount = drafts?.filter((d) => d.selected).length ?? 0;

  return (
    <Modal open={open} onClose={onClose} title="Import passwords" width="max-w-3xl">
      {!drafts && !loading && (
        <div>
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[12px] text-amber-200/90">
              This text — including any plaintext passwords — is sent to OpenAI to extract structured entries. If
              you're not comfortable with that, add entries manually instead.
            </p>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={handleFile} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className={buttonSecondaryClass}>
              <Upload size={13} /> Choose .txt file
            </button>
            <span className="text-[12px] text-surface-500">or paste below</span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={'Gmail\nuser: me@gmail.com\npass: hunter2\n\nGCash\n09171234567 / mypassword123'}
            rows={10}
            className={`w-full font-mono text-[12px] ${inputClass}`}
          />

          {error && <p className="mt-2 text-[12px] text-rose-400">{error}</p>}

          <button onClick={runParse} className={`mt-3 ${buttonPrimaryClass}`}>
            <Sparkles size={14} /> Parse with AI
          </button>
        </div>
      )}

      {loading && <ParseLoading />}

      {drafts && !loading && (
        <div>
          <p className="mb-3 text-[12px] text-surface-500">
            Found {drafts.length} {drafts.length === 1 ? 'entry' : 'entries'}. Review, edit, or remove before
            importing.
          </p>
          <div className="mb-4 max-h-[50vh] space-y-2 overflow-y-auto">
            {drafts.map((d, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-surface-800 p-2.5">
                <input
                  type="checkbox"
                  checked={d.selected}
                  onChange={(e) => updateDraft(i, { selected: e.target.checked })}
                  className="mt-2 accent-accent-500"
                />
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
                  <input
                    value={d.title}
                    onChange={(e) => updateDraft(i, { title: e.target.value })}
                    placeholder="Title"
                    className={`col-span-2 ${inputClass}`}
                  />
                  <input
                    value={d.username}
                    onChange={(e) => updateDraft(i, { username: e.target.value })}
                    placeholder="Username"
                    className={inputClass}
                  />
                  <input
                    value={d.password}
                    onChange={(e) => updateDraft(i, { password: e.target.value })}
                    placeholder="Password"
                    className={`font-mono ${inputClass}`}
                  />
                  <input
                    value={d.url}
                    onChange={(e) => updateDraft(i, { url: e.target.value })}
                    placeholder="URL"
                    className={`col-span-2 ${inputClass}`}
                  />
                </div>
                <button onClick={() => removeDraft(i)} className={buttonGhostIconClass}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={commitImport} disabled={selectedCount === 0} className={buttonPrimaryClass}>
              <Check size={14} /> Import {selectedCount} {selectedCount === 1 ? 'entry' : 'entries'}
            </button>
            <button onClick={() => setDrafts(null)} className={buttonSecondaryClass}>
              Back
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

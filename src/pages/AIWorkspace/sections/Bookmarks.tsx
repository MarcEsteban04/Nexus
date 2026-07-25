import { FormEvent, useState } from 'react';
import { ExternalLink, X, Plus, Bookmark } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useAiWorkspaceStore } from '@/store/aiWorkspaceStore';

export default function Bookmarks() {
  const { bookmarks, addBookmark, removeBookmark } = useAiWorkspaceStore();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title || !url) return;
    addBookmark({ title, url, notes });
    setTitle('');
    setUrl('');
    setNotes('');
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-center gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className={`min-w-0 flex-1 basis-40 ${inputClass}`} />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
        <button type="submit" title="Add bookmark" className={buttonIconPrimaryClass}>
          <Plus size={16} />
        </button>
      </form>

      <div className="space-y-1">
        {bookmarks.length === 0 && <EmptyState icon={Bookmark} label="No AI bookmarks yet." />}
        {bookmarks.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
            <a href={b.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1.5 text-[13px] text-surface-100 hover:underline">
              <span className="truncate">{b.title}</span>
              <ExternalLink size={11} className="shrink-0 text-surface-500" />
            </a>
            <div className="flex items-center gap-3">
              {b.notes && <span className="text-[12px] text-surface-500">{b.notes}</span>}
              <button onClick={() => removeBookmark(b.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Code2, Bookmark } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Prompts from './sections/Prompts';
import Snippets from './sections/Snippets';
import Bookmarks from './sections/Bookmarks';

const TABS = [
  { key: 'prompts', label: 'Prompt Library', icon: Sparkles, component: Prompts },
  { key: 'snippets', label: 'Code Snippets', icon: Code2, component: Snippets },
  { key: 'bookmarks', label: 'AI Bookmarks', icon: Bookmark, component: Bookmarks },
];

export default function AIWorkspace() {
  const [active, setActive] = useState(TABS[0].key);
  const Active = TABS.find((t) => t.key === active)!.component;

  return (
    <div>
      <PageHeader title="AI Workspace" subtitle="One place for all your AI workflows." />
      <div className="p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="ai-tab-active"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-accent-gradient shadow-glow"
                  />
                )}
                <Icon size={14} className="relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
        <Card>
          <Active />
        </Card>
      </div>
    </div>
  );
}

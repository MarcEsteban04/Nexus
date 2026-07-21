import { useState } from 'react';
import { motion } from 'framer-motion';
import { Braces, Fingerprint, Binary, Clock, KeyRound } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import JsonFormatter from './tools/JsonFormatter';
import UuidGenerator from './tools/UuidGenerator';
import Base64Tool from './tools/Base64Tool';
import TimestampConverter from './tools/TimestampConverter';
import PasswordGenerator from './tools/PasswordGenerator';

const TOOLS = [
  { key: 'json', label: 'JSON Formatter', icon: Braces, component: JsonFormatter },
  { key: 'uuid', label: 'UUID Generator', icon: Fingerprint, component: UuidGenerator },
  { key: 'base64', label: 'Base64', icon: Binary, component: Base64Tool },
  { key: 'timestamp', label: 'Timestamp', icon: Clock, component: TimestampConverter },
  { key: 'password', label: 'Password Generator', icon: KeyRound, component: PasswordGenerator },
];

export default function Toolbox() {
  const [active, setActive] = useState(TOOLS[0].key);
  const activeTool = TOOLS.find((t) => t.key === active)!;
  const Active = activeTool.component;

  return (
    <div>
      <PageHeader title="Developer Toolbox" subtitle="Stop opening random websites." />
      <div className="p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {TOOLS.map((t) => {
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
                    layoutId="tool-tab-active"
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

import { FormEvent, useState } from 'react';
import { Landmark, Smartphone, Banknote, CircleDollarSign, Plus, Minus, X, Wallet } from 'lucide-react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';
import { AccountType } from '@/types';

const TYPE_META: Record<AccountType, { label: string; icon: typeof Landmark }> = {
  bank: { label: 'Bank', icon: Landmark },
  ewallet: { label: 'E-wallet', icon: Smartphone },
  cash: { label: 'Cash', icon: Banknote },
  other: { label: 'Other', icon: CircleDollarSign },
};

export default function Accounts() {
  const { accounts, addAccount, adjustAccountBalance, removeAccount } = useMoneyStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('ewallet');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState('');
  const [adjustInputs, setAdjustInputs] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    addAccount({ name, type, institution, balance: parseFloat(balance) || 0 });
    setName('');
    setInstitution('');
    setBalance('');
  }

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Accounts</h3>
        <span className="text-[12px] text-surface-400">{formatCurrency(totalBalance)} total</span>
      </div>
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
        <Select
          value={type}
          onChange={(v) => setType(v as AccountType)}
          options={[
            { value: 'ewallet', label: 'E-wallet' },
            { value: 'bank', label: 'Bank' },
            { value: 'cash', label: 'Cash' },
            { value: 'other', label: 'Other' },
          ]}
          className="w-32"
        />
        <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Provider (e.g. GCash)" className={`w-40 ${inputClass}`} />
        <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Starting balance" type="number" className={`w-32 ${inputClass}`} />
        <button type="submit" title="Add account" className={buttonIconPrimaryClass}>
          <Plus size={16} />
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState icon={Wallet} label="No accounts yet. Add your e-wallets or bank accounts above." />
          </div>
        )}
        {accounts.map((acc) => {
          const Icon = TYPE_META[acc.type].icon;
          return (
            <div key={acc.id} className="rounded-xl border border-surface-800 p-3">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-surface-100">{acc.name}</p>
                    <p className="text-[11px] text-surface-500">
                      {TYPE_META[acc.type].label}
                      {acc.institution && ` · ${acc.institution}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeAccount(acc.id)} className={buttonGhostIconClass}>
                  <X size={14} />
                </button>
              </div>
              <p className="mb-3 text-[20px] font-semibold tracking-tight text-surface-100">{formatCurrency(acc.balance)}</p>
              <div className="flex items-center gap-2">
                <input
                  value={adjustInputs[acc.id] || ''}
                  onChange={(e) => setAdjustInputs((p) => ({ ...p, [acc.id]: e.target.value }))}
                  placeholder="Amount"
                  type="number"
                  className={`min-w-0 flex-1 ${inputClass}`}
                />
                <button
                  title="Deposit"
                  disabled={!parseFloat(adjustInputs[acc.id] || '0')}
                  onClick={() => {
                    const amt = parseFloat(adjustInputs[acc.id] || '0');
                    if (amt > 0) {
                      adjustAccountBalance(acc.id, amt);
                      setAdjustInputs((p) => ({ ...p, [acc.id]: '' }));
                    }
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
                <button
                  title="Withdraw"
                  disabled={!parseFloat(adjustInputs[acc.id] || '0')}
                  onClick={() => {
                    const amt = parseFloat(adjustInputs[acc.id] || '0');
                    if (amt > 0) {
                      adjustAccountBalance(acc.id, -amt);
                      setAdjustInputs((p) => ({ ...p, [acc.id]: '' }));
                    }
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 transition-colors hover:bg-rose-500/25 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

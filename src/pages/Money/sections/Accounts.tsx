import { FormEvent, useState } from 'react';
import { Landmark, Smartphone, Banknote, CircleDollarSign, Plus, Minus, X, Wallet, Eye, EyeOff } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import ConfirmDialog from '@/components/ConfirmDialog';
import { inputClass, buttonPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';
import { getInstitutionBadge } from '@/utils/institutionBadge';
import { Account, AccountType } from '@/types';

const TYPE_META: Record<AccountType, { label: string; icon: typeof Landmark }> = {
  bank: { label: 'Bank', icon: Landmark },
  ewallet: { label: 'E-wallet', icon: Smartphone },
  cash: { label: 'Cash', icon: Banknote },
  other: { label: 'Other', icon: CircleDollarSign },
};

function AccountCard({
  account,
  adjustValue,
  onAdjustChange,
  onDeposit,
  onWithdraw,
  onDelete,
}: {
  account: Account;
  adjustValue: string;
  onAdjustChange: (v: string) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onDelete: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  const badge = getInstitutionBadge(account.institution);
  const Icon = TYPE_META[account.type].icon;

  return (
    <div className="rounded-xl border border-surface-800 p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {badge ? (
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-bold ${badge.className}`}>
              {badge.label}
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
              <Icon size={16} />
            </div>
          )}
          <div>
            <p className="text-[13px] font-medium text-surface-100">{account.name}</p>
            <p className="text-[11px] text-surface-500">
              {TYPE_META[account.type].label}
              {account.institution && ` · ${account.institution}`}
            </p>
          </div>
        </div>
        <button onClick={onDelete} className={buttonGhostIconClass}>
          <X size={14} />
        </button>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <p className="text-[20px] font-semibold tracking-tight text-surface-100">
          {hidden ? '₱ • • • • •' : formatCurrency(account.balance)}
        </p>
        <button onClick={() => setHidden((h) => !h)} className="text-surface-500 transition-colors hover:text-surface-200">
          {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={adjustValue}
          onChange={(e) => onAdjustChange(e.target.value)}
          placeholder="Amount"
          type="number"
          className={`min-w-0 flex-1 ${inputClass}`}
        />
        <button
          title="Deposit"
          disabled={!parseFloat(adjustValue || '0')}
          onClick={onDeposit}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus size={15} />
        </button>
        <button
          title="Withdraw"
          disabled={!parseFloat(adjustValue || '0')}
          onClick={onWithdraw}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 transition-colors hover:bg-rose-500/25 disabled:pointer-events-none disabled:opacity-40"
        >
          <Minus size={15} />
        </button>
      </div>
    </div>
  );
}

export default function Accounts() {
  const { accounts, addAccount, adjustAccountBalance, removeAccount } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('ewallet');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState('');
  const [adjustInputs, setAdjustInputs] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

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
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-surface-400">{formatCurrency(totalBalance)} total</span>
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState icon={Wallet} label="No accounts yet. Add your e-wallets or bank accounts above." />
          </div>
        )}
        {accounts.map((acc) => (
          <AccountCard
            key={acc.id}
            account={acc}
            adjustValue={adjustInputs[acc.id] || ''}
            onAdjustChange={(v) => setAdjustInputs((p) => ({ ...p, [acc.id]: v }))}
            onDeposit={() => {
              const amt = parseFloat(adjustInputs[acc.id] || '0');
              if (amt > 0) {
                adjustAccountBalance(acc.id, amt);
                setAdjustInputs((p) => ({ ...p, [acc.id]: '' }));
              }
            }}
            onWithdraw={() => {
              const amt = parseFloat(adjustInputs[acc.id] || '0');
              if (amt > 0) {
                adjustAccountBalance(acc.id, -amt);
                setAdjustInputs((p) => ({ ...p, [acc.id]: '' }));
              }
            }}
            onDelete={() => setDeleteTarget(acc)}
          />
        ))}
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add account">
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" className={`w-full ${inputClass}`} />
          <Select
            value={type}
            onChange={(v) => setType(v as AccountType)}
            options={[
              { value: 'ewallet', label: 'E-wallet' },
              { value: 'bank', label: 'Bank' },
              { value: 'cash', label: 'Cash' },
              { value: 'other', label: 'Other' },
            ]}
            className="w-full"
          />
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Provider (e.g. GCash)" className={`w-full ${inputClass}`} />
          <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Starting balance" type="number" className={`w-full ${inputClass}`} />
          <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
            <Plus size={14} /> Add account
          </button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete account"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This won't delete its past transactions, but you'll lose track of its balance (${formatCurrency(deleteTarget.balance)}).`
            : ''
        }
        onConfirm={() => {
          if (deleteTarget) removeAccount(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

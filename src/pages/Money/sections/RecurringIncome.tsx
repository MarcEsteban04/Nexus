import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Plus, Wallet, X, Pencil, ImagePlus, CheckCircle2, ReceiptText, RefreshCw, CalendarClock } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { usePayoneerStore } from '@/store/payoneerStore';
import { useLinkedTransaction } from '@/hooks/useLinkedTransaction';
import {
  formatCurrency,
  toMonthlyFromFrequency,
  advanceDate,
  advanceSemiMonthly,
  nextOccurrenceForDay,
  dayOfMonth,
} from '@/utils/money';
import { IncomeCurrency, IncomeFrequency, RecurringIncome as RecurringIncomeType } from '@/types';

function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const FREQUENCY_LABEL: Record<IncomeFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  semimonthly: 'Semi-monthly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly (every 7 days)' },
  { value: 'biweekly', label: 'Biweekly (every 2 weeks, ~26x/yr)' },
  { value: 'semimonthly', label: 'Semi-monthly (2 fixed cutoffs/month, e.g. 1 & 15)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function IncomeForm({
  initial,
  onSubmit,
}: {
  initial?: RecurringIncomeType;
  onSubmit: (data: Omit<RecurringIncomeType, 'id'>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [currency, setCurrency] = useState<IncomeCurrency>(initial?.currency ?? 'PHP');
  const [frequency, setFrequency] = useState<IncomeFrequency>(initial?.frequency ?? 'monthly');
  const [day, setDay] = useState(
    initial ? String(initial.payDay1 ?? dayOfMonth(initial.nextDate)) : String(new Date().getDate()),
  );
  const [day2, setDay2] = useState(initial?.payDay2 != null ? String(initial.payDay2) : '15');

  const isSemiMonthly = frequency === 'semimonthly';

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || !name) return;
    const d1 = parseInt(day, 10) || 1;
    const d2 = parseInt(day2, 10) || 15;
    onSubmit({
      name,
      amount: value,
      currency,
      frequency,
      nextDate: isSemiMonthly ? nextOccurrenceForDay(Math.min(d1, d2)) : nextOccurrenceForDay(d1),
      payDay1: isSemiMonthly ? d1 : null,
      payDay2: isSemiMonthly ? d2 : null,
    });
    if (!initial) {
      setName('');
      setAmount('');
      setCurrency('PHP');
      setFrequency('monthly');
      setDay(String(new Date().getDate()));
      setDay2('15');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Source (e.g. Salary)" className={`w-full ${inputClass}`} />
      <div className="flex items-center gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`flex-1 ${inputClass}`} />
        <Select
          value={currency}
          onChange={(v) => setCurrency(v as IncomeCurrency)}
          options={[
            { value: 'PHP', label: 'PHP' },
            { value: 'USD', label: 'USD' },
          ]}
          className="w-28"
        />
      </div>
      <Select value={frequency} onChange={(v) => setFrequency(v as IncomeFrequency)} options={FREQUENCY_OPTIONS} className="w-full" />
      {isSemiMonthly ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              First cutoff day
            </label>
            <input value={day} onChange={(e) => setDay(e.target.value)} type="number" min={1} max={31} className={`w-full ${inputClass}`} />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Second cutoff day
            </label>
            <input value={day2} onChange={(e) => setDay2(e.target.value)} type="number" min={1} max={31} className={`w-full ${inputClass}`} />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
            Day it lands on (1–31)
          </label>
          <input value={day} onChange={(e) => setDay(e.target.value)} type="number" min={1} max={31} className={`w-full ${inputClass}`} />
        </div>
      )}
      <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
        {initial ? <Pencil size={14} /> : <Plus size={14} />} {initial ? 'Save changes' : 'Add income source'}
      </button>
    </form>
  );
}

function LogIncomeDrawer({ income, onClose }: { income: RecurringIncomeType | null; onClose: () => void }) {
  const { accounts, lastAccountId, updateRecurringIncome } = useMoneyStore();
  const { marginPercent, setMarginPercent, midMarketRate, loading, error, fetchMidMarketRate, effectiveRate } =
    usePayoneerStore();
  const createLinkedTransaction = useLinkedTransaction();
  const [accountId, setAccountId] = useState(lastAccountId ?? '');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [rateOverride, setRateOverride] = useState('');

  const isUsd = income?.currency === 'USD';

  useEffect(() => {
    if (income && isUsd && midMarketRate === null) fetchMidMarketRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income]);

  useEffect(() => {
    if (income && isUsd) {
      const rate = effectiveRate();
      setRateOverride(rate != null ? rate.toFixed(4) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income, midMarketRate, marginPercent]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(String(reader.result ?? ''));
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const rate = parseFloat(rateOverride);
  const phpAmount = income ? (isUsd ? income.amount * (rate || 0) : income.amount) : 0;

  function confirm() {
    if (!income || !accountId) return;
    if (isUsd && !rate) return;
    createLinkedTransaction({
      type: 'income',
      amount: phpAmount,
      category: income.name,
      note: isUsd ? `Recurring income — ${income.name} (${formatUsd(income.amount)} @ ₱${rate.toFixed(2)}/USD)` : `Recurring income — ${income.name}`,
      date: new Date().toISOString().slice(0, 10),
      accountId,
      receiptImage,
    });
    let nextDate: string;
    if (income.frequency === 'semimonthly') {
      nextDate = advanceSemiMonthly(income.nextDate, income.payDay1 ?? 1, income.payDay2 ?? 15);
    } else {
      nextDate = advanceDate(income.nextDate, income.frequency);
    }
    updateRecurringIncome(income.id, { nextDate });
    setReceiptImage(null);
    onClose();
  }

  return (
    <Drawer open={!!income} onClose={onClose} title="Log income">
      {income && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-800 p-3 text-[13px]">
            <p className="font-medium text-surface-100">{income.name}</p>
            <p className="mt-1 font-semibold text-emerald-400">
              +{isUsd ? formatUsd(income.amount) : formatCurrency(income.amount)}
            </p>
          </div>

          {isUsd && (
            <div className="rounded-xl border border-surface-800 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-surface-400">
                  Payoneer-style conversion
                </span>
                <button onClick={() => fetchMidMarketRate()} disabled={loading} className="text-surface-500 hover:text-accent-400">
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-[12px] text-surface-500">Margin below mid-market</label>
                <input
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                  type="number"
                  step="0.1"
                  className={`w-20 ${inputClass}`}
                />
                <span className="text-[12px] text-surface-500">%</span>
              </div>
              {midMarketRate != null && (
                <p className="mb-2 text-[11px] text-surface-500">Mid-market: ₱{midMarketRate.toFixed(4)} / USD</p>
              )}
              {error && <p className="mb-2 text-[12px] text-rose-400">{error}</p>}
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
                Rate used (check your Payoneer app and overwrite if it differs)
              </label>
              <input
                value={rateOverride}
                onChange={(e) => setRateOverride(e.target.value)}
                type="number"
                step="0.0001"
                placeholder="PHP per USD"
                className={`w-full ${inputClass}`}
              />
              <p className="mt-2 text-[13px] text-surface-300">
                {formatUsd(income.amount)} → <span className="font-semibold text-surface-100">{formatCurrency(phpAmount)}</span>
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Deposit to account
            </label>
            {accounts.length === 0 ? (
              <p className="text-[12px] text-surface-500">No accounts yet — add one in Accounts first.</p>
            ) : (
              <Select
                value={accountId}
                onChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))}
                className="w-full"
              />
            )}
          </div>
          <label className={`flex w-full cursor-pointer items-center justify-center gap-2 ${buttonSecondaryClass}`}>
            <ImagePlus size={13} /> {receiptImage ? 'Payslip attached' : 'Attach payslip (optional)'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          {receiptImage && <img src={receiptImage} alt="" className="h-24 w-full rounded-lg object-cover" />}
          <button onClick={confirm} disabled={!accountId || (isUsd && !rate)} className={`w-full ${buttonPrimaryClass}`}>
            <CheckCircle2 size={14} /> Log this income
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default function RecurringIncome() {
  const { recurringIncomes, addRecurringIncome, updateRecurringIncome, removeRecurringIncome } = useMoneyStore();
  const { effectiveRate } = usePayoneerStore();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringIncomeType | null>(null);
  const [logTarget, setLogTarget] = useState<RecurringIncomeType | null>(null);

  const rate = effectiveRate();
  const monthlyTotal = recurringIncomes.reduce((a, i) => {
    const monthlyInOwnCurrency = toMonthlyFromFrequency(i.amount, i.frequency);
    return a + (i.currency === 'USD' ? monthlyInOwnCurrency * (rate ?? 0) : monthlyInOwnCurrency);
  }, 0);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Recurring income</h3>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-emerald-400">{formatCurrency(monthlyTotal)} / mo</span>
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      {recurringIncomes.length === 0 ? (
        <EmptyState icon={Wallet} label="No recurring income sources yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recurringIncomes.map((i) => {
            const isUsd = i.currency === 'USD';
            const phpEstimate = isUsd && rate != null ? i.amount * rate : null;
            return (
              <div key={i.id} className="rounded-xl border border-surface-800 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-surface-100">{i.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="rounded-full bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-surface-400">
                          {FREQUENCY_LABEL[i.frequency]}
                        </span>
                        {isUsd && (
                          <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-400">
                            USD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditTarget(i)} className={buttonGhostIconClass}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeRecurringIncome(i.id)} className={buttonGhostIconClass}>
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-[22px] font-semibold tracking-tight text-emerald-400">
                  +{isUsd ? formatUsd(i.amount) : formatCurrency(i.amount)}
                </p>
                {isUsd && (
                  <p className="mt-0.5 text-[11px] text-surface-500">
                    ≈ {phpEstimate != null ? formatCurrency(phpEstimate) : '—'} at current est. rate
                  </p>
                )}

                <p className="mt-2 flex items-center gap-1 text-[11px] text-surface-500">
                  <CalendarClock size={11} /> Next on {i.nextDate}
                </p>

                <button onClick={() => setLogTarget(i)} className={`mt-3 w-full ${buttonSecondaryClass}`}>
                  <ReceiptText size={13} /> Log income
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Add recurring income">
        <IncomeForm onSubmit={addRecurringIncome} />
      </Drawer>

      <Drawer open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit recurring income">
        {editTarget && (
          <IncomeForm
            initial={editTarget}
            onSubmit={(data) => {
              updateRecurringIncome(editTarget.id, data);
              setEditTarget(null);
            }}
          />
        )}
      </Drawer>

      <LogIncomeDrawer income={logTarget} onClose={() => setLogTarget(null)} />
    </Card>
  );
}

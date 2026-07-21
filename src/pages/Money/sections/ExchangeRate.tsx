import { useEffect, useState } from 'react';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import Card from '@/components/Card';
import Select from '@/components/Select';
import { inputClass, buttonSecondaryClass } from '@/components/ui';
import { useExchangeRateStore, CURRENCIES, Currency } from '@/store/exchangeRateStore';

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c, label: c }));

export default function ExchangeRate() {
  const { base, quote, rate, updatedAt, isManual, loading, error, setBase, setQuote, swap, setManualRate, fetchRate } =
    useExchangeRateStore();

  const [amount, setAmount] = useState('1');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (rate === null) fetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, quote]);

  const parsedAmount = parseFloat(amount) || 0;
  const converted = rate != null ? parsedAmount * rate : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-surface-100">Currency converter</h3>
          <button onClick={() => fetchRate()} disabled={loading} className={buttonSecondaryClass}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={base} onChange={(v) => setBase(v as Currency)} options={CURRENCY_OPTIONS} className="w-24" />
          <button onClick={swap} title="Swap currencies" className="rounded-xl bg-surface-800 p-2 text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100">
            <ArrowLeftRight size={15} />
          </button>
          <Select value={quote} onChange={(v) => setQuote(v as Currency)} options={CURRENCY_OPTIONS} className="w-24" />

          <div className="ml-auto text-right">
            {rate != null ? (
              <>
                <p className="text-[13px] font-semibold text-surface-100">
                  1 {base} = {rate.toFixed(4)} {quote}
                </p>
                <p className="text-[11px] text-surface-500">
                  {isManual ? 'Manual rate' : 'Live rate'}
                  {updatedAt && ` · updated ${new Date(updatedAt).toLocaleString()}`}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-surface-500">{loading ? 'Fetching rate…' : 'No rate yet'}</p>
            )}
          </div>
        </div>

        {error && <p className="mb-4 text-[12px] text-rose-400">{error}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Amount in {base}
            </label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className={`w-full ${inputClass}`} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Converted ({quote})
            </label>
            <div className="rounded-xl border border-surface-800 bg-surface-950 px-3 py-2 text-[13px] font-semibold text-surface-100">
              {converted != null ? converted.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Manual override</h3>
        <p className="mb-3 text-[12px] text-surface-500">
          No internet? Set the rate by hand — it's used until you refresh again.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={`1 ${base} = ? ${quote}`}
            type="number"
            className={`w-40 ${inputClass}`}
          />
          <button
            onClick={() => {
              const v = parseFloat(manualInput);
              if (v > 0) {
                setManualRate(v);
                setManualInput('');
              }
            }}
            className={buttonSecondaryClass}
          >
            Set rate
          </button>
        </div>
      </Card>
    </div>
  );
}

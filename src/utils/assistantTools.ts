import { useMoneyStore } from '@/store/moneyStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useShoppingStore } from '@/store/shoppingStore';
import { formatCurrency } from '@/utils/money';
import { EventRecurrence } from '@/types';

export const ASSISTANT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_account',
      description: "Create a new account (bank, e-wallet, cash, or other) in the user's Money Manager.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: "The account's display name, e.g. 'Maya' or 'BDO Savings'." },
          type: { type: 'string', enum: ['bank', 'ewallet', 'cash', 'other'] },
          institution: { type: 'string', description: "Bank/e-wallet brand name if known, e.g. 'Maya', 'BDO'. Otherwise same as name." },
          balance: { type: 'number', description: 'Starting balance in PHP. Defaults to 0 if omitted.' },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: "Log a money transaction (income or expense) to the user's Money Manager.",
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'] },
          amount: { type: 'number', description: 'Positive amount in PHP.' },
          category: { type: 'string', description: 'e.g. Groceries, Salary, Transport.' },
          note: { type: 'string', description: 'Short optional note.' },
          date: { type: 'string', description: 'YYYY-MM-DD. Defaults to today if omitted.' },
          accountName: { type: 'string', description: "Name of the account to use, if the user mentioned one (e.g. 'BDO', 'GCash')." },
        },
        required: ['type', 'amount', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_calendar_event',
      description: "Add an event to the user's Calendar.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:MM 24-hour, optional' },
          category: { type: 'string', description: 'optional' },
          recurrence: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'] },
        },
        required: ['title', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_bill_paid',
      description: "Mark one of the user's bills as paid, logging it as an expense transaction.",
      parameters: {
        type: 'object',
        properties: {
          billName: { type: 'string', description: 'The bill name or a close match to it.' },
        },
        required: ['billName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_wishlist_item',
      description: "Add an item to the user's Shopping wishlist.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number', description: 'optional, in PHP' },
          store: { type: 'string', description: 'optional' },
        },
        required: ['name'],
      },
    },
  },
];

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: string;
}

export interface ParsedToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  description: string;
}

export function parseToolCall(call: ToolCallRequest): ParsedToolCall | null {
  let args: Record<string, unknown> = {};
  try {
    args = call.arguments ? JSON.parse(call.arguments) : {};
  } catch {
    return null;
  }

  const description = describeToolCall(call.name, args);
  if (!description) return null;
  return { id: call.id, name: call.name, args, description };
}

function describeToolCall(name: string, args: Record<string, unknown>): string | null {
  switch (name) {
    case 'add_account':
      return `Create a new ${args.type ?? 'other'} account named "${args.name}"${args.balance ? ` with a starting balance of ${formatCurrency(Number(args.balance) || 0)}` : ' with a ₱0 starting balance'}?`;
    case 'add_transaction':
      return `Log ${args.type === 'income' ? '+' : '-'}${formatCurrency(Number(args.amount) || 0)} (${args.category}) as a${args.type === 'income' ? 'n income' : 'n expense'}${args.note ? ` — "${args.note}"` : ''}${args.accountName ? ` to ${args.accountName}` : ''}?`;
    case 'add_calendar_event':
      return `Add "${args.title}" to your calendar on ${args.date}${args.time ? ` at ${args.time}` : ''}${args.recurrence && args.recurrence !== 'none' ? ` (repeating ${args.recurrence})` : ''}?`;
    case 'mark_bill_paid':
      return `Mark "${args.billName}" as paid and log it as an expense?`;
    case 'add_wishlist_item':
      return `Add "${args.name}"${args.price != null ? ` (₱${args.price})` : ''}${args.store ? ` from ${args.store}` : ''} to your wishlist?`;
    default:
      return null;
  }
}

export function executeToolCall(call: ParsedToolCall): string {
  const { name, args } = call;

  if (name === 'add_account') {
    const money = useMoneyStore.getState();
    const accountType = typeof args.type === 'string' && ['bank', 'ewallet', 'cash', 'other'].includes(args.type) ? args.type : 'other';
    const name_ = typeof args.name === 'string' ? args.name : 'New account';
    money.addAccount({
      name: name_,
      type: accountType as 'bank' | 'ewallet' | 'cash' | 'other',
      institution: typeof args.institution === 'string' ? args.institution : name_,
      balance: typeof args.balance === 'number' ? args.balance : 0,
    });
    return `✅ Created account "${name_}" (${accountType}) with a starting balance of ${formatCurrency(typeof args.balance === 'number' ? args.balance : 0)}.`;
  }

  if (name === 'add_transaction') {
    const money = useMoneyStore.getState();
    const type = args.type === 'income' ? 'income' : 'expense';
    const amount = Math.abs(Number(args.amount) || 0);
    const accountName = typeof args.accountName === 'string' ? args.accountName.toLowerCase() : '';
    const matchedAccount = accountName ? money.accounts.find((a) => a.name.toLowerCase().includes(accountName)) : null;
    const accountId = matchedAccount?.id ?? money.lastAccountId ?? money.accounts[0]?.id ?? null;

    money.addTransaction({
      type,
      amount,
      category: typeof args.category === 'string' ? args.category : 'Other',
      note: typeof args.note === 'string' ? args.note : '',
      date: typeof args.date === 'string' && args.date ? args.date : new Date().toISOString().slice(0, 10),
      accountId,
      receiptId: null,
    });
    return `✅ Logged ${type === 'income' ? '+' : '-'}${formatCurrency(amount)} under ${args.category}${matchedAccount ? ` (${matchedAccount.name})` : ''}.`;
  }

  if (name === 'add_calendar_event') {
    const calendar = useCalendarStore.getState();
    calendar.addEvent({
      title: typeof args.title === 'string' ? args.title : 'Untitled event',
      date: typeof args.date === 'string' && args.date ? args.date : new Date().toISOString().slice(0, 10),
      time: typeof args.time === 'string' ? args.time : '',
      category: typeof args.category === 'string' ? args.category : '',
      notes: '',
      recurrence: (typeof args.recurrence === 'string' ? args.recurrence : 'none') as EventRecurrence,
      reminderMinutes: null,
    });
    return `✅ Added "${args.title}" to your calendar.`;
  }

  if (name === 'mark_bill_paid') {
    const money = useMoneyStore.getState();
    const nameQuery = typeof args.billName === 'string' ? args.billName.toLowerCase() : '';
    const bill = money.bills.find((b) => !b.paid && b.name.toLowerCase().includes(nameQuery));
    if (!bill) return `⚠️ Couldn't find an unpaid bill matching "${args.billName}".`;

    const accountId = money.lastAccountId ?? money.accounts[0]?.id ?? null;
    const transactionId = money.addTransaction({
      type: 'expense',
      amount: bill.amount,
      category: bill.name,
      note: `Bill payment — ${bill.name}`,
      date: new Date().toISOString().slice(0, 10),
      accountId,
      receiptId: null,
    });
    money.markBillPaid(bill.id, transactionId);
    return `✅ Marked "${bill.name}" as paid (${formatCurrency(bill.amount)}).`;
  }

  if (name === 'add_wishlist_item') {
    const shopping = useShoppingStore.getState();
    shopping.addItem({
      name: typeof args.name === 'string' ? args.name : 'Untitled item',
      price: typeof args.price === 'number' ? args.price : undefined,
      store: typeof args.store === 'string' ? args.store : undefined,
    });
    return `✅ Added "${args.name}" to your wishlist.`;
  }

  return "⚠️ I don't know how to do that yet.";
}

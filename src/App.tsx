import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import MoneyLayout from '@/pages/Money/MoneyLayout';
import Overview from '@/pages/Money/sections/Overview';
import Accounts from '@/pages/Money/sections/Accounts';
import Transactions from '@/pages/Money/sections/Transactions';
import Bills from '@/pages/Money/sections/Bills';
import Subscriptions from '@/pages/Money/sections/Subscriptions';
import Debt from '@/pages/Money/sections/Debt';
import Savings from '@/pages/Money/sections/Savings';
import RecurringIncome from '@/pages/Money/sections/RecurringIncome';
import ExchangeRate from '@/pages/Money/sections/ExchangeRate';
import Shopping from '@/pages/Shopping/Shopping';
import Toolbox from '@/pages/Toolbox/Toolbox';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/money" element={<MoneyLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="bills" element={<Bills />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="debt" element={<Debt />} />
          <Route path="savings" element={<Savings />} />
          <Route path="income" element={<RecurringIncome />} />
          <Route path="exchange" element={<ExchangeRate />} />
        </Route>
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/toolbox" element={<Toolbox />} />
      </Route>
    </Routes>
  );
}

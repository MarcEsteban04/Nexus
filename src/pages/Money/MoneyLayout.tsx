import { Outlet } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';

export default function MoneyLayout() {
  return (
    <div>
      <PageHeader title="Money Manager" subtitle="Offline-first finance dashboard." />
      <div className="p-8">
        <Outlet />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  Wrench,
  Moon,
  Sun,
  ChevronDown,
  LayoutGrid,
  ArrowLeftRight,
  Receipt,
  Repeat,
  CreditCard,
  PiggyBank,
  Coins,
  Landmark,
} from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import TitleBar from '@/components/TitleBar';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    to: '/money',
    label: 'Money Manager',
    icon: Wallet,
    children: [
      { to: '/money/overview', label: 'Overview', icon: LayoutGrid },
      { to: '/money/accounts', label: 'Accounts', icon: Landmark },
      { to: '/money/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/money/bills', label: 'Bills', icon: Receipt },
      { to: '/money/subscriptions', label: 'Subscriptions', icon: Repeat },
      { to: '/money/debt', label: 'Debt', icon: CreditCard },
      { to: '/money/savings', label: 'Savings', icon: PiggyBank },
      { to: '/money/income', label: 'Recurring Income', icon: Wallet },
      { to: '/money/exchange', label: 'Exchange Rate', icon: Coins },
    ],
  },
  { to: '/shopping', label: 'Shopping Hub', icon: ShoppingBag },
  { to: '/toolbox', label: 'Dev Toolbox', icon: Wrench },
];

export default function MainLayout() {
  const { theme, toggle } = useThemeStore();
  const location = useLocation();
  const [expanded, setExpanded] = useState<string | null>(
    NAV_ITEMS.find((item) => item.children && location.pathname.startsWith(item.to))?.to ?? null,
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-950 text-surface-100">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-surface-800 bg-surface-900">
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isParentActive = location.pathname.startsWith(item.to);
              const isExactActive = item.end ? location.pathname === item.to : isParentActive;

              if (item.children) {
                const isOpen = expanded === item.to;
                return (
                  <div key={item.to}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.to)}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                        isParentActive ? 'text-white' : 'text-surface-300 hover:bg-surface-800 hover:text-surface-100'
                      }`}
                    >
                      {isParentActive && (
                        <motion.div
                          layoutId="nav-active"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-xl bg-accent-gradient shadow-glow"
                        />
                      )}
                      <Icon size={17} strokeWidth={2.25} className="relative z-10" />
                      <span className="relative z-10 flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        size={15}
                        className={`relative z-10 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-surface-800 pl-3">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <NavLink
                                  key={child.to}
                                  to={child.to}
                                  className={({ isActive }) =>
                                    `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                                      isActive
                                        ? 'bg-surface-800 text-accent-400'
                                        : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-100'
                                    }`
                                  }
                                >
                                  <ChildIcon size={14} />
                                  {child.label}
                                </NavLink>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                    isExactActive ? 'text-white' : 'text-surface-300 hover:bg-surface-800 hover:text-surface-100'
                  }`}
                >
                  {isExactActive && (
                    <motion.div
                      layoutId="nav-active"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-xl bg-accent-gradient shadow-glow"
                    />
                  )}
                  <Icon size={17} strokeWidth={2.25} className="relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-surface-800 p-3">
            <button
              onClick={toggle}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-800 px-3 py-2.5 text-[13px] font-semibold text-surface-200 transition-colors hover:bg-surface-700"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

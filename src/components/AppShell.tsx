import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, LayoutDashboard, ShoppingCart, ShoppingBag, Coffee, Table, Users2, ClipboardList, Box, Layers, BookOpen, BarChart3, Clock, CheckCircle2, ListChecks, X, DollarSign, Package, Brain, History, Wine, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const logo = '/logo.jpg';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/menu', label: 'Menu items', icon: Coffee },
  { path: '/dine-and-go', label: 'Dine-and-Go', icon: Wine },
  { path: '/bills/pending', label: 'Open bills', icon: Clock },
  { path: '/bills/completed', label: 'Completed bills', icon: CheckCircle2 },
  { path: '/admin/tables', label: 'Tables', icon: Table },
  { path: '/admin/staff', label: 'Staff', icon: Users2 },
  { path: '/admin/inventory', label: 'Consumables', icon: Box },
  { path: '/admin/purchases', label: 'RFQ & Purchase', icon: ShoppingBag },
  { path: '/admin/suppliers', label: 'Suppliers', icon: Users2 },
  { path: '/admin/direct-purchase', label: 'Direct Purchase', icon: ShoppingCart },
  { path: '/admin/outsource', label: 'Outsource items', icon: Package },
  { path: '/admin/daily-direct-revenue', label: 'Daily direct revenue', icon: DollarSign },
  { path: '/admin/purchase-history', label: 'Purchase History', icon: History },
  { path: '/admin/inventory-update', label: 'Inventory Count', icon: ListChecks },
  { path: '/admin/recipes', label: 'Recipes', icon: BookOpen },
  { path: '/admin/assets', label: 'Assets', icon: Layers },
  { path: '/admin/expenses', label: 'Expenses', icon: ClipboardList },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/smart-analytics', label: 'Smart Analytics', icon: Brain },
];

const cashierNav = [
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/pos/reports', label: 'POS reports', icon: BarChart3 },
  { path: '/dine-and-go', label: 'Dine-and-Go', icon: Wine },
  { path: '/bills/pending', label: 'Open bills', icon: Clock },
  { path: '/bills/completed', label: 'Completed bills', icon: CheckCircle2 },
  { path: '/stock-on-hand', label: 'Stock on Hand', icon: Package },
  { path: '/admin/inventory-update', label: 'Inventory count', icon: ListChecks },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = user?.role === 'admin' ? adminNav : cashierNav;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 w-64 transform bg-white border-r border-slate-200 p-4 z-40 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Aveo Cafe' & Lounge" className="h-9 w-9 rounded-full border" />
            <div>
              <p className="text-sm font-semibold">Aveo Cafe' & Lounge</p>
              <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Admin' : 'Cashier'}</p>
            </div>
          </div>
          <button className="p-2" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? 'bg-[rgb(22_163_74)] text-white' : 'text-[#05093f] hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 text-current" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut className="h-4 w-4 text-current" />
            <span>Sign out</span>
          </button>
        </nav>
      </aside>

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 px-4 sm:px-6 md:px-8 relative">
          {/* Floating hamburger menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-3 rounded-full bg-white border border-slate-200 shadow-lg hover:bg-slate-50 transition"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-slate-700" />
          </button>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

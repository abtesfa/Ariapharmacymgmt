/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  LogOut,
  Infinity,
  Sun,
  Moon,
  Truck,
  FileText,
  UserRound,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
  { icon: ClipboardList, label: 'Prescriptions', path: '/dashboard/prescriptions' },
  { icon: ShoppingCart, label: 'Sales', path: '/dashboard/sale' },
  { icon: FileText, label: 'Transactions', path: '/dashboard/transactions' },
  { icon: UserRound, label: 'Patients', path: '/dashboard/patients' },
  { icon: Truck, label: 'Suppliers', path: '/dashboard/suppliers' },
  { icon: ClipboardList, label: 'Returns', path: '/dashboard/returns' },
  { icon: ShieldCheck, label: 'Audit', path: '/dashboard/audit' },
  { icon: Users, label: 'Employees', path: '/dashboard/employees' },
  { icon: ShieldCheck, label: 'Insurance', path: '/dashboard/insurance' },
  { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter(i => {
    if (!user) return false;
    if (user.role === 'Patient') return ['Dashboard', 'Prescriptions', 'Settings'].includes(i.label);
    
    // Allow all staff to see most items, but restrict HR (Employees) for Cashiers
    if (user.role === 'Cashier') return !['Inventory', 'Suppliers', 'Insurance'].includes(i.label);
    
    // Pharmacists can see almost everything
    if (user.role === 'Pharmacist') return true;
    
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-theme-bg flex flex-col p-6 border-r border-gold-brushed/20 z-50 transition-colors duration-500">
      <div className="mb-12 flex items-center justify-between">
        <NavLink to="/" className="block">
          <h1 className="font-serif text-xl font-bold italic gold-text tracking-tight leading-tight">Aria Health<br/>Pharmacy</h1>
          <p className="text-[10px] tracking-[0.2em] uppercase opacity-50 mt-1 font-sans text-theme-text">Premium Care System</p>
        </NavLink>
        
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl glass border-gold-brushed/20 text-gold-brushed hover:scale-110 transition-all"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
        {filteredItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group",
              isActive 
                ? "bg-gold-brushed/10 gold-text shadow-[0_0_20px_rgba(212,175,55,0.05)] border border-gold-brushed/20" 
                : "text-theme-text opacity-50 hover:bg-white/5 hover:opacity-100 border border-transparent"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-gold-brushed" : "opacity-50")} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gold-brushed/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-gold-brushed bg-gold-brushed/10 flex items-center justify-center text-[10px] font-bold text-gold-brushed">
              {user ? user.firstName[0] + user.lastName[0] : '??'}
            </div>
            <div>
              <p className="text-xs font-medium text-theme-text">{user ? `${user.firstName} ${user.lastName}` : 'Not Signed In'}</p>
              <p className="text-[10px] opacity-50 text-theme-text">{user ? `@${user.username} • ${user.role}` : 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-theme-text opacity-40 hover:opacity-100 hover:text-red-400 transition-all"
            title="Secure Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}


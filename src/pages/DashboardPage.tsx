/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Sidebar from '../components/layout/Sidebar';
import { Search, Loader2, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import GlobalSearch from '../components/search/GlobalSearch';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <Loader2 className="text-gold-brushed animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const location = useLocation();
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/inventory')) return 'Inventory Management';
    if (path.includes('/sale')) return 'Checkout Terminal';
    if (path.includes('/prescriptions')) return 'Prescription Registry';
    if (path.includes('/patients')) return 'Patient Directory';
    if (path.includes('/suppliers')) return 'Supply Chain Hub';
    if (path.includes('/employees')) return 'Employees';
    if (path.includes('/reports')) return 'Intelligence Reports';
    if (path.includes('/settings')) return 'System Configuration';
    if (path.includes('/analytics')) return 'Performance Analytics';
    if (path.includes('/insurance')) return 'Insurance Liaison';
    return greeting + ', ' + user.firstName;
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex transition-colors duration-500">
      {/* Premium Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <main className="flex-1 ml-64 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-gold-brushed/10 flex items-center justify-between px-10 shrink-0">
          <div className="flex flex-col">
            <h2 className="font-serif text-xl italic text-theme-text leading-tight">{getPageTitle()}</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-40 text-theme-text">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} — {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
          </div>

          {/* New Global Search Bar */}
          <div className="flex items-center gap-6 flex-1 max-w-2xl px-12">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-6">
          </div>
        </header>

        {/* Setup Warning if needed */}
        {user.role === 'Administrator' && (
          <div className="mx-10 mt-6 p-4 glass border-orange-500/20 bg-orange-500/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400">
                <SettingsIcon size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400/80">
                Initial Setup Required: Visit Settings to Synchronize the Hub Roles.
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/settings')}
              className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
            >
              Go to Settings
            </motion.button>
          </div>
        )}

        {/* Dashboard View Container */}
        <div className="p-10 flex flex-col gap-8 h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


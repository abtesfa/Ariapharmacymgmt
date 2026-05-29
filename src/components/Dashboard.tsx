/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  InventoryAlerts, 
  SalesSnapshot, 
  PendingClaims, 
  StaffActivity, 
  SupplyChain,
  VerificationQueue,
  ProfitReport,
  InsuranceReceivables,
  PersonnelGovernance,
  RevenueChart,
  RecentTransactions,
  ReportsHub
} from './dashboard/DashboardWidgets';
import PatientQuickSearch from './dashboard/PatientQuickSearch';

interface DashboardData {
  inventoryAlerts: any[];
  salesSnapshot: any;
  pendingClaims: any[];
  staffActivity: any[];
  supplyChain: any[];
  pendingPrescriptions: any[];
  profitByDrug: any[];
  insuranceSummary: any;
  employeeCount: number;
  employees: any[];
  rolesCount: number;
  recentTransactions: any[];
  revenueHistory: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        stats, 
        employees, 
        revenue, 
        topSelling, 
        profitByDrug, 
        insuranceSummary, 
        expiryAlerts,
        orders,
        logs,
        prescriptions,
        claims
      ] = await Promise.all([
        api.dashboard.stats(),
        api.employees.list(),
        api.dashboard.revenue(),
        api.dashboard.topSelling(),
        api.dashboard.profitByDrug(),
        api.dashboard.insuranceReceivables(),
        api.dashboard.expiryAlerts(),
        api.inventory.orders(),
        api.audit.list(),
        api.clinical.prescriptions(),
        api.insurance.listClaims()
      ]);
      
      setData({
        ...stats,
        employees,
        revenueHistory: revenue,
        topSelling,
        profitByDrug,
        insuranceSummary,
        inventoryAlerts: expiryAlerts,
        supplyChain: orders.slice(0, 5),
        staffActivity: logs.slice(0, 10),
        pendingPrescriptions: prescriptions.filter((p: any) => p.status === 'Active').slice(0, 5),
        pendingClaims: claims.filter((c: any) => c.status === 'Pending').slice(0, 5),
        rolesCount: 4
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Database connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPrescription = async (id: string) => {
    // MySQL implementation for verification to be added
    console.log('Verifying prescription:', id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="text-gold-brushed animate-spin" size={32} />
      </div>
    );
  }

  // Admin Specific Dashboard Layout
  if (user?.role === 'Administrator') {
    return (
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif italic text-theme-text mb-1">Command Center</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-brushed font-medium">Enterprise Resource Analytics</p>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20"
              >
                <AlertTriangle className="text-red-500" size={14} />
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                  {error.includes('permissions') 
                    ? "Security Lock: Your personnel profile lacks clearance for this node. Sync needed." 
                    : error}
                </p>
              </motion.div>
            )}
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={fetchData}
            className="p-3 bg-gold-brushed/10 rounded-2xl text-gold-brushed hover:bg-gold-brushed/20 transition-all group"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>

        {/* Top Row: Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <SalesSnapshot data={data?.salesSnapshot || {}} />
          </div>
          <div className="glass p-6 rounded-3xl relative overflow-hidden group border-blue-400/10">
            <div className="absolute top-[-10px] right-[-10px] p-6 opacity-[0.03] italic font-serif text-8xl text-blue-400 rotate-12">Staff</div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-400/10 rounded-2xl text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-black opacity-60">Active Personnel</p>
                <h3 className="font-serif text-3xl text-theme-text italic">{data?.employeeCount || 0} Members</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            <RevenueChart history={data?.revenueHistory || []} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PersonnelGovernance 
                employees={data?.employees || []} 
                rolesCount={data?.rolesCount || 0} 
              />
              <PendingClaims claims={data?.pendingClaims || []} />
            </div>
            <StaffActivity logs={data?.staffActivity || []} />
          </div>

          {/* Right Sidebar Area */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
             <ReportsHub />
             <RecentTransactions transactions={data?.recentTransactions || []} />
             <div className="flex flex-col gap-6">
                <InsuranceReceivables data={data?.insuranceSummary || { total_owed: 0, pending_claims: 0 }} />
                <SupplyChain orders={data?.supplyChain || []} />
                <InventoryAlerts alerts={data?.inventoryAlerts || []} />
             </div>
             <ProfitReport data={data?.profitByDrug || []} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif italic text-theme-text mb-1">Aria Performance Deck</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-brushed font-medium">Real-time Intelligence Node</p>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20"
            >
              <AlertTriangle className="text-red-500" size={14} />
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                {error.includes('permissions') 
                  ? "Security Lock: Profile sync required for live node access." 
                  : error}
              </p>
            </motion.div>
          )}
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchData}
          className="p-3 bg-gold-brushed/10 rounded-2xl text-gold-brushed hover:bg-gold-brushed/20 transition-all group"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

        {/* Role-Specific Banner Stats */}
      <section>
        {user?.role === 'Cashier' || user?.role === 'Administrator' ? (
          <div className="flex flex-col gap-6">
            <SalesSnapshot data={data?.salesSnapshot || {}} />
            {user?.role === 'Cashier' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/sale')}
                className="glass p-6 rounded-3xl border-gold-brushed/30 bg-gold-brushed/5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gold-brushed/10 rounded-2xl text-gold-brushed group-hover:bg-gold-brushed group-hover:text-navy-midnight transition-all">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-serif text-xl text-theme-text italic">Quick Checkout Terminal</h3>
                    <p className="text-[10px] uppercase tracking-widest text-gold-brushed font-bold">Open dispense terminal & scan barcodes</p>
                  </div>
                </div>
                <RefreshCw size={20} className="text-gold-brushed opacity-0 group-hover:opacity-100 transition-all rotate-90" />
              </motion.button>
            )}
          </div>
        ) : user?.role === 'Pharmacist' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <div className="glass p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/5 h-full">
                <h3 className="font-serif text-2xl text-theme-text italic">Clinical Oversight Mode</h3>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">Verification protocols active</p>
              </div>
            </div>
            <div className="glass p-6 rounded-3xl relative overflow-hidden group border-blue-400/10">
              <div className="absolute top-[-10px] right-[-10px] p-6 opacity-[0.03] italic font-serif text-8xl text-blue-400 rotate-12">Staff</div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-400/10 rounded-2xl text-blue-400">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-black opacity-60">Active Personnel</p>
                  <h3 className="font-serif text-3xl text-theme-text italic">{data?.employeeCount || 0} Members</h3>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

        {/* Row 1: High Priority - Role Filtered */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {user?.role === 'Pharmacist' ? (
              <VerificationQueue 
                prescriptions={data?.pendingPrescriptions || []} 
                onVerify={verifyPrescription} 
              />
            ) : user?.role === 'Cashier' ? (
              <PatientQuickSearch />
            ) : (
              <InventoryAlerts alerts={data?.inventoryAlerts || []} />
            )}
          </div>
          <div className="lg:col-span-4">
             <RecentTransactions transactions={data?.recentTransactions || []} />
          </div>
        </div>

        {/* Row 2: Operational - Role Filtered */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            {user?.role === 'Pharmacist' ? (
              <PersonnelGovernance 
                employees={data?.employees || []} 
                rolesCount={data?.rolesCount || 0} 
                isAdmin={false}
              />
            ) : (
              <div className="glass p-12 rounded-[3rem] border-gold-brushed/10 flex flex-col items-center justify-center text-center gap-4">
                <ShoppingCart className="text-gold-brushed/20" size={48} />
                <p className="text-sm font-serif italic text-theme-text opacity-50">Transaction terminal synchronized.</p>
                {user?.role === 'Cashier' && (
                  <button 
                    onClick={() => navigate('/dashboard/sale')}
                    className="mt-4 px-8 py-3 bg-gold-brushed text-navy-midnight rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                  >
                    Open New Sale
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-5">
            <InventoryAlerts alerts={data?.inventoryAlerts || []} />
          </div>
        </div>

        {/* Row 3: Admin Only Staff Activity */}
        {user?.role === 'Administrator' && (
          <div className="mt-8">
            <StaffActivity logs={data?.staffActivity || []} />
          </div>
        )}
    </div>
  );
}

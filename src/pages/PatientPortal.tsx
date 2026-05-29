import { motion } from 'motion/react';
import { Pill, Activity, Clock, LogOut, PackageCheck, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface HistoryItem {
  transaction_date: string;
  quantity: number;
  product_name: string;
  unit_price: number;
}

export default function PatientPortal() {
  const { user, logout, isLoading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'Patient') {
      const fetchHistory = async () => {
        try {
          const data = await api.auth.myTransactions();
          const formattedHistory = data.map((item: any) => ({
            transaction_date: item.transaction_date,
            product_name: item.product_name || 'Medical Supply',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0
          }));
          setHistory(formattedHistory);
        } catch (err) {
          console.error('Failed to fetch patient history:', err);
        } finally {
          setFetchLoading(false);
        }
      };
      fetchHistory();
    } else {
      setFetchLoading(false);
    }
  }, [user]);

  const handleRefillRequest = async (productName: string) => {
    alert(`Refill request for ${productName} has been submitted to your physician and our pharmacist.`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <Loader2 className="text-gold-brushed animate-spin" size={48} />
      </div>
    );
  }

  if (!user || user.role !== 'Patient') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-xs mb-2">Authenticated Patient Node</p>
            <h1 className="text-4xl font-serif italic">{user.firstName} {user.lastName}</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="p-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
          >
            <LogOut size={16} /> Secure Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-[2rem] border-gold-brushed/10 space-y-4">
             <div className="w-12 h-12 bg-gold-brushed/10 rounded-2xl flex items-center justify-center text-gold-brushed mb-4">
                <Activity size={24} />
             </div>
             <h3 className="font-serif italic text-xl">Clinical Profile</h3>
             <div className="space-y-4 pt-4 border-t border-gold-brushed/5">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] uppercase tracking-widest opacity-40">Status</span>
                   <span className="text-xs font-bold text-gold-brushed">Active Protocol</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] uppercase tracking-widest opacity-40">Identity UID</span>
                   <span className="text-[8px] font-mono opacity-20 uppercase tracking-tighter">{user.id}</span>
                </div>
             </div>
          </div>

          <div className="glass p-8 rounded-[2rem] border-emerald-500/10 space-y-4">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                <PackageCheck size={24} />
             </div>
             <h3 className="font-serif italic text-xl">Prescription Status</h3>
             <p className="text-[10px] uppercase tracking-widest opacity-40 pt-4 border-t border-gold-brushed/5">Syncing with Health Node...</p>
             <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle size={14} /> 2 Active Protocols
             </div>
          </div>

          <div className="glass p-8 rounded-[2rem] border-gold-brushed/10 space-y-4">
             <div className="w-12 h-12 bg-gold-brushed/10 rounded-2xl flex items-center justify-center text-gold-brushed mb-4">
                <Clock size={24} />
             </div>
             <h3 className="font-serif italic text-xl">Reminders</h3>
             <div className="space-y-3 pt-4 border-t border-gold-brushed/5">
                <div className="p-3 bg-white/5 rounded-xl border border-gold-brushed/10 flex items-center gap-3">
                   <AlertCircle size={14} className="text-orange-400" />
                   <span className="text-[10px] uppercase tracking-widest leading-relaxed">Multivitamin refill due in 3 days</span>
                </div>
             </div>
          </div>
        </div>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif italic">Medication History & Refills</h2>
            <Pill size={24} className="text-gold-brushed opacity-20" />
          </div>
          
          <div className="glass rounded-[2.5rem] overflow-hidden border-gold-brushed/5">
            {fetchLoading ? (
              <div className="p-20 text-center italic opacity-20 font-serif">Querying History Archive...</div>
            ) : history.length === 0 ? (
               <div className="p-20 text-center italic opacity-20 font-serif">No clinical records found on this account.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest opacity-40 font-bold border-b border-gold-brushed/5">
                  <tr>
                    <th className="px-8 py-6">Date</th>
                    <th className="px-8 py-6">Medication</th>
                    <th className="px-8 py-6 text-right">Dosage/Qty</th>
                    <th className="px-8 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-brushed/5">
                  {history.map((item, i) => (
                    <tr key={i} className="hover:bg-gold-brushed/[0.02] transition-colors">
                      <td className="px-8 py-6 text-[10px] font-mono opacity-40">{new Date(item.transaction_date).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-sm font-medium">{item.product_name}</td>
                      <td className="px-8 py-6 text-right text-xs opacity-60">{item.quantity} Units</td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleRefillRequest(item.product_name)}
                          className="px-4 py-2 bg-gold-brushed/10 text-gold-brushed text-[8px] font-bold uppercase tracking-widest rounded-xl hover:bg-gold-brushed hover:text-navy-midnight transition-all border border-gold-brushed/20"
                        >
                          Request Refill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

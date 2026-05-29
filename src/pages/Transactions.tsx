import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  CreditCard, 
  ChevronRight,
  Loader2,
  Clock,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface Transaction {
  id: string;
  transaction_id?: string;
  patient_id?: string;
  employee_id: string;
  transaction_date: any;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  final_amount: number;
  payment_type: string;
  status: string;
  created_at: any;
  items: any[];
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.transactions.list();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const txIdStr = String(tx.transaction_id || tx.id);
    const matchesSearch = 
      txIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.payment_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || tx.payment_type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10';
      case 'pending': return 'text-amber-500 bg-amber-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      default: return 'text-gold-brushed bg-gold-brushed/10';
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Employee ID', 'Patient ID', 'Total Amount', 'Tax', 'Discount', 'Final Amount', 'Payment Type', 'Status'];
    const rows = filteredTransactions.map(tx => [
      tx.transaction_id || tx.id,
      new Date(tx.created_at || tx.transaction_date).toLocaleString(),
      tx.employee_id || 'N/A',
      tx.patient_id || 'Walk-in',
      tx.total_amount,
      tx.tax_amount || 0,
      tx.discount_amount || 0,
      tx.final_amount,
      tx.payment_type,
      tx.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => {
        const str = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Audit Ledger</p>
          <h2 className="text-4xl text-theme-text italic">Sales History</h2>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={exportToCSV}
             className="glass px-6 py-3 rounded-xl border-white/5 text-[10px] font-bold uppercase tracking-widest text-theme-text/60 flex items-center gap-2 hover:bg-gold-brushed/10 hover:text-gold-brushed transition-all"
           >
             <Download size={14} /> Export CSV
           </button>
           <button 
             onClick={fetchTransactions}
             className="bg-gold-brushed text-navy-midnight px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
           >
             <Clock size={14} /> Refresh Feed
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40 group-focus-within:text-gold-brushed transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by Transaction ID or Payment Method..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-midnight/30 border border-gold-brushed/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text placeholder:text-theme-text/20 focus:outline-none focus:border-gold-brushed/40 transition-all custom-glow"
          />
        </div>
        <div className="relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40 transition-colors" size={18} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-navy-midnight/30 border border-gold-brushed/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 appearance-none transition-all"
          >
            <option value="all">All Payment Types</option>
            <option value="cash">Cash</option>
            <option value="credit card">Credit Card</option>
            <option value="insurance">Insurance</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-[3rem] border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-gold-brushed/[0.03] border-b border-white/5">
              <tr>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gold-brushed/60">Reference</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gold-brushed/60">Timestamp</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gold-brushed/60">Entity IDs</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gold-brushed/60">Settlement</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gold-brushed/60">Mode</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gold-brushed/60 text-right">Final Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="animate-spin text-gold-brushed mx-auto mb-4" size={32} />
                    <p className="italic font-serif text-theme-text/40">Synchronizing ledger...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="italic font-serif text-theme-text/40 text-lg">No matching records found in this temporal slice.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.transaction_id || tx.id} className="group hover:bg-gold-brushed/5 transition-colors cursor-pointer">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-gold-brushed/10 rounded-lg text-gold-brushed">
                           <Receipt size={14} />
                         </div>
                         <p className="font-mono text-xs text-theme-text">{tx.transaction_number || `#TX-${String(tx.transaction_id || tx.id).slice(-8).toUpperCase()}`}</p>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                       <div className="flex flex-col">
                         <span className="text-xs text-theme-text/80">
                           {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : 'N/A'}
                         </span>
                         <span className="text-[10px] opacity-40 uppercase tracking-widest mt-1">
                           {tx.transaction_date ? new Date(tx.transaction_date).toLocaleTimeString() : ''}
                         </span>
                       </div>
                    </td>
                    <td className="py-6 px-8">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-[10px] opacity-60">
                           <User size={10} className="text-gold-brushed" />
                           <span className="uppercase tracking-widest">PAT: {tx.patient_id || 'WALK-IN'}</span>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] opacity-60">
                           <ShieldIcon size={10} className="text-blue-400" />
                           <span className="uppercase tracking-widest">STAFF: {tx.cashier || tx.employee_id}</span>
                         </div>
                       </div>
                    </td>
                    <td className="py-6 px-8">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                         getStatusColor(tx.status)
                       )}>
                         {tx.status}
                       </span>
                    </td>
                    <td className="py-6 px-8">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-theme-text/60">
                         <CreditCard size={12} className="text-gold-brushed" />
                         <span className="uppercase tracking-widest">{tx.payment_type}</span>
                       </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                       <p className="text-xl gold-text font-black">ETB {Number(tx.final_amount).toLocaleString()}</p>
                       <p className="text-[9px] opacity-40 uppercase tracking-widest font-bold">inclusive of tax</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-8 glass rounded-[2rem] border-white/5">
        <div>
          <h4 className="font-serif italic text-xl text-theme-text">Transactional Summary</h4>
          <p className="text-xs text-theme-text/40 mt-1 uppercase tracking-widest">Consolidated metrics for current view</p>
        </div>
        <div className="flex gap-12">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40 mb-2">Total Volume</p>
            <p className="text-3xl font-black text-theme-text">{filteredTransactions.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40 mb-2">Gross Value</p>
            <p className="text-3xl font-black gold-text">ETB {filteredTransactions.reduce((sum, tx) => sum + Number(tx.final_amount || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

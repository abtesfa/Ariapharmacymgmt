/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { 
  RotateCcw, 
  Search, 
  Receipt, 
  Calendar, 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';

export default function SalesReturns() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txs, returns] = await Promise.all([
        api.transactions.list(),
        api.transactions.returns.list()
      ]);
      setTransactions(txs);
      setReturnHistory(returns);
    } catch (err) {
      console.error('Failed to fetch return data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!selectedTx || !returnReason) return;
    
    setIsSubmitting(true);
    try {
      await api.transactions.returns.create({
        transaction_id: selectedTx.transaction_id,
        total_refund_amount: selectedTx.final_amount,
        reason: returnReason
      });
      setShowSuccess(true);
      fetchData();
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedTx(null);
        setReturnReason('');
      }, 3000);
    } catch (err) {
      console.error('Return failed:', err);
      alert('Return process failed. Ensure transaction is eligible for refund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) && 
    t.status === 'Completed'
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">After-Sales Governance</p>
          <h2 className="text-4xl text-theme-text italic">Sales Returns & Refunds</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Process Return */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!selectedTx ? (
              <motion.div 
                key="tx-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass p-8 rounded-[2.5rem] border-white/5 space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif italic text-2xl text-theme-text flex items-center gap-3">
                    <Search className="text-gold-brushed" size={24} /> Locate Transaction
                  </h3>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={20} />
                  <input 
                    type="text"
                    placeholder="Enter Transaction Number (e.g. TX...)"
                    className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl py-6 pl-16 pr-8 text-theme-text outline-none focus:border-gold-brushed/60 transition-all font-mono"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {filteredTransactions.length === 0 ? (
                    <div className="py-20 text-center text-theme-text opacity-20 italic">
                      No eligible completed transactions found matching your criteria.
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <button 
                        key={tx.transaction_id}
                        onClick={() => setSelectedTx(tx)}
                        className="w-full glass bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-gold-brushed/30 transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-gold-brushed/10 rounded-2xl text-gold-brushed group-hover:bg-gold-brushed group-hover:text-navy-midnight transition-colors">
                            <Receipt size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-mono text-gold-brushed">{tx.transaction_number}</p>
                            <div className="flex items-center gap-4 mt-1 opacity-50">
                              <span className="text-[10px] uppercase font-bold flex items-center gap-1"><Calendar size={10} /> {new Date(tx.transaction_date).toLocaleDateString()}</span>
                              <span className="text-[10px] uppercase font-bold flex items-center gap-1"><User size={10} /> {tx.patient_first || 'Walk-in'} {tx.patient_last || ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-serif italic text-theme-text">ETB {Number(tx.final_amount).toLocaleString()}</p>
                          <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-black">Verified</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="return-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass p-10 rounded-[2.5rem] border-white/5 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-gold-brushed hover:underline"
                  >
                    <ArrowLeft size={14} /> Back to Search
                  </button>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-theme-text opacity-40 italic">Transaction Auth Required</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-serif italic text-3xl text-theme-text mb-4">Refund Manifest</h3>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-40 uppercase font-black">Ticket ID</span>
                          <span className="font-mono text-gold-brushed">{selectedTx.transaction_number}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-40 uppercase font-black">Original Value</span>
                          <span className="font-mono text-theme-text">ETB {Number(selectedTx.final_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                          <span className="opacity-40 uppercase font-black">Refund Amount</span>
                          <span className="text-xl italic font-serif text-gold-brushed">ETB {Number(selectedTx.final_amount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex gap-4">
                      <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                      <p className="text-xs text-amber-500/80 leading-relaxed italic">
                        This action will mark the transaction as refunded in the system ledger. Stocks must be manually adjusted if items are returned to inventory.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed px-1">Reason for Return</label>
                      <textarea 
                        className="w-full bg-navy-midnight/50 border border-white/10 rounded-2xl p-6 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all h-[150px] resize-none italic"
                        placeholder="Detail the justification for this refund request..."
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                      />
                    </div>
                    
                    <button 
                      onClick={handleProcessReturn}
                      disabled={isSubmitting || !returnReason}
                      className="w-full bg-gold-brushed text-navy-midnight py-6 rounded-2xl font-black uppercase text-xs tracking-[0.5em] shadow-xl shadow-gold-brushed/20 hover:scale-[1.01] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "Processing Registry Update..." : "Authorize Refund"}
                    </button>
                    
                    {showSuccess && (
                      <div className="flex items-center gap-3 text-emerald-500 justify-center animate-in fade-in slide-in-from-top-2 duration-500">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] uppercase font-black tracking-widest">Registry Synchronized Successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Return History */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="glass p-8 rounded-[2.5rem] border-white/5 flex-1 flex flex-col">
            <h4 className="font-serif italic text-xl text-theme-text flex items-center gap-3 mb-8">
              <History className="text-gold-brushed" size={20} /> Refund Archive
            </h4>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
              {returnHistory.length === 0 ? (
                <div className="py-20 text-center opacity-20 italic flex flex-col items-center gap-4">
                  <RotateCcw size={40} className="text-gold-brushed/20" />
                  <p className="text-sm font-serif">No refund events recorded in current epoch.</p>
                </div>
              ) : (
                returnHistory.map((ret, i) => (
                  <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-gold-brushed/20 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-gold-brushed/50 group-hover:text-gold-brushed transition-colors">{ret.transaction_number}</span>
                      <span className="text-[9px] text-theme-text opacity-30">{new Date(ret.return_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-theme-text/80 mb-3 italic">"{ret.reason || 'No justification provided'}"</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-gold-brushed/40" />
                        <span className="text-[10px] uppercase font-black text-theme-text/40">{ret.refunded_by_user}</span>
                      </div>
                      <span className="text-sm font-serif italic text-red-400">- ETB {Number(ret.total_refund_amount).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

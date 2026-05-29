/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, User, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PatientQuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/patient-search?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <User className="text-gold-brushed" size={20} /> Patient Finder
        </h4>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
          <input 
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-12 pr-4 py-3 text-xs text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all"
            placeholder="Search by name..."
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-brushed/40 animate-spin" size={14} />}
        </div>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!query && !selected && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <Search className="text-gold-brushed/10 mb-4" size={48} />
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-30 text-theme-text font-bold">Awaiting Input</p>
            </motion.div>
          )}

          {query && results.length > 0 && !selected && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              {results.map((p) => (
                <button 
                  key={p.patient_id}
                  onClick={() => setSelected(p)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gold-brushed/5 border border-transparent hover:border-gold-brushed/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-gold-brushed/10 flex items-center justify-center font-serif text-gold-brushed group-hover:bg-gold-brushed/20">
                    {p.first_name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-theme-text">{p.first_name} {p.last_name}</p>
                    <p className="text-[9px] opacity-40 text-theme-text uppercase tracking-tighter">ID: PAT-{p.patient_id.toString().padStart(4, '0')}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {selected && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold-brushed/20 flex items-center justify-center text-xl font-serif text-gold-brushed">
                    {selected.first_name[0]}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-theme-text leading-tight">{selected.first_name} {selected.last_name}</h5>
                    <button onClick={() => setSelected(null)} className="text-[9px] text-gold-brushed uppercase tracking-widest font-bold hover:underline">Clear</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass bg-white/5 p-4 rounded-2xl border border-red-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={12} className="text-red-400" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-red-400">Allergies</span>
                  </div>
                  <p className="text-[10px] text-theme-text opacity-70 leading-relaxed font-light">{selected.allergies || 'N/A'}</p>
                </div>
                <div className="glass bg-white/5 p-4 rounded-2xl border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={12} className="text-blue-400" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-blue-400">History</span>
                  </div>
                  <p className="text-[10px] text-theme-text opacity-70 leading-relaxed font-light">{selected.medical_history || 'N/A'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-widest opacity-40 text-theme-text font-bold">Clinical Profile</p>
                <div className="w-full flex justify-between items-center py-3 border-b border-gold-brushed/5">
                   <span className="text-[11px] font-light text-theme-text italic">Rx Compliance</span>
                   <span className="text-[10px] font-bold text-emerald-400">92%</span>
                </div>
                <div className="w-full h-1 bg-gold-brushed/10 rounded-full overflow-hidden">
                   <div className="w-11/12 h-full bg-gold-brushed" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

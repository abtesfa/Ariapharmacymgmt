/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, User, Receipt, X } from 'lucide-react';
import { SearchItem } from '../../data/mockSearchData';
import { motion, AnimatePresence } from 'motion/react';
import { useFuzzySearch } from '../../lib/useFuzzySearch';

import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { results, isLoading } = useFuzzySearch(query);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  }, [results]);

  const getIcon = (type: SearchItem['type']) => {
    switch (type) {
      case 'product': return <Package size={14} className="text-emerald-400" />;
      case 'patient': return <User size={14} className="text-blue-400" />;
      case 'transaction': return <Receipt size={14} className="text-amber-400" />;
    }
  };

  const handleSelect = (item: SearchItem) => {
    setQuery('');
    setIsOpen(false);
    
    // Proper navigation based on type
    if (item.type === 'product') {
      navigate('/dashboard/inventory');
    } else if (item.type === 'patient') {
      navigate('/dashboard/patients');
    } else if (item.type === 'transaction') {
      navigate('/dashboard/analytics');
    }
  };

  return (
    <div ref={searchRef} className="relative w-full group">
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${query ? 'text-gold-brushed' : 'text-gold-brushed/40'}`} size={18} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search transactions, products, or patients..."
          className="w-full glass rounded-full py-2.5 pl-12 pr-12 text-xs focus:outline-none focus:ring-1 focus:ring-gold-brushed/20 focus:bg-gold-brushed/5 transition-all text-theme-text placeholder:text-theme-text/20"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={14} className="text-gold-brushed animate-spin" />
          ) : query ? (
            <button 
              onClick={() => setQuery('')}
              className="text-gold-brushed/40 hover:text-gold-brushed p-1"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="text-[10px] text-gold-brushed/20 font-bold border border-gold-brushed/20 px-1.5 py-0.5 rounded uppercase tracking-tighter">⌘K</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-4 glass-dark rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden z-[100]"
          >
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold-brushed/40">Results ({results.length})</span>
                <span className="text-[9px] uppercase tracking-[0.1em] text-theme-text opacity-20 italic">Fuzzy Match Enabled</span>
              </div>
              
              <div className="space-y-1">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-gold-brushed/20 group-hover:bg-gold-brushed/5 transition-all">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-serif italic text-theme-text group-hover:text-gold-brushed transition-colors">{item.title}</p>
                        <span className="text-[9px] uppercase tracking-widest opacity-30 px-2 py-0.5 rounded-full border border-white/5 group-hover:border-gold-brushed/20 transition-all">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-40 text-theme-text font-light mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-gold-brushed/5 border-t border-white/5 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[9px] text-theme-text opacity-40">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 uppercase">Enter</span> select
                </div>
                <div className="flex items-center gap-2 text-[9px] text-theme-text opacity-40">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 uppercase">↑↓</span> navigate
                </div>
              </div>
              <p className="text-[9px] text-gold-brushed/40 font-bold uppercase tracking-widest">Global Vault Access</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

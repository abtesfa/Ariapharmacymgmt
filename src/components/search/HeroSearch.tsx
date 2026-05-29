/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, User, Receipt, X, ArrowRight } from 'lucide-react';
import { SearchItem } from '../../data/mockSearchData';
import { motion, AnimatePresence } from 'motion/react';
import { useFuzzySearch } from '../../lib/useFuzzySearch';

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { results, isLoading } = useFuzzySearch(query);

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

  const handleSelect = (item: SearchItem) => {
    setQuery('');
    setIsOpen(false);
    alert(`Searching for ${item.type}: ${item.title}`);
  };

  return (
    <div ref={searchRef} className="max-w-3xl mx-auto relative group z-50">
      <div className="relative">
        <Search className={`absolute left-8 top-1/2 -translate-y-1/2 transition-colors duration-500 ${query ? 'text-gold-brushed' : 'text-gold-brushed/40'}`} size={24} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search across medicines, personal care, or supplies..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-6 pl-20 pr-32 text-lg focus:outline-none focus:border-gold-brushed/40 focus:bg-white/10 transition-all font-light italic text-white placeholder:text-white/20"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
          {isLoading && <Loader2 size={20} className="text-gold-brushed animate-spin" />}
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <button className="bg-gold-brushed text-navy-midnight p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-gold-brushed/20">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-6 glass-dark rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex items-start gap-6 p-6 rounded-[2rem] hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-gold-brushed/30 group-hover:bg-gold-brushed/10 transition-all shrink-0">
                      {item.type === 'product' && <Package size={20} className="text-emerald-400" />}
                      {item.type === 'patient' && <User size={20} className="text-blue-400" />}
                      {item.type === 'transaction' && <Receipt size={20} className="text-amber-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-serif italic text-white group-hover:text-gold-brushed transition-colors truncate">{item.title}</p>
                      <p className="text-xs opacity-40 text-white font-light mt-1 truncate">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold flex justify-between">
              <span>Fuzzy Intelligence Active</span>
              <span className="text-gold-brushed/40">Premium Boutique Search</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Package, ShieldCheck, ShoppingCart, Calendar, DollarSign, Info, Hash } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface BatchInfo {
  expiryDate: string;
  unitCost: number;
  batchNumber: string;
}

interface ProductCardProps {
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  isControlled?: boolean;
  batch?: BatchInfo;
}

export default function ProductCard({ name, category, price, stock, image, isControlled, batch }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      className="group relative h-full glass-gold rounded-2xl overflow-hidden shadow-2xl p-6 transition-all duration-500 hover:shadow-gold-brushed/10"
    >
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {isControlled && (
          <div className="bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
            Controlled
          </div>
        )}
        <div className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
          In Stock
        </div>
      </div>

      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-navy-midnight/50 mb-6 group-hover:scale-[1.02] transition-transform duration-700">
        <div className="absolute inset-0 bg-gradient-to-t from-navy-midnight/80 to-transparent z-0" />
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gold-brushed/20">
            <Package size={64} strokeWidth={0.5} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-brushed/60 mb-1">{category}</p>
          <h3 className="text-xl font-serif text-white group-hover:text-gold-brushed transition-colors">{name}</h3>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] text-alabaster/40 font-medium">Standard Retail</p>
            <p className="text-xl font-serif text-white">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-alabaster/40 font-medium">Inventory</p>
            <p className="text-sm font-medium text-alabaster">{stock} units</p>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && batch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3 pt-4 border-t border-white/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gold-brushed/60">
                  <Hash size={12} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Batch ID</span>
                </div>
                <span className="text-[10px] font-mono text-white/80">{batch.batchNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gold-brushed/60">
                  <Calendar size={12} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Expiry</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono",
                  new Date(batch.expiryDate) < new Date() ? "text-red-400" : "text-white/80"
                )}>
                  {batch.expiryDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gold-brushed/60">
                  <DollarSign size={12} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Unit Cost</span>
                </div>
                <span className="text-[10px] font-mono text-white/80">${batch.unitCost.toFixed(2)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-gold-brushed text-alabaster hover:text-navy-midnight rounded-xl transition-all duration-300 group/btn border border-white/10 hover:border-gold-brushed mt-2">
          <ShoppingCart size={16} className="group-hover/btn:translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Enact Dispense</span>
        </button>
      </div>
    </motion.div>
  );
}

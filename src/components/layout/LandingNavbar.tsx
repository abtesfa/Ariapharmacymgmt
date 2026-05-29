/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Infinity, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 w-full z-[100]">
      <nav className="px-6 py-4 md:py-6">
        <div className="max-w-7xl mx-auto glass rounded-2xl border gold-border px-6 py-3 flex items-center justify-between shadow-2xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gold-brushed/10 border border-gold-brushed/30 text-gold-brushed">
              <Infinity size={20} />
            </div>
            <span className="text-xl font-serif text-theme-text italic tracking-tight">Aria Health Pharmacy</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/#contact' }
            ].map((item) => {
              const isAnchor = item.href.includes('#');
              if (isAnchor) {
                return (
                  <a 
                    key={item.label} 
                    href={item.href}
                    className="text-[10px] font-bold uppercase tracking-widest text-theme-text opacity-40 hover:text-gold-brushed transition-colors"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link 
                  key={item.label} 
                  to={item.href}
                  className="text-[10px] font-bold uppercase tracking-widest text-theme-text opacity-40 hover:text-gold-brushed transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gold-brushed hover:bg-gold-brushed/10 transition-all mr-2"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              className="lg:hidden text-theme-text opacity-60 hover:opacity-100 p-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden mt-4 glass rounded-2xl border gold-border p-8 flex flex-col gap-6 shadow-2xl relative z-50 backdrop-blur-2xl"
            >
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/#contact' }
              ].map((item) => {
                const isAnchor = item.href.includes('#');
                if (isAnchor) {
                  return (
                    <a 
                      key={item.label} 
                      href={item.href}
                      className="text-xs font-bold uppercase tracking-widest text-theme-text opacity-40 hover:text-gold-brushed transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link 
                    key={item.label} 
                    to={item.href}
                    className="text-xs font-bold uppercase tracking-widest text-theme-text opacity-40 hover:text-gold-brushed transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

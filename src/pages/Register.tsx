/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShieldCheck, User, Mail, Lock, UserPlus, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    role_id: ''
  });
  const [roles, setRoles] = useState<any[]>([
    { role_id: '1', role_name: 'Administrator' },
    { role_id: '2', role_name: 'Pharmacist' },
    { role_id: '3', role_name: 'Cashier' },
    { role_id: '4', role_name: 'Patient' }
  ]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setDbStatus('checking');
        const fetchedRoles = await api.employees.roles();
        
        if (fetchedRoles.length > 0) {
          setRoles(fetchedRoles);
          setDbStatus('connected');
        } else {
          setDbStatus('connected');
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
        setDbStatus('error');
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.password || !formData.role_id) {
      setError('Entry Denied: All biometric and personnel fields required.');
      setLoading(false);
      return;
    }

    // Email format validation
    const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim());
    if (!isEmailValid) {
      setError('Syntax Rejection: Enter a valid administrative email address structure (e.g. name@domain.com).');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Security Alert: Your secret passphrase must be at least 6 characters in length.');
      setLoading(false);
      return;
    }

    try {
      await api.auth.register(formData);

      setError('✓ Registration successful. Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err: any) {
      setError(`Sync Refused: ${err.message || 'Validation failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-brushed/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy-midnight/20 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-12 rounded-[3.5rem] border-gold-brushed/10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-gold-brushed/10 border border-gold-brushed/20 mb-6 group cursor-default">
            <ShieldCheck className="text-gold-brushed group-hover:scale-110 transition-transform" size={32} />
          </div>
          <p className="text-gold-brushed font-medium tracking-[0.4em] uppercase text-[10px] mb-2 font-bold">Registry Entry</p>
          <h1 className="text-4xl text-theme-text font-serif italic">Aria Health Pharmacy Personnel</h1>
          <div className="mt-2 flex justify-center items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[8px] uppercase tracking-widest text-theme-text opacity-40 font-bold">
              {dbStatus === 'connected' ? 'Secure Hub Linked' : dbStatus === 'checking' ? 'Synchronizing...' : 'Hub Offline'}
            </span>
          </div>
          {dbStatus === 'connected' && roles.length === 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <p className="text-[8px] uppercase tracking-[0.2em] font-black text-orange-400">
                Warning: Hub Schema Uninitialized. Visit Settings to Sync Roles.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">First Name</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl px-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all placeholder:text-theme-text/20"
                  placeholder="Aria"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Last Name</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl px-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all placeholder:text-theme-text/20"
                  placeholder="Luxe"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Username</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={18} />
              <input 
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-14 pr-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all placeholder:text-theme-text/20"
                placeholder="aria_personnel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Secure Email</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={18} />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-14 pr-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all placeholder:text-theme-text/20"
                placeholder="personnel@aria-wellness.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Secret Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={18} />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-14 pr-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all placeholder:text-theme-text/20"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Organizational Role</label>
            <div className="relative group">
              <select 
                required
                value={formData.role_id}
                onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl px-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-navy-midnight">Select Professional Role</option>
                {roles.length > 0 ? (
                  roles.map((role: any) => (
                    <option key={role.role_id} value={role.role_id} className="bg-navy-midnight">{role.role_name}</option>
                  ))
                ) : (
                  <option disabled className="bg-navy-midnight italic opacity-50">Connecting to Hub...</option>
                )}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gold-brushed/40 group-focus-within:text-gold-brushed transition-colors">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`text-center p-5 rounded-3xl border backdrop-blur-2xl shadow-2xl ring-1 ring-inset transition-all duration-700 flex flex-col items-center gap-2 ${
                error.includes('✓') 
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 ring-emerald-500/20 shadow-emerald-500/5' 
                  : 'text-gold-brushed border-gold-brushed/30 bg-gold-brushed/10 ring-gold-brushed/20 shadow-gold-brushed/5'
              }`}
            >
              <div className={`p-1.5 rounded-full ${error.includes('✓') ? 'bg-emerald-500/20' : 'bg-gold-brushed/20'}`}>
                <ShieldCheck size={14} className={error.includes('✓') ? 'text-emerald-400' : 'text-gold-brushed'} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-serif italic">
                <span className="block font-sans font-black tracking-[0.2em] mb-1 opacity-60 not-italic">Security Pulse</span>
                {error}
              </p>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-gold-brushed text-navy-midnight rounded-2xl py-4 font-bold uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-gold-brushed/20 hover:shadow-gold-brushed/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center gap-3">
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-navy-midnight/70" size={18} />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <UserPlus className="group-hover:rotate-12 transition-transform" size={18} />
                  <span>Finalize Entry</span>
                </>
              )}
            </div>
          </button>
        </form>

        <div className="mt-10 text-center space-y-4">
          <Link to="/" className="text-theme-text opacity-40 hover:opacity-100 text-[10px] uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Core
          </Link>
          <div className="flex items-center justify-center gap-2 opacity-20">
            <div className="h-[1px] w-8 bg-theme-text" />
            <span className="text-[8px] uppercase tracking-tighter font-black">Secure Tunnel</span>
            <div className="h-[1px] w-8 bg-theme-text" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  React.useEffect(() => {
    if (user) {
      if (user.role === 'Patient') {
        navigate('/patient-portal');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ username, password });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Identity Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-brushed/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy-midnight/20 blur-[120px] rounded-full" />

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-10 md:p-12 rounded-[3.5rem] border-gold-brushed/10 relative z-10"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-10">
              <div className="inline-flex p-4 rounded-3xl bg-gold-brushed/10 border border-gold-brushed/20 mb-6">
                <ShieldCheck className="text-gold-brushed" size={32} />
              </div>
              <p className="text-gold-brushed font-medium tracking-[0.4em] uppercase text-[10px] mb-2 font-bold">
                Protocol: Secure Entrance
              </p>
              <h1 className="text-4xl text-theme-text font-serif italic">
                Portal Access
              </h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Username</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={18} />
                  <input 
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-14 pr-5 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all font-sans"
                    placeholder="Pharmacist Username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={18} />
                  <input 
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-14 pr-14 py-4 text-sm text-theme-text focus:outline-none focus:border-gold-brushed/40 transition-all font-sans"
                    placeholder="••••••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gold-brushed/40 hover:text-gold-brushed transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="flex items-start gap-4 p-5 rounded-3xl border border-gold-brushed/30 bg-gold-brushed/5 backdrop-blur-sm shadow-lg shadow-gold-brushed/5"
                >
                  <div className="w-8 h-8 rounded-xl bg-gold-brushed/20 flex items-center justify-center flex-shrink-0 text-gold-brushed mt-0.5">
                    <X size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-gold-brushed font-black mb-1 opacity-70">Security Alert</p>
                    <p className="text-theme-text text-[11px] font-medium leading-relaxed italic">{error}</p>
                  </div>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gold-brushed text-navy-midnight rounded-2xl py-4 font-bold uppercase text-[11px] tracking-[0.3em] shadow-lg shadow-gold-brushed/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                Login
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

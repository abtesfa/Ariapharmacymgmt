import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PatientLogin() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
    if (!isPhoneValid) {
      setError("Enter a valid Ethiopian phone number (e.g. 09xxxxxxxx or +251 9xxxxxxxx)");
      setLoading(false);
      return;
    }

    const formattedPhone = cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : (cleanPhone.startsWith('251') ? '+' + cleanPhone : cleanPhone);

    try {
      const res = await fetch('/api/patient-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('patient', JSON.stringify(data.patient));
        navigate('/patient-portal');
      } else {
        setError(data.error || 'Identity verification failed');
      }
    } catch (err) {
      setError('Connection to node lost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-midnight flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold-brushed/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-brushed/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-gold w-full max-w-md p-10 rounded-[3rem] border-gold-brushed/20 relative z-10"
      >
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex p-4 bg-gold-brushed/10 rounded-3xl text-gold-brushed mb-4 ring-1 ring-gold-brushed/20 shadow-xl shadow-gold-brushed/10">
            <ShieldCheck size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-serif italic text-theme-text mb-2">Patient Portal</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-brushed font-medium">Verify your medical identity</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            <div className="relative group">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-brushed/40 group-focus-within:text-gold-brushed transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Registered Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-gold-brushed/10 rounded-2xl pl-16 pr-8 py-5 text-sm focus:outline-none focus:border-gold-brushed/40 transition-all text-theme-text placeholder:text-theme-text/20"
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-[10px] uppercase tracking-widest font-bold text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gold-brushed text-navy-midnight py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-gold-brushed/10"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Initiate Access
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-[10px] uppercase tracking-widest text-gold-brushed hover:text-theme-text transition-colors opacity-60 hover:opacity-100 italic"
          >
            Employee Authentication Registry
          </button>
        </div>
      </motion.div>
    </div>
  );
}



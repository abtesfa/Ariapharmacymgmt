/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Palette, 
  Database, 
  Loader2, 
  Store, 
  History, 
  Save, 
  Globe, 
  Coins, 
  Percent,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pharmacy' | 'system' | 'audit'>('pharmacy');
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [pharmacyData, setPharmacyData] = useState({
    name: 'Aria Premium Pharmacy',
    licenseNumber: '',
    contactEmail: 'ariahealthpharmacy@gmail.com',
    contactPhone: '+2514444444',
    addressLine1: 'Bole Road, Addis Ababa, Ethiopia',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    currency: 'ETB',
    taxRate: 15,
    themeConfig: {
      glassIntensity: 0.1,
      goldBrushing: 0.8
    }
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const isAdmin = user?.role === 'Administrator';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.settings.getPharmacy();
        if (data && data.pharmacy_name) {
          setPharmacyData({
            name: data.pharmacy_name,
            licenseNumber: data.license_number || '',
            contactEmail: data.contact_email || '',
            contactPhone: data.contact_phone || '',
            addressLine1: data.address_line_1 || '',
            city: data.city || '',
            state: data.state || '',
            postalCode: data.postal_code || '',
            currency: data.currency || 'ETB',
            taxRate: parseFloat(data.tax_rate) || 15,
            themeConfig: data.theme_config ? JSON.parse(data.theme_config) : { glassIntensity: 0.1, goldBrushing: 0.8 }
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();
  }, []);
  
  useEffect(() => {
    const fetchAudit = async () => {
      if (activeTab === 'audit' && isAdmin) {
        try {
          const logs = await api.audit.list();
          setAuditLogs(logs);
        } catch (err) {
          console.error('Audit fetch failed:', err);
        }
      }
    };
    fetchAudit();
  }, [activeTab, isAdmin]);

  const handlePharmacySave = async () => {
    // Clean phone number of spaces, hyphens, parentheses before validating
    const cleanPhone = pharmacyData.contactPhone ? pharmacyData.contactPhone.replace(/[\s\-\(\)]/g, '') : '';
    if (cleanPhone) {
      const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
      if (!isPhoneValid) {
        alert("Validation Error: Please enter a valid Ethiopian contact phone number (e.g. 09xxxxxxxx, 07xxxxxxxx, or +251 9xxxxxxxx)");
        return;
      }
    }

    // Validate email if entered
    if (pharmacyData.contactEmail && pharmacyData.contactEmail.trim() !== '') {
      const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(pharmacyData.contactEmail.trim());
      if (!isEmailValid) {
        alert("Validation Error: Please enter a valid contact email format.");
        return;
      }
    }

    setSaving(true);
    try {
      await api.settings.updatePharmacy({
        pharmacy_name: pharmacyData.name,
        license_number: pharmacyData.licenseNumber,
        contact_email: pharmacyData.contactEmail,
        contact_phone: cleanPhone ? (cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : (cleanPhone.startsWith('251') ? '+' + cleanPhone : cleanPhone)) : '',
        address_line_1: pharmacyData.addressLine1,
        city: pharmacyData.city,
        state: pharmacyData.state,
        postal_code: pharmacyData.postalCode,
        currency: pharmacyData.currency,
        tax_rate: pharmacyData.taxRate,
        theme_config: pharmacyData.themeConfig
      });
      alert('Institutional settings synchronized successfully.');
    } catch (err) {
      console.error(err);
      alert('Configuration Sync Failed: Check database connection.');
    } finally {
      setSaving(false);
    }
  };

  const [dbHealth, setDbHealth] = useState<any>(null);
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbForm, setDbForm] = useState({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'pharmacy_erp',
    port: '3306'
  });

  const handleUpdateDatabase = async () => {
    setSaving(true);
    try {
      const result = await api.settings.updateDatabase(dbForm);
      alert(result.message);
      setShowDbConfig(false);
      handleHubSync(); // Refresh health
    } catch (err: any) {
      alert(`Database Configuration Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleHubSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/health');
      const health = await response.json();
      setDbHealth(health.database);
      if (health.database.details) {
        setDbForm({
          host: health.database.details.host || '',
          user: health.database.details.user || '',
          password: health.database.details.password || '',
          database: health.database.details.database || '',
          port: health.database.details.port?.toString() || '3306'
        });
      }
      if (health.database.connectivity === 'Healthy') {
        alert('Hub synchronization successful. MySQL node is healthy.');
      } else {
        alert(`Hub connection failed: ${health.database.connectivity}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network Hub unreachable. Ensure the server is running.');
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    { id: 'pharmacy', label: 'Pharmacy Profile', icon: Store, visible: true },
    { id: 'system', label: 'System Control', icon: SettingsIcon, visible: isAdmin },
    { id: 'audit', label: 'Audit Archives', icon: History, visible: isAdmin },
  ].filter(t => t.visible);

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Configuration Hub</p>
          <h2 className="text-4xl text-theme-text italic">System Settings</h2>
        </div>
        
        <div className="glass p-1 rounded-2xl border-white/5 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-gold-brushed text-navy-midnight shadow-lg shadow-gold-brushed/20" 
                  : "text-theme-text/40 hover:text-gold-brushed hover:bg-gold-brushed/5"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'pharmacy' && (
          <motion.div 
            key="pharmacy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 glass p-10 rounded-[2.5rem] border-white/5 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Store size={14} /> Pharmacy Designation
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.name}
                    onChange={e => setPharmacyData({...pharmacyData, name: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                    placeholder="e.g. Aria Premium Pharmacy"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Shield size={14} /> License Number
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.licenseNumber}
                    onChange={e => setPharmacyData({...pharmacyData, licenseNumber: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/60 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all font-light shadow-inner"
                    placeholder="e.g. LIC-2024-001"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Globe size={14} /> Contact Email
                  </label>
                  <input 
                    type="email" 
                    value={pharmacyData.contactEmail}
                    onChange={e => setPharmacyData({...pharmacyData, contactEmail: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/80 focus:shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all font-light selection:bg-gold-brushed/30"
                    placeholder="e.g. contact@aria.com"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Globe size={14} /> Contact Phone
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.contactPhone}
                    onChange={e => setPharmacyData({...pharmacyData, contactPhone: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/80 focus:shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all font-light tracking-wide"
                    placeholder="e.g. +251 911..."
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Store size={14} /> Address Line 1
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.addressLine1}
                    onChange={e => setPharmacyData({...pharmacyData, addressLine1: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    City
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.city}
                    onChange={e => setPharmacyData({...pharmacyData, city: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                    placeholder="e.g. Addis Ababa"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    State / Region
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.state}
                    onChange={e => setPharmacyData({...pharmacyData, state: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/80 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all font-light"
                    placeholder="e.g. Shewa"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    Postal Code
                  </label>
                  <input 
                    type="text" 
                    value={pharmacyData.postalCode}
                    onChange={e => setPharmacyData({...pharmacyData, postalCode: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                    placeholder="e.g. 1000"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Coins size={14} /> Base Currency
                  </label>
                  <select 
                    value={pharmacyData.currency}
                    onChange={e => setPharmacyData({...pharmacyData, currency: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light appearance-none"
                  >
                    <option value="ETB">ETB (Ethiopian Birr)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 flex items-center gap-2 px-1">
                    <Percent size={14} /> Value Added Tax (%)
                  </label>
                  <input 
                    type="number" 
                    value={pharmacyData.taxRate}
                    onChange={e => setPharmacyData({...pharmacyData, taxRate: Number(e.target.value)})}
                    disabled={!isAdmin}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-6 flex justify-end">
                  <button 
                    onClick={handlePharmacySave}
                    disabled={saving}
                    className="bg-gold-brushed text-navy-midnight px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-lg shadow-gold-brushed/20 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Commit Changes
                  </button>
                </div>
              )}
            </div>

            <div className="glass p-10 rounded-[2.5rem] border-white/5 bg-gold-brushed/[0.02] flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-24 h-24 rounded-full border border-gold-brushed/20 flex items-center justify-center text-gold-brushed text-4xl italic font-serif">
                 A
               </div>
               <div>
                  <h3 className="text-xl font-serif italic text-theme-text">{pharmacyData.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gold-brushed font-black opacity-50 mt-1">Verified Institution</p>
               </div>
               <p className="text-sm text-theme-text opacity-40 leading-relaxed italic">
                 "Providing excellence in pharmaceutical care and governance since inception."
               </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div 
            key="system"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {[
              { icon: Palette, title: 'Interface Theme', desc: 'Customize the glassmorphism intensity and gold brushing levels.', action: () => alert('Customizer offline') },
              { icon: Shield, title: 'Security Protocols', desc: 'Manage RSA encryption keys and biometric authentication layers.', action: () => alert('Security hub active') },
              { icon: Database, title: 'Network Hub', desc: 'Synchronize document schemas and initialize cloud roles with the secure Firebase tunnel.', action: handleHubSync, label: syncing ? 'Syncing...' : 'Synchronize Hub' },
            ].map((item, i) => (
              <div key={i} className="glass p-8 rounded-[2rem] flex items-center gap-8 group hover:bg-gold-brushed/5 transition-all border-white/5">
                 <div className="p-4 bg-gold-brushed/10 rounded-2xl border border-gold-brushed/20 text-gold-brushed group-hover:scale-110 transition-transform">
                    <item.icon size={28} />
                 </div>
                 <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-serif italic text-theme-text">{item.title}</h3>
                    <p className="text-sm text-theme-text opacity-40 leading-relaxed max-w-xl">{item.desc}</p>
                 </div>
                 <button 
                  onClick={item.action}
                  disabled={syncing}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-brushed hover:underline disabled:opacity-50 flex items-center gap-2"
                 >
                   {item.title === 'Network Hub' && syncing && <Loader2 size={12} className="animate-spin" />}
                   {item.label || 'Configure'}
                 </button>
              </div>
            ))}


          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div 
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-[2.5rem] border-white/5 overflow-hidden"
          >
             <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4 text-gold-brushed">
                  <Terminal size={20} />
                  <h3 className="text-lg font-serif italic text-theme-text">Transactional Audit Trail</h3>
                </div>
                <p className="text-[10px] uppercase font-black tracking-widest text-theme-text opacity-40 italic">Real-time surveillance active</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-gold-brushed opacity-60">Timestamp</th>
                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-gold-brushed opacity-60">Actor</th>
                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-gold-brushed opacity-60">Action</th>
                      <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-gold-brushed opacity-60">Object ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-theme-text opacity-20 italic font-serif text-sm">
                           No system anomalies or actions recorded in current epoch.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.audit_id} className="text-[11px] font-mono hover:bg-white/[0.01]">
                          <td className="px-8 py-4 text-theme-text/40">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-8 py-4 text-gold-brushed/60">{log.username}</td>
                          <td className="px-8 py-4 text-theme-text/60 uppercase">{log.action}</td>
                          <td className="px-8 py-4 text-white/20">{log.object_id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

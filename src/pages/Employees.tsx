/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Plus, 
  X, 
  Loader2, 
  Mail, 
  User as UserIcon, 
  Key, 
  ToggleLeft, 
  ToggleRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  role_name: string;
  role_id: string;
  is_active: boolean;
  uid?: string;
}

interface Role {
  role_id: string;
  role_name: string;
}

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personnel' | 'roles'>('personnel');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role_id: ''
  });

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    role_name: '',
    permissions: {
      inventory_view: true,
      inventory_manage: false,
      sales_view: true,
      sales_manage: false,
      personnel_view: false,
      personnel_manage: false,
      settings_manage: false
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, employeesData] = await Promise.all([
        api.employees.roles(),
        api.employees.list()
      ]);
      setRoles(rolesData);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Failed to fetch personnel data:', err);
      setError('Failed to connect to personnel registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Clean phone number of spaces, hyphens, parentheses before validating
    const cleanPhone = formData.phone ? formData.phone.replace(/[\s\-\(\)]/g, '') : '';
    if (cleanPhone) {
      const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
      if (!isPhoneValid) {
        setError("A valid Ethiopian phone number is required (e.g. 09xxxxxxxx, 07xxxxxxxx, or +251 9xxxxxxxx)");
        return;
      }
    }

    // Validate email format
    const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim());
    if (!isEmailValid) {
      setError("Please enter a valid email address structure (e.g. name@domain.com)");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.employees.create({
        ...formData,
        phone: cleanPhone ? (cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : (cleanPhone.startsWith('251') ? '+' + cleanPhone : cleanPhone)) : undefined
      });
      setSuccess(true);
      fetchData();
      setTimeout(() => {
        setSuccess(false);
        setShowAddModal(false);
        setFormData({ first_name: '', last_name: '', username: '', email: '', phone: '', password: '', role_id: '' });
      }, 1500);
    } catch (err: any) {
      console.error('HR Authorization Error:', err);
      setError(err.message || 'Authorization matrix generation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.employees.updateStatus(id, !currentStatus);
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const updateRole = async (employeeId: string, roleId: string) => {
    try {
      await api.employees.updateRole(employeeId, roleId);
      fetchData();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.employees.createRole(roleFormData);
      setSuccess(true);
      fetchData();
      setTimeout(() => {
        setSuccess(false);
        setShowAddRoleModal(false);
        setRoleFormData({
          role_name: '',
          permissions: {
            inventory_view: true,
            inventory_manage: false,
            sales_view: true,
            sales_manage: false,
            personnel_view: false,
            personnel_manage: false,
            settings_manage: false
          }
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Permission matrix compilation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'Administrator';

  const tabs = [
    { id: 'personnel', label: 'Personnel Registry', icon: Users },
    { id: 'roles', label: 'Privilege Matrix', icon: Shield },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Human Resources</p>
          <h2 className="text-4xl text-theme-text italic">Employees Hub</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
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

          {isAdmin && activeTab === 'personnel' && (
            <button 
              onClick={() => {
                setError(null);
                setSuccess(false);
                setShowAddModal(true);
              }}
              className="bg-gold-brushed text-navy-midnight px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-gold-brushed/10"
            >
              <Plus size={16} /> Authorize Personnel
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'personnel' ? (
          <motion.div 
            key="personnel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loading ? (
              <div className="col-span-full p-20 text-center text-theme-text opacity-20 italic font-serif text-lg">
                Consulting Central Registry...
              </div>
            ) : employees.length === 0 ? (
              <div className="col-span-full p-20 text-center text-theme-text opacity-20 italic font-serif text-lg">
                No active personnel signatures detected.
              </div>
            ) : (
              employees.map((staff) => (
                <div key={staff.id} className={cn(
                  "glass p-8 rounded-[2.5rem] border-white/5 relative group transition-all duration-500 overflow-hidden",
                  staff.is_active ? "hover:border-gold-brushed/20 hover:gold-glow" : "opacity-60 grayscale"
                )}>
                  <div className="absolute top-8 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Shield size={64} className="text-gold-brushed" />
                  </div>
                  
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gold-brushed/10 border border-gold-brushed/20 flex items-center justify-center font-serif text-3xl text-gold-brushed shrink-0">
                      {staff.first_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-serif italic text-theme-text leading-tight">{staff.first_name} {staff.last_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60">@{staff.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                          <p className="text-[8px] uppercase font-black text-gold-brushed opacity-30 tracking-widest">Active Status</p>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", staff.is_active ? "bg-emerald-500" : "bg-red-500")} />
                            <span className="text-[10px] text-theme-text/60 font-bold uppercase tracking-widest">
                              {staff.is_active ? 'Authorized' : 'Suspended'}
                            </span>
                          </div>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => toggleStatus(staff.id, staff.is_active)}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            staff.is_active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-red-500 hover:bg-red-500/10"
                          )}
                        >
                          {staff.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[8px] uppercase font-black text-gold-brushed opacity-30 tracking-widest">Organizational Role</p>
                      {isAdmin ? (
                        <select 
                          value={staff.role_id}
                          onChange={(e) => updateRole(staff.id, e.target.value)}
                          className="w-full bg-navy-midnight/50 border border-gold-brushed/10 rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest text-gold-brushed outline-none focus:border-gold-brushed/40 transition-all cursor-pointer"
                        >
                          {roles.map(r => (
                            <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="bg-gold-brushed/5 border border-gold-brushed/10 rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest text-gold-brushed text-center">
                          {staff.role}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex items-center justify-between text-[8px] text-theme-text/40 font-mono">
                      <span>{staff.email}</span>
                      <span>E-SIGN ID: {staff.id.toString().padStart(6, '0')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="roles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
             {roles.map((role: any) => (
                <div key={role.role_id} className="glass p-8 rounded-[2rem] border-white/5 hover:border-gold-brushed/20 transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-gold-brushed/10 flex items-center justify-center text-gold-brushed mb-6 group-hover:scale-110 transition-transform">
                      <Shield size={24} />
                   </div>
                   <h4 className="text-xl font-serif italic text-theme-text mb-2">{role.role_name}</h4>
                   <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-40 mb-6">
                      {employees.filter(e => e.role_id === role.role_id).length} Active Assignments
                   </p>
                   
                   <div className="space-y-2">
                       {role.permissions ? (
                          Object.entries(role.permissions)
                            .filter(([_, v]) => v === true)
                            .map(([k]) => (
                               <div key={k} className="flex items-center gap-2 text-[9px] font-bold text-theme-text/80 uppercase tracking-tighter">
                                  <div className="w-1 h-1 rounded-full bg-gold-brushed" />
                                  {k.replace(/_/g, ' ')}
                               </div>
                            ))
                       ) : (
                          <>
                             <div className="flex items-center gap-2 text-[9px] font-bold text-theme-text/60 uppercase">
                                <div className="w-1 h-1 rounded-full bg-gold-brushed/40" />
                                Directory Access
                             </div>
                             <div className="flex items-center gap-2 text-[9px] font-bold text-theme-text/60 uppercase">
                                <div className="w-1 h-1 rounded-full bg-gold-brushed/40" />
                                Operational Rights
                             </div>
                          </>
                       )}
                   </div>
                </div>
             ))}
             
             {isAdmin && (
               <div 
                 onClick={() => setShowAddRoleModal(true)}
                 className="glass p-8 rounded-[2rem] border-dashed border-gold-brushed/20 flex flex-col items-center justify-center text-center gap-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
               >
                  <div className="w-12 h-12 rounded-full border border-gold-brushed/40 flex items-center justify-center text-gold-brushed">
                     <Plus size={24} />
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed">Define New Role Profile</p>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddRoleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddRoleModal(false)}
              className="absolute inset-0 bg-navy-midnight/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="glass p-10 rounded-[3rem] w-full max-w-2xl relative z-10 border-gold-brushed/20 max-h-[90vh] overflow-y-auto"
            >
               <button 
                onClick={() => setShowAddRoleModal(false)}
                className="absolute top-8 right-8 text-gold-brushed/40 hover:text-gold-brushed transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Matrix Configuration</p>
                <h3 className="text-3xl text-theme-text italic">Define Access Profile</h3>
              </div>

              {success && (
                <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl mb-8 border border-emerald-500/20">
                   Privilege Matrix Synchronized Successfully.
                </div>
              )}

              <form onSubmit={handleAddRole} className="space-y-8">
                 <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Role Designation</label>
                    <input 
                      required
                      className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all"
                      placeholder="e.g. Senior Clinical Pharmacist"
                      value={roleFormData.role_name}
                      onChange={e => setRoleFormData({...roleFormData, role_name: e.target.value})}
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-4 block underline underline-offset-8">Entitlement Vector</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.entries(roleFormData.permissions).map(([key, value]) => (
                         <label key={key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-gold-brushed/20 transition-all cursor-pointer group">
                           <span className="text-[10px] uppercase font-black tracking-widest text-theme-text opacity-60 group-hover:opacity-100 transition-opacity">
                              {key.replace(/_/g, ' ')}
                           </span>
                           <input 
                             type="checkbox"
                             checked={value}
                             onChange={e => setRoleFormData({
                               ...roleFormData,
                               permissions: { ...roleFormData.permissions, [key]: e.target.checked }
                             })}
                             className="accent-gold-brushed w-4 h-4 rounded border-gold-brushed/20"
                           />
                         </label>
                       ))}
                    </div>
                 </div>

                 <button 
                  disabled={isSubmitting}
                  className="w-full bg-gold-brushed text-navy-midnight py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.5em] shadow-xl shadow-gold-brushed/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Commit Privilege Profile'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-navy-midnight/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="glass p-10 rounded-[3rem] w-full max-w-xl relative z-10 border-gold-brushed/20"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-gold-brushed/40 hover:text-gold-brushed transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Security Hub</p>
                <h3 className="text-3xl text-theme-text italic">Authorize Personnel</h3>
              </div>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black tracking-widest p-4 rounded-xl mb-8 border border-emerald-500/20"
                >
                  Credential Matrix Generated. Welcome Aboard.
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 text-red-500 text-[10px] uppercase font-bold tracking-widest p-4 rounded-xl mb-8 border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleAddEmployee} className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">First Name</label>
                        <div className="relative">
                           <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
                           <input 
                             required
                             className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text outline-none focus:border-gold-brushed transition-all"
                             placeholder="Ex: Elias"
                             value={formData.first_name}
                             onChange={e => setFormData({...formData, first_name: e.target.value})}
                           />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Last Name</label>
                        <input 
                          required
                          className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 px-6 text-sm text-theme-text outline-none focus:border-gold-brushed transition-all"
                          placeholder="Ex: Tilahun"
                          value={formData.last_name}
                          onChange={e => setFormData({...formData, last_name: e.target.value})}
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">E-Sign Link (Email)</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
                       <input 
                         required
                         type="email"
                         className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text outline-none focus:border-gold-brushed transition-all"
                         placeholder="staff.member@pharmacy.com"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Registry ID (Username)</label>
                        <input 
                          required
                          className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 px-6 text-sm text-theme-text outline-none focus:border-gold-brushed transition-all"
                          placeholder="staff_handle"
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Phone Number</label>
                        <input 
                          className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 px-6 text-sm text-theme-text outline-none focus:border-gold-brushed transition-all"
                          placeholder="+251-..."
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Access Key (Password)</label>
                        <div className="relative">
                           <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
                           <input 
                             required
                             type="password"
                             className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text outline-none focus:border-gold-brushed transition-all"
                             placeholder="••••••••"
                             value={formData.password}
                             onChange={e => setFormData({...formData, password: e.target.value})}
                           />
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Core Privilege Role</label>
                    <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
                        <select 
                          required
                          className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text outline-none appearance-none focus:border-gold-brushed transition-all"
                          value={formData.role_id}
                          onChange={e => setFormData({...formData, role_id: e.target.value})}
                        >
                          <option value="">Assign Role Profile</option>
                          {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                        </select>
                    </div>
                 </div>

                 <button 
                  disabled={isSubmitting}
                  className="w-full bg-gold-brushed text-navy-midnight py-5 rounded-2xl font-black uppercase text-xs tracking-[0.5em] shadow-xl shadow-gold-brushed/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Log Final Signature'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

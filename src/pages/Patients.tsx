/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Search, Plus, Filter, Phone, Mail, Calendar, X, Loader2, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  gender: string;
  address?: string;
  medical_history?: string;
  allergies?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  created_at?: string;
}

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [demographicFilters, setDemographicFilters] = useState({
    gender: 'All',
    ageGroup: 'All',
    insurance: 'All'
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Other',
    phone: '',
    email: '',
    address: '',
    medical_history: '',
    allergies: '',
    insurance_provider: '',
    insurance_policy_number: ''
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.patients.list();
      setPatients(data);
      setErrorStatus(null);
    } catch (err: any) {
      setErrorStatus(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    // Clean phone number of spaces, hyphens, parentheses before validating
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
    if (!isPhoneValid) {
      setErrorStatus("A valid Ethiopian phone number is required (e.g. 09xxxxxxxx, 07xxxxxxxx, or +251 9xxxxxxxx)");
      return;
    }

    // Validate email format if provided
    if (formData.email.trim() !== '') {
      const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim());
      if (!isEmailValid) {
        setErrorStatus("Please enter a valid email address structure (e.g. name@domain.com)");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.patients.create({
        ...formData,
        phone: cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : (cleanPhone.startsWith('251') ? '+' + cleanPhone : cleanPhone)
      });
      setSuccessMessage('Patient enrolled successfully');
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'Other',
        phone: '',
        email: '',
        address: '',
        medical_history: '',
        allergies: '',
        insurance_provider: '',
        insurance_policy_number: ''
      });
      
      fetchPatients();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      setErrorStatus(err.message || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_id.toString().includes(searchTerm) ||
      (p.phone && p.phone.includes(searchTerm));

    // Gender Filter
    const matchesGender = demographicFilters.gender === 'All' || p.gender === demographicFilters.gender;

    // Age Group Filter
    let matchesAge = true;
    if (demographicFilters.ageGroup !== 'All' && p.date_of_birth) {
      const birthDate = new Date(p.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (demographicFilters.ageGroup === 'Pediatric') {
        matchesAge = age < 18;
      } else if (demographicFilters.ageGroup === 'Adult') {
        matchesAge = age >= 18 && age < 65;
      } else if (demographicFilters.ageGroup === 'Senior') {
        matchesAge = age >= 65;
      }
    }

    // Insurance Filter
    let matchesInsurance = true;
    if (demographicFilters.insurance === 'Insured') {
      matchesInsurance = !!(p.insurance_provider && p.insurance_provider.trim());
    } else if (demographicFilters.insurance === 'Uninsured') {
      matchesInsurance = !(p.insurance_provider && p.insurance_provider.trim());
    }

    return matchesSearch && matchesGender && matchesAge && matchesInsurance;
  });

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Electronic Health Records</p>
          <h2 className="text-4xl text-theme-text italic">Patient Registry</h2>
        </div>
        
        <button 
          onClick={() => {
            setErrorStatus(null);
            setSuccessMessage('');
            setIsModalOpen(true);
          }}
          className="bg-gold-brushed text-navy-midnight px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-gold-brushed/20"
        >
          <Plus size={16} /> Register New Patient
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text/40 group-focus-within:text-gold-brushed transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search patient records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "glass px-6 py-4 rounded-2xl border-white/5 text-gold-brushed flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-gold-brushed/5 transition-all",
            (showFilters || demographicFilters.gender !== 'All' || demographicFilters.ageGroup !== 'All' || demographicFilters.insurance !== 'All') && "border-gold-brushed/40 bg-gold-brushed/10"
          )}
        >
          <Filter size={16} /> Demographic Filter
          {(demographicFilters.gender !== 'All' || demographicFilters.ageGroup !== 'All' || demographicFilters.insurance !== 'All') && (
            <span className="w-2 h-2 rounded-full bg-gold-brushed inline-block animate-pulse" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-6 rounded-[2rem] border-gold-brushed/20 bg-gold-brushed/[0.02] grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gender Filter */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold tracking-widest text-gold-brushed opacity-60">Gender</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setDemographicFilters(prev => ({ ...prev, gender: g }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider border border-white/10 transition-all",
                        demographicFilters.gender === g 
                          ? "bg-gold-brushed text-navy-midnight font-black border-gold-brushed" 
                          : "bg-white/5 text-theme-text/60 hover:bg-white/10"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Group Filter */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold tracking-widest text-gold-brushed opacity-60">Age Demographics</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All', value: 'All' },
                    { label: 'Pediatric (<18)', value: 'Pediatric' },
                    { label: 'Adult (18-64)', value: 'Adult' },
                    { label: 'Senior (65+)', value: 'Senior' }
                  ].map((ag) => (
                    <button
                      key={ag.value}
                      onClick={() => setDemographicFilters(prev => ({ ...prev, ageGroup: ag.value }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider border border-white/10 transition-all",
                        demographicFilters.ageGroup === ag.value 
                          ? "bg-gold-brushed text-navy-midnight font-black border-gold-brushed" 
                          : "bg-white/5 text-theme-text/60 hover:bg-white/10"
                      )}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insurance Filter */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold tracking-widest text-gold-brushed opacity-60">Insurance Coverage</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Insured', 'Uninsured'].map((ins) => (
                    <button
                      key={ins}
                      onClick={() => setDemographicFilters(prev => ({ ...prev, insurance: ins }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider border border-white/10 transition-all",
                        demographicFilters.insurance === ins 
                          ? "bg-gold-brushed text-navy-midnight font-black border-gold-brushed" 
                          : "bg-white/5 text-theme-text/60 hover:bg-white/10"
                      )}
                    >
                      {ins}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Control */}
              <div className="col-span-1 md:col-span-3 flex justify-end pt-2 border-t border-white/5">
                <button
                  onClick={() => setDemographicFilters({ gender: 'All', ageGroup: 'All', insurance: 'All' })}
                  className="text-[9px] uppercase font-black tracking-widest text-gold-brushed hover:underline"
                >
                  Clear Demographic Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errorStatus && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <X size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black opacity-60">Security Registry Error</p>
            <p className="text-sm italic font-serif mt-1">{errorStatus}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-gold-brushed" size={40} />
          <p className="text-gold-brushed font-medium tracking-widest text-[10px] uppercase">Retrieving Hub Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPatients.map((p) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-8 rounded-[2.5rem] border-white/5 hover:border-gold-brushed/20 transition-all group relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-gold-brushed group-hover:opacity-[0.08] transition-opacity">
                  <UserRound size={80} />
               </div>
               
               <div className="flex items-start gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gold-brushed/10 border border-gold-brushed/20 flex items-center justify-center font-serif text-3xl text-gold-brushed">
                     {p.first_name[0]}
                  </div>
                  <div>
                     <h3 className="text-xl font-serif italic text-theme-text">{p.first_name} {p.last_name}</h3>
                     <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-60 mt-1">{p.patient_id}</p>
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-theme-text/60">
                     <Phone size={14} className="text-gold-brushed/40" />
                     <span className="text-[11px] font-mono">{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-theme-text/60">
                     <Mail size={14} className="text-gold-brushed/40" />
                     <span className="text-[11px] font-mono">{p.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-theme-text/60">
                     <Calendar size={14} className="text-gold-brushed/40" />
                     <span className="text-[11px] uppercase font-black tracking-widest text-[9px]">DOB: {p.date_of_birth}</span>
                  </div>
                  {p.address && (
                    <div className="flex items-start gap-3 text-theme-text/60">
                      <div className="mt-1"><Search size={14} className="text-gold-brushed/40" /></div>
                      <span className="text-[11px] font-light leading-relaxed italic">{p.address}</span>
                    </div>
                  )}
                  {p.insurance_provider && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                       <span className="text-[9px] uppercase tracking-widest text-gold-brushed font-black">Insured</span>
                       <span className="text-[10px] text-theme-text opacity-60 font-serif italic">{p.insurance_provider}</span>
                    </div>
                  )}
               </div>

               <button 
                  onClick={() => navigate(`/dashboard/clinical-files/${p.patient_id}`)}
                  className="w-full mt-8 py-4 bg-gold-brushed/5 border border-gold-brushed/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold-brushed hover:bg-gold-brushed hover:text-navy-midnight transition-all"
               >
                  Access Clinical File
               </button>
            </motion.div>
          ))}
          
          {filteredPatients.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <UserRound className="mx-auto text-theme-text/10 mb-4" size={64} />
              <p className="text-theme-text/40 font-serif italic text-xl">No matching patient profiles found in the registry.</p>
            </div>
          )}
        </div>
      )}

      {/* Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy-midnight/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass p-10 rounded-[3rem] border-gold-brushed/20 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-theme-text/40 hover:text-gold-brushed transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <p className="text-gold-brushed font-medium tracking-[0.4em] uppercase text-[10px] mb-2">New Enrollment</p>
                <h3 className="text-3xl text-theme-text italic font-serif">Patient Registration</h3>
                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] uppercase font-bold tracking-widest text-center"
                  >
                    {successMessage}
                  </motion.div>
                )}
                {errorStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] uppercase font-bold tracking-widest text-center"
                  >
                    {errorStatus}
                  </motion.div>
                )}
              </div>

              <form id="patient-registration-form" onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">First Name</label>
                    <input 
                      id="first-name-input"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Last Name</label>
                    <input 
                      id="last-name-input"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Date of Birth</label>
                    <input 
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light appearance-none"
                    >
                      <option value="Male" className="bg-navy-midnight">Male</option>
                      <option value="Female" className="bg-navy-midnight">Female</option>
                      <option value="Other" className="bg-navy-midnight">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Phone Number</label>
                    <input 
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                      placeholder="+251 9XX XXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Email Address</label>
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Residential Address</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                    placeholder="Enter full primary residence address..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Insurance Provider</label>
                    <input 
                      type="text"
                      value={formData.insurance_provider}
                      onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                      placeholder="e.g. BlueCross"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Policy Number</label>
                    <input 
                      type="text"
                      value={formData.insurance_policy_number}
                      onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
                      placeholder="e.g. BC-123456"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Allergies (Optional)</label>
                  <textarea 
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light min-h-[100px] resize-none"
                    placeholder="List any known medication allergies..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold ml-2">Medical History (Optional)</label>
                  <textarea 
                    value={formData.medical_history}
                    onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light min-h-[100px] resize-none"
                    placeholder="Brief summary of relevant medical history..."
                  />
                </div>

                <button 
                  id="finalize-enrollment-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold-brushed text-navy-midnight py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gold-brushed/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Encrypting Data...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Finalize Enrollment
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Activity, 
  AlertCircle, 
  Clipboard, 
  History, 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle2,
  Stethoscope,
  Microscope,
  ScrollText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface ClinicalData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_history: string;
  allergies: string;
  chronic_conditions?: string;
  blood_type?: string;
  current_medications?: string;
  clinical_notes?: string;
}

export default function ClinicalRecords() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<ClinicalData | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientData, prescrsData] = await Promise.all([
          api.patients.get(patientId),
          api.patients.prescriptions(patientId)
        ]);
        
        setData(patientData);
        setPrescriptions(prescrsData);

      } catch (err) {
        console.error('Failed to fetch clinical records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const handleUpdate = async () => {
    if (!patientId || !data) return;
    setSaving(true);
    try {
      await api.patients.update(patientId, data);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update record:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="animate-spin text-gold-brushed" size={48} />
        <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-xs">Accessing Encrypted Records...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-32 space-y-6">
        <AlertCircle size={64} className="mx-auto text-red-500/50" />
        <h2 className="text-2xl text-theme-text font-serif italic">Record Integrity Compromised</h2>
        <p className="text-theme-text/40">The requested clinical file could not be located in the central registry.</p>
        <button 
          onClick={() => navigate('/dashboard/patients')}
          className="text-gold-brushed underline underline-offset-8 uppercase text-[10px] font-black tracking-widest"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/dashboard/patients')}
            className="flex items-center gap-2 text-gold-brushed/40 hover:text-gold-brushed transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
          >
            <ArrowLeft size={14} /> Back to Registry
          </button>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px]">Clinical Dossier v2.4</p>
          <h2 className="text-4xl text-theme-text italic flex items-center gap-4">
            {data.first_name} {data.last_name}
            <span className="text-[10px] not-italic font-mono px-3 py-1 bg-white/5 rounded-full text-white/40 border border-white/10 uppercase tracking-tighter">
              UID: {patientId?.slice(0, 8)}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20"
              >
                <CheckCircle2 size={14} /> Synced to Server
              </motion.div>
            )}
          </AnimatePresence>
          
          {!editing ? (
            <button 
              onClick={() => setEditing(true)}
              className="bg-gold-brushed/10 text-gold-brushed border border-gold-brushed/20 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gold-brushed hover:text-navy-midnight transition-all shadow-lg"
            >
              Modify Record
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setEditing(false)}
                className="px-6 py-3 text-theme-text/40 hover:text-theme-text text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Discard
              </button>
              <button 
                disabled={saving}
                onClick={handleUpdate}
                className="bg-gold-brushed text-navy-midnight px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-gold-brushed/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                {saving ? 'Syncing...' : 'Commit Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Demographics & Stats */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-gold-brushed">
              <User size={64} />
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/40 mb-6">Patient Identification</p>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[11px] text-theme-text/40 italic">Sex</span>
                <span className="text-theme-text font-serif italic uppercase text-sm tracking-widest">{data.gender}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[11px] text-theme-text/40 italic">Birth Date</span>
                <span className="text-theme-text font-mono text-sm">{data.date_of_birth}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[11px] text-theme-text/40 italic">Blood Group</span>
                <input 
                  type="text"
                  disabled={!editing}
                  value={data.blood_type || ''}
                  onChange={(e) => setData({...data, blood_type: e.target.value})}
                  className="bg-transparent text-right text-gold-brushed font-black outline-none w-20"
                  placeholder="Unknown"
                />
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-gold-brushed/[0.02]">
            <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/40 mb-6 flex items-center gap-2">
              <Activity size={14} /> Vitals Summary
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] uppercase text-white/40 tracking-widest mb-1">Status</p>
                <p className="text-emerald-400 font-black text-xs uppercase italic">Active</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] uppercase text-white/40 tracking-widest mb-1">Risk Level</p>
                <p className={cn(
                  "font-black text-xs uppercase italic",
                  data.allergies ? "text-amber-400" : "text-emerald-400"
                )}>
                  {data.allergies ? 'Elevated' : 'Low'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/5">
            <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/40 mb-6 flex items-center gap-2">
              <ScrollText size={14} /> Recent Prescriptions
            </p>
            <div className="space-y-4">
              {prescriptions.slice(0, 3).map((p) => (
                <div key={p.prescription_id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-gold-brushed/20 transition-all cursor-pointer">
                  <p className="text-xs text-theme-text font-serif italic mb-1">RX #{p.prescription_id}</p>
                  <p className="text-[8px] uppercase text-white/40 tracking-widest">Issued {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {prescriptions.length === 0 && (
                <p className="text-[10px] text-white/20 italic text-center py-4">No prescription data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Column: Main Records */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 text-amber-500">
                 <AlertCircle size={32} />
               </div>
               <p className="text-[10px] uppercase font-black tracking-widest text-amber-500/60 mb-2 flex items-center gap-2">
                 <AlertCircle size={14} /> Allergies & Contraindications
               </p>
               {editing ? (
                 <textarea 
                    value={data.allergies}
                    onChange={(e) => setData({...data, allergies: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-theme-text outline-none focus:border-gold-brushed/40 min-h-[120px] font-light"
                 />
               ) : (
                 <p className="text-sm text-theme-text/80 font-serif italic leading-relaxed min-h-[120px]">
                   {data.allergies || 'No allergies recorded in file.'}
                 </p>
               )}
            </div>

            <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-500">
                 <Stethoscope size={32} />
               </div>
               <p className="text-[10px] uppercase font-black tracking-widest text-blue-500/60 mb-2 flex items-center gap-2">
                 <Stethoscope size={14} /> Chronic Conditions
               </p>
               {editing ? (
                 <textarea 
                    value={data.chronic_conditions || ''}
                    onChange={(e) => setData({...data, chronic_conditions: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-theme-text outline-none focus:border-gold-brushed/40 min-h-[120px] font-light"
                    placeholder="List persistent conditions (e.g., Hypertension, Diabetes)..."
                 />
               ) : (
                 <p className="text-sm text-theme-text/80 font-serif italic leading-relaxed min-h-[120px]">
                   {data.chronic_conditions || 'No recorded chronic conditions.'}
                 </p>
               )}
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4 relative">
             <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/40 mb-2 flex items-center gap-2">
               <History size={14} /> Detailed Medical History
             </p>
             {editing ? (
               <textarea 
                  value={data.medical_history}
                  onChange={(e) => setData({...data, medical_history: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xs text-theme-text outline-none focus:border-gold-brushed/40 min-h-[300px] leading-relaxed font-light"
               />
             ) : (
               <div className="text-sm text-theme-text/80 font-serif italic leading-relaxed min-h-[300px] whitespace-pre-wrap px-2">
                 {data.medical_history || 'Clear medical history file.'}
               </div>
             )}
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4 relative">
             <div className="flex items-center justify-between mb-4">
               <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500/60 flex items-center gap-2">
                 <Clipboard size={14} /> Clinical Evaluation Notes
               </p>
               <span className="text-[8px] uppercase font-black tracking-widest text-white/20">Securely Encrypted Ledger</span>
             </div>
             {editing ? (
               <textarea 
                  value={data.clinical_notes || ''}
                  onChange={(e) => setData({...data, clinical_notes: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xs text-theme-text outline-none focus:border-gold-brushed/40 min-h-[200px] leading-relaxed font-mono"
                  placeholder="Enter practitioner internal notes, follow-up requirements..."
               />
             ) : (
               <div className="text-xs text-theme-text/60 font-mono leading-relaxed min-h-[200px] whitespace-pre-wrap bg-white/[0.01] p-6 rounded-2xl border border-white/5 italic">
                 {data.clinical_notes || 'No active practitioner notes recorded.'}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, UserPlus, X, CheckCircle2, Loader2, Stethoscope, Phone, Mail, IdCard, Plus, Trash2, Pill } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface Prescription {
  id: string;
  patient_id: string;
  prescriber_id: string;
  issue_date: string;
  expiry_date?: string;
  status: string;
  digital_signature?: string;
  notes?: string;
  created_at?: any;
  // Denormalized for list performance
  patient_name?: string;
  prescriber_name?: string;
}

interface PrescriptionItemForm {
  product_id: string;
  dosage_instructions: string;
  quantity_prescribed: number;
  refills_allowed: number;
  product_name?: string;
}

interface PrescriptionForm {
  patient_id: string;
  prescriber_id: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  digital_signature: string;
  notes: string;
  items: PrescriptionItemForm[];
}

interface PrescriberForm {
  first_name: string;
  last_name: string;
  license_number: string;
  specialization: string;
  clinic_name: string;
  phone: string;
  email: string;
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, dispensed: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriberForm, setPrescriberForm] = useState<PrescriberForm>({
    first_name: '',
    last_name: '',
    license_number: '',
    specialization: '',
    clinic_name: '',
    phone: '',
    email: ''
  });

  const [rxForm, setRxForm] = useState<PrescriptionForm>({
    patient_id: '',
    prescriber_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Active',
    digital_signature: '',
    notes: '',
    items: [{ product_id: '', dosage_instructions: '', quantity_prescribed: 1, refills_allowed: 0 }]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsData, prescribersData, productsData, prescriptionsData] = await Promise.all([
        api.patients.list(),
        api.clinical.prescribers(),
        api.inventory.list(),
        api.clinical.prescriptions()
      ]);
      setPatients(patientsData);
      setPrescribers(prescribersData);
      setProducts(productsData.map((p: any) => ({
        id: p.product_id,
        name: p.product_name,
        sku: p.sku
      })));

      const formattedPrescriptions = prescriptionsData.map((rx: any) => ({
        ...rx,
        id: rx.prescription_id.toString(),
        patient_name: `${rx.patient_first} ${rx.patient_last}`,
        prescriber_name: `Dr. ${rx.prescriber_first} ${rx.prescriber_last}`
      }));
      setPrescriptions(formattedPrescriptions);

      const aggregatedStats = formattedPrescriptions.reduce((acc: any, curr: any) => {
        acc.total++;
        if (curr.status === 'Active') acc.active++;
        if (curr.status === 'Dispensed') acc.dispensed++;
        if (curr.status === 'Expired') acc.expired++;
        return acc;
      }, { total: 0, active: 0, dispensed: 0, expired: 0 });
      setStats(aggregatedStats);

    } catch (err) {
      console.error("Clinical sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPrescriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Clean phone number of spaces, hyphens, parentheses before validating
    const cleanPhone = prescriberForm.phone ? prescriberForm.phone.replace(/[\s\-\(\)]/g, '') : '';
    if (cleanPhone) {
      const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
      if (!isPhoneValid) {
        setError("A valid Ethiopian phone number is required (e.g. 09xxxxxxxx, 07xxxxxxxx, or +251 9xxxxxxxx)");
        return;
      }
    }

    // Validate email format
    if (prescriberForm.email && prescriberForm.email.trim() !== '') {
      const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(prescriberForm.email.trim());
      if (!isEmailValid) {
        setError("Please enter a valid email address structure (e.g. name@domain.com)");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.clinical.createPrescriber({
        ...prescriberForm,
        phone: cleanPhone ? (cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : (cleanPhone.startsWith('251') ? '+' + cleanPhone : cleanPhone)) : ''
      });
      setIsModalOpen(false);
      fetchData();
      
      setPrescriberForm({
        first_name: '',
        last_name: '',
        license_number: '',
        specialization: '',
        clinic_name: '',
        phone: '',
        email: ''
      });
    } catch (err: any) {
      console.error('Failed to add prescriber:', err);
      setError(err.message || 'Failed to register practitioner profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rxForm.items.length === 0 || rxForm.items.some(item => !item.product_id)) {
      alert("Please add at least one medication to the prescription.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.clinical.createPrescription(rxForm);
      
      setIsRxModalOpen(false);
      fetchData();
      setRxForm({
        patient_id: '',
        prescriber_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'Active',
        digital_signature: '',
        notes: '',
        items: [{ product_id: '', dosage_instructions: '', quantity_prescribed: 1, refills_allowed: 0 }]
      });
    } catch (err) {
      console.error('Failed to issue prescription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setRxForm({
      ...rxForm,
      items: [...rxForm.items, { product_id: '', dosage_instructions: '', quantity_prescribed: 1, refills_allowed: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setRxForm({
      ...rxForm,
      items: rxForm.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: keyof PrescriptionItemForm, value: any) => {
    const newItems = [...rxForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setRxForm({ ...rxForm, items: newItems });
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2 opacity-70">Clinical Management</p>
          <h2 className="text-4xl md:text-5xl text-theme-text font-serif italic tracking-tight">Prescription Registry</h2>
        </div>
        <div className="flex gap-4">
          <button 
            id="add-rx-btn"
            onClick={() => setIsRxModalOpen(true)}
            className="group relative overflow-hidden bg-navy-midnight border border-gold-brushed/40 text-gold-brushed px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.25em] transition-all duration-500 hover:bg-gold-brushed hover:text-navy-midnight active:scale-95 flex items-center justify-center gap-3"
          >
            <FileText size={18} />
            <span>Issue Prescription</span>
          </button>
          <button 
            id="add-prescriber-btn"
            onClick={() => setIsModalOpen(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-gold-brushed to-amber-600 text-navy-midnight px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.25em] shadow-[0_10px_40px_rgba(212,175,55,0.25)] hover:shadow-[0_15px_50px_rgba(212,175,55,0.4)] transition-all duration-500 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Add Prescriber</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Logs', count: stats.total, color: 'text-theme-text' },
          { label: 'Active Rxs', count: stats.active, color: 'text-gold-brushed' },
          { label: 'Direct Fills', count: stats.dispensed, color: 'text-emerald-400' },
          { label: 'Voided/Expired', count: stats.expired, color: 'text-red-400' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-gold-brushed/20 transition-all duration-500"
          >
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-theme-text opacity-40 font-black mb-3">{stat.label}</p>
              <p className={`text-4xl font-serif italic ${stat.color}`}>{stat.count || 0}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-gold-brushed/5 group-hover:scale-110 transition-transform duration-700">
               <FileText size={100} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden min-h-[400px] shadow-2xl">
        {loading ? (
          <div className="p-32 text-center">
            <Loader2 className="animate-spin text-gold-brushed/20 mx-auto mb-6" size={40} />
            <p className="text-theme-text opacity-20 italic font-serif text-xl tracking-wide">Syncing Clinical Repository...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gold-brushed/5 flex items-center justify-center mb-8">
              <FileText size={40} className="text-gold-brushed/20" />
            </div>
            <p className="text-theme-text opacity-30 italic font-serif text-2xl mb-2">Registry Empty</p>
            <p className="text-theme-text/20 text-sm tracking-widest uppercase">No verified digital signatures found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white/[0.03] text-[9px] uppercase tracking-[0.4em] text-theme-text/30 font-black">
                  <tr>
                    <th className="px-10 py-8">Clinical Identifier</th>
                    <th className="px-10 py-8">Beneficiary</th>
                    <th className="px-10 py-8">Practitioner</th>
                    <th className="px-10 py-8">Therapeutics</th>
                    <th className="px-10 py-8">Status</th>
                    <th className="px-10 py-8 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                   {prescriptions.map((rx, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={rx.id} 
                      className="hover:bg-gold-brushed/[0.03] transition-all duration-300 group cursor-default"
                    >
                      <td className="px-10 py-7 font-mono text-[10px] text-gold-brushed/60">
                        <span className="bg-gold-brushed/5 px-2 py-1 rounded">#RX-{rx.id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-theme-text/5 flex items-center justify-center text-[10px] text-theme-text font-serif italic border border-white/5">
                             {rx.patient_name?.[0]}
                           </div>
                           <span className="text-sm font-medium text-theme-text tracking-tight">{rx.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <span className="text-[10px] uppercase tracking-widest text-theme-text/50 font-bold group-hover:text-gold-brushed/70 transition-colors">
                          {rx.prescriber_name}
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <p className="text-xs text-theme-text opacity-60 italic font-serif line-clamp-1 max-w-xs">
                          {rx.notes || 'Routine Protocol'}
                        </p>
                      </td>
                      <td className="px-10 py-7">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm",
                          rx.status === 'Active' ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" :
                          rx.status === 'Dispensed' ? "bg-gold-brushed/5 text-gold-brushed border-gold-brushed/20" :
                          "bg-red-500/5 text-red-500 border-red-500/20"
                        )}>
                          {rx.status}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <button className="p-3 hover:bg-gold-brushed/10 rounded-2xl text-theme-text/20 hover:text-gold-brushed transition-all duration-300 transform group-hover:scale-110">
                           <Search size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Add Prescription Modal */}
      <AnimatePresence>
        {isRxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-midnight/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-3xl w-full rounded-[3rem] p-12 border border-gold-brushed/10 shadow-3xl overflow-y-auto max-h-[90vh] relative custom-scrollbar"
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setIsRxModalOpen(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl text-theme-text/40 hover:text-theme-text transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-12">
                <p className="text-gold-brushed font-medium tracking-[0.4em] uppercase text-[10px] mb-3">Clinical Directive</p>
                <h3 className="text-4xl text-theme-text font-serif italic tracking-tight">Issue Digital Prescription</h3>
              </div>

              <form onSubmit={handleAddPrescription} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Select Patient</label>
                    <select 
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all"
                      value={rxForm.patient_id}
                      onChange={e => setRxForm({...rxForm, patient_id: e.target.value})}
                    >
                      <option value="" className="bg-navy-midnight">Choose Beneficiary...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id} className="bg-navy-midnight">
                          {p.first_name} {p.last_name} ({p.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Issuing Physician</label>
                    <select 
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all"
                      value={rxForm.prescriber_id}
                      onChange={e => setRxForm({...rxForm, prescriber_id: e.target.value})}
                    >
                      <option value="" className="bg-navy-midnight">Choose Practitioner...</option>
                      {prescribers.map(p => (
                        <option key={p.id} value={p.id} className="bg-navy-midnight">
                          Dr. {p.first_name} {p.last_name} ({p.license_number})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Issue Date</label>
                    <input 
                      type="date"
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all"
                      value={rxForm.issue_date}
                      onChange={e => setRxForm({...rxForm, issue_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Expiry Date</label>
                    <input 
                      type="date"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all"
                      value={rxForm.expiry_date}
                      onChange={e => setRxForm({...rxForm, expiry_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Status</label>
                    <select 
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all"
                      value={rxForm.status}
                      onChange={e => setRxForm({...rxForm, status: e.target.value})}
                    >
                      <option value="Active" className="bg-navy-midnight">Active</option>
                      <option value="Cancelled" className="bg-navy-midnight">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-sm font-serif italic text-theme-text flex items-center gap-2">
                        <Pill size={16} className="text-gold-brushed" /> Prescribed Medications
                      </h4>
                      <p className="text-[9px] uppercase tracking-widest text-theme-text/30 font-bold mt-1">Specify medications and dosage protocols</p>
                    </div>
                    <button 
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-2 px-4 py-2 bg-gold-brushed/10 border border-gold-brushed/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-gold-brushed hover:bg-gold-brushed hover:text-navy-midnight transition-all"
                    >
                      <Plus size={12} /> Add Medicine
                    </button>
                  </div>

                  <div className="space-y-4">
                    {rxForm.items.map((item, idx) => (
                      <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6 relative group">
                        {rxForm.items.length > 1 && (
                          <button 
                             type="button"
                             onClick={() => removeItem(idx)}
                             className="absolute top-4 right-4 p-2 text-red-500/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Medication Selection</label>
                            <select 
                              required
                              className="w-full bg-navy-midnight border border-white/5 rounded-2xl p-4 text-sm text-theme-text focus:border-gold-brushed outline-none transition-all"
                              value={item.product_id}
                              onChange={e => updateItem(idx, 'product_id', e.target.value)}
                            >
                              <option value="" className="bg-navy-midnight">Search inventory...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id} className="bg-navy-midnight">
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Quantity</label>
                              <input 
                                type="number"
                                required
                                min="1"
                                className="w-full bg-navy-midnight border border-white/5 rounded-2xl p-4 text-sm text-theme-text focus:border-gold-brushed outline-none transition-all"
                                value={item.quantity_prescribed}
                                onChange={e => updateItem(idx, 'quantity_prescribed', parseInt(e.target.value))}
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Refills</label>
                              <input 
                                type="number"
                                min="0"
                                className="w-full bg-navy-midnight border border-white/5 rounded-2xl p-4 text-sm text-theme-text focus:border-gold-brushed outline-none transition-all"
                                value={item.refills_allowed}
                                onChange={e => updateItem(idx, 'refills_allowed', parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Dosage & Frequency Instructions</label>
                          <input 
                            className="w-full bg-navy-midnight border border-white/5 rounded-2xl p-4 text-sm text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                            placeholder="e.g., Take 1 tablet twice daily after meals for 7 days"
                            value={item.dosage_instructions}
                            onChange={e => updateItem(idx, 'dosage_instructions', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Clinical Notes & Dosage Protocols</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                    placeholder="Describe therapeutic regimen..."
                    value={rxForm.notes}
                    onChange={e => setRxForm({...rxForm, notes: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Electronic Digital Signature</label>
                  <input 
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5 font-mono text-[10px]"
                    placeholder="SHA-256 / RSA Identity Hash..."
                    value={rxForm.digital_signature}
                    onChange={e => setRxForm({...rxForm, digital_signature: e.target.value})}
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-gold-brushed text-navy-midnight p-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Authenticate & Issue</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Prescriber Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-midnight/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-2xl w-full rounded-[3rem] p-12 border border-gold-brushed/10 shadow-3xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl text-theme-text/40 hover:text-theme-text transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-12">
                <p className="text-gold-brushed font-medium tracking-[0.4em] uppercase text-[10px] mb-3">Registry Enrollment</p>
                <h3 className="text-4xl text-theme-text font-serif italic tracking-tight">New Practitioner Entry</h3>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] uppercase font-bold tracking-widest text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleAddPrescriber} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">First Name</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/20 group-focus-within:text-gold-brushed transition-colors">
                        <Stethoscope size={16} />
                      </div>
                      <input 
                        required
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                        placeholder="John"
                        value={prescriberForm.first_name}
                        onChange={e => setPrescriberForm({...prescriberForm, first_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Last Name</label>
                    <input 
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                      placeholder="Doe"
                      value={prescriberForm.last_name}
                      onChange={e => setPrescriberForm({...prescriberForm, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">License Number</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/20 group-focus-within:text-gold-brushed transition-colors">
                        <IdCard size={16} />
                      </div>
                      <input 
                        required
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                        placeholder="MD-98765432"
                        value={prescriberForm.license_number}
                        onChange={e => setPrescriberForm({...prescriberForm, license_number: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Clinical Specialization</label>
                    <input 
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                      placeholder="Internal Medicine"
                      value={prescriberForm.specialization}
                      onChange={e => setPrescriberForm({...prescriberForm, specialization: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Clinic / Hospital Affiliation</label>
                  <input 
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                    placeholder="St. Mary's Wellness Center"
                    value={prescriberForm.clinic_name}
                    onChange={e => setPrescriberForm({...prescriberForm, clinic_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Contact Phone</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/20 group-focus-within:text-gold-brushed transition-colors">
                        <Phone size={16} />
                      </div>
                      <input 
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                        placeholder="+1 (555) 000-0000"
                        value={prescriberForm.phone}
                        onChange={e => setPrescriberForm({...prescriberForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black block ml-1">Verified Email</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-brushed/20 group-focus-within:text-gold-brushed transition-colors">
                        <Mail size={16} />
                      </div>
                      <input 
                        type="email"
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-theme-text focus:border-gold-brushed outline-none transition-all placeholder:text-white/5"
                        placeholder="doctor@medical.org"
                        value={prescriberForm.email}
                        onChange={e => setPrescriberForm({...prescriberForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-gold-brushed text-navy-midnight p-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm Entry</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


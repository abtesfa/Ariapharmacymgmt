import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  Plus, 
  Search, 
  History, 
  ChevronRight, 
  Package, 
  Clock, 
  CheckCircle2, 
  X, 
  Loader2, 
  Filter,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';

type TabType = 'list' | 'new_order' | 'tracking';

export default function SupplierManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sqlSuppliers, setSqlSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suppliersData, ordersData, inventoryData] = await Promise.all([
        api.inventory.suppliers(),
        api.inventory.orders(),
        api.inventory.list()
      ]);
      setSuppliers(suppliersData);
      setOrders(ordersData);
      const mappedProducts = inventoryData.map((p: any) => ({
        id: p.product_id,
        name: p.product_name,
        sku: p.sku,
        category: p.category_name,
        price: p.cost_price || 0
      }));
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Failed to fetch supply data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form States
  const [supplierForm, setSupplierForm] = useState({
    name: '', contact: '', phone: '', email: '', address: ''
  });

  const [orderForm, setOrderForm] = useState({
    supplier_id: '', 
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    items: [] as { product_id: string, quantity: number, unit_cost: number }[]
  });

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const allSuppliers = suppliers;

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    // Clean phone number of spaces, hyphens, parentheses before validating
    const cleanPhone = supplierForm.phone ? supplierForm.phone.replace(/[\s\-\(\)]/g, '') : '';
    if (cleanPhone) {
      const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
      if (!isPhoneValid) {
        setErrorStatus("A valid Ethiopian phone number is required (e.g. 09xxxxxxxx, 07xxxxxxxx, or +251 9xxxxxxxx)");
        return;
      }
    }

    // Validate email if entered
    if (supplierForm.email && supplierForm.email.trim() !== '') {
      const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(supplierForm.email.trim());
      if (!isEmailValid) {
        setErrorStatus("Please enter a valid email address structure (e.g. name@domain.com)");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.inventory.createSupplier({
        ...supplierForm,
        phone: cleanPhone ? (cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : (cleanPhone.startsWith('251') ? '+' + cleanPhone : cleanPhone)) : ''
      });
      setSuccess(true);
      fetchData();
      setTimeout(() => {
        setSuccess(false);
        setSupplierForm({ name: '', contact: '', phone: '', email: '', address: '' });
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Failed to add supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderForm.items.length === 0) {
      setErrorStatus('Add at least one item to the manifest');
      return;
    }
    if (!orderForm.supplier_id) {
      setErrorStatus('Please select a designated partner source');
      return;
    }
    if (!orderForm.expected_delivery_date) {
      setErrorStatus('Expected delivery date is required');
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);
    
    try {
      await api.inventory.createOrder(orderForm);
      setSuccess(true);
      fetchData();
      setOrderForm({
        supplier_id: '', 
        order_date: new Date().toISOString().split('T')[0], 
        expected_delivery_date: '', 
        items: []
      });
      
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('tracking');
      }, 1500);

    } catch (err: any) {
      setErrorStatus(err.message || 'Order authorization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await api.inventory.updateOrderStatus(id, {
        status,
        actual_delivery_date: status === 'Received' ? new Date().toISOString().split('T')[0] : null
      });
      fetchData();
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'list', label: 'Supplier List', icon: Truck },
    { id: 'new_order', label: 'New Purchase Order', icon: Plus },
    { id: 'tracking', label: 'Order Tracking', icon: Clock },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Supply Chain Control</p>
          <h2 className="text-4xl text-theme-text italic">Supplier Management</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-gold-brushed text-navy-midnight scale-105 shadow-lg shadow-gold-brushed/10" 
                  : "glass text-theme-text opacity-60 hover:opacity-100"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[3rem] overflow-hidden min-h-[600px] flex flex-col">
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'list' && (
              <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-serif italic text-2xl text-theme-text">Active Suppliers</h3>
                         <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
                            <input 
                              type="text" 
                              placeholder="Search registry..."
                              className="bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl py-3 pl-12 pr-6 text-theme-text outline-none focus:border-gold-brushed/60 transition-all text-xs"
                            />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {allSuppliers.map(s => (
                           <div key={s.id || s.supplier_id} className="glass p-6 rounded-3xl border-white/5 hover:border-gold-brushed/30 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="p-3 bg-gold-brushed/10 rounded-2xl text-gold-brushed">
                                    <Truck size={20} />
                                 </div>
                                 <div className="flex gap-4">
                                    <button 
                                      onClick={() => {
                                        setOrderForm({...orderForm, supplier_id: s.id || s.supplier_id});
                                        setActiveTab('new_order');
                                      }}
                                      className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-0 group-hover:opacity-100 transition-all underline"
                                    >
                                      Create Order
                                    </button>
                                    <button className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-0 group-hover:opacity-100 transition-all underline">Edit Detail</button>
                                 </div>
                              </div>
                              <h4 className="text-lg font-serif italic text-theme-text">{s.name || s.supplier_name}</h4>
                              <p className="text-[10px] opacity-40 uppercase tracking-widest font-black mb-4">Contact: {s.contact_person || 'N/A'}</p>
                              
                              <div className="space-y-2 pt-4 border-t border-white/5">
                                 <div className="flex items-center gap-2 text-xs text-theme-text/60">
                                    <TrendingUp size={12} className="text-gold-brushed" />
                                    <span>Reliability: 98%</span>
                                 </div>
                                 <p className="text-[10px] text-theme-text/40">{s.phone} | {s.email}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <form onSubmit={handleAddSupplier} className="glass p-8 rounded-[2.5rem] border-gold-brushed/10 sticky top-10">
                         <h4 className="font-serif italic text-xl text-theme-text mb-6">Register Partner</h4>
                         {success && (
                           <div className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={14} /> Partner Registered Successfully.
                              </div>
                              <button 
                                type="button"
                                onClick={() => setActiveTab('new_order')}
                                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all text-emerald-500 flex items-center justify-center gap-2 text-[9px]"
                              >
                                <Plus size={12} /> Create Purchase Order
                              </button>
                           </div>
                         )}
                         {errorStatus && <div className="text-red-500 text-[10px] uppercase font-black tracking-widest mb-4 bg-red-500/5 p-3 rounded-xl border border-red-500/10 flex items-center gap-2 font-mono"><Clock size={14} /> {errorStatus}</div>}
                         <div className="space-y-4">
                            <div>
                               <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-1 block">Legal Entity Name</label>
                               <input 
                                 required
                                 className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-xl p-3 text-xs text-theme-text outline-none focus:border-gold-brushed"
                                 placeholder="e.g. BioGeneric Global"
                                 value={supplierForm.name}
                                 onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                               />
                            </div>
                            <div>
                               <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-1 block">Primary Contact</label>
                               <input 
                                 className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-xl p-3 text-xs text-theme-text outline-none focus:border-gold-brushed"
                                 placeholder="Representative Name"
                                 value={supplierForm.contact}
                                 onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})}
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-1 block">Phone</label>
                                  <input 
                                    className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-xl p-3 text-xs text-theme-text outline-none focus:border-gold-brushed"
                                    placeholder="+251..."
                                    value={supplierForm.phone}
                                    onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-1 block">Email</label>
                                  <input 
                                    type="email"
                                    className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-xl p-3 text-xs text-theme-text outline-none focus:border-gold-brushed"
                                    placeholder="ops@partner.com"
                                    value={supplierForm.email}
                                    onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                                  />
                               </div>
                            </div>
                            <div>
                               <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-1 block">Headquarters</label>
                               <textarea 
                                 className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-xl p-3 text-xs text-theme-text outline-none focus:border-gold-brushed h-20 resize-none"
                                 placeholder="Physical address..."
                                 value={supplierForm.address}
                                 onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                               />
                            </div>
                            <button disabled={isSubmitting} className="w-full bg-gold-brushed text-navy-midnight py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] shadow-lg shadow-gold-brushed/20 disabled:opacity-50">
                               {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Onboard Supplier'}
                            </button>
                         </div>
                      </form>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'new_order' && (
              <motion.div key="new_order" className="max-w-4xl mx-auto" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <form onSubmit={handleCreateOrder} className="glass p-10 rounded-[3rem] border-gold-brushed/10 space-y-10">
                   <div className="flex justify-between items-center pb-6 border-b border-white/5">
                      <h3 className="font-serif italic text-3xl text-theme-text">Purchase Requisition</h3>
                      <div className="flex gap-4">
                         <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black uppercase">Order Total</p>
                            <p className="text-2xl font-mono gold-text font-black">
                                ETB {orderForm.items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0).toLocaleString()}
                            </p>
                         </div>
                      </div>
                   </div>

                   {success && <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Order Authorized</p>
                        <p className="text-xs text-emerald-500/70 mt-1">Requisition successfully committed to registry.</p>
                      </div>
                   </div>}

                   {errorStatus && <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <X size={24} className="text-red-500" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-red-500">Authorization Failed</p>
                        <p className="text-xs text-red-500/70 mt-1">{errorStatus}</p>
                      </div>
                   </div>}

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                     <div className="lg:col-span-2 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                              <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Designated Source</label>
                              <select 
                                required
                                className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none appearance-none focus:border-gold-brushed"
                                value={orderForm.supplier_id}
                                onChange={e => setOrderForm({...orderForm, supplier_id: e.target.value})}
                              >
                                <option value="">Select Partner Entity</option>
                                {allSuppliers.map(s => {
                                  const idVal = s.supplier_id || s.id;
                                  const nameVal = s.name || s.supplier_name;
                                  return (
                                    <option key={idVal} value={idVal}>
                                      {nameVal} (Active Member)
                                    </option>
                                  );
                                })}
                              </select>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Order Date</label>
                                 <input 
                                   required
                                   type="date"
                                   className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl p-5 text-xs text-theme-text outline-none focus:border-gold-brushed"
                                   value={orderForm.order_date}
                                   onChange={e => setOrderForm({...orderForm, order_date: e.target.value})}
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">ETA Date</label>
                                 <input 
                                   required
                                   type="date"
                                   className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl p-5 text-xs text-theme-text outline-none focus:border-gold-brushed"
                                   value={orderForm.expected_delivery_date}
                                   onChange={e => setOrderForm({...orderForm, expected_delivery_date: e.target.value})}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-gold-brushed">Manifest Items</h4>
                              <button 
                                type="button"
                                onClick={() => setOrderForm({...orderForm, items: [...orderForm.items, { product_id: '', quantity: 1, unit_cost: 0 }]})}
                                className="text-[10px] uppercase tracking-widest font-bold underline text-theme-text/40 hover:text-gold-brushed transition-colors"
                              >
                                + Add Line Item
                              </button>
                           </div>
                           
                           <div className="space-y-3">
                              {orderForm.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-end bg-white/5 p-4 rounded-2xl animate-in slide-in-from-left-2 duration-300">
                                   <div className="flex-1">
                                      <label className="text-[8px] uppercase tracking-widest text-gold-brushed opacity-40 mb-1 block">Asset</label>
                                      <select 
                                        className="w-full bg-navy-midnight border border-white/10 rounded-xl p-3 text-xs text-theme-text outline-none"
                                        value={item.product_id}
                                        onChange={e => {
                                          const newItems = [...orderForm.items];
                                          const prodId = e.target.value;
                                          const selectedP = products.find(p => String(p.id) === String(prodId));
                                          newItems[idx].product_id = prodId;
                                          newItems[idx].unit_cost = selectedP ? (selectedP.price || 0) : 0;
                                          setOrderForm({...orderForm, items: newItems});
                                        }}
                                      >
                                        <option value="">Select Asset</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                   </div>
                                   <div className="w-24">
                                      <label className="text-[8px] uppercase tracking-widest text-gold-brushed opacity-40 mb-1 block">Quantity</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-navy-midnight border border-white/10 rounded-xl p-3 text-xs text-theme-text outline-none"
                                        value={item.quantity}
                                        onChange={e => {
                                          const newItems = [...orderForm.items];
                                          newItems[idx].quantity = parseInt(e.target.value) || 0;
                                          setOrderForm({...orderForm, items: newItems});
                                        }}
                                      />
                                   </div>
                                   <div className="w-32">
                                      <label className="text-[8px] uppercase tracking-widest text-gold-brushed opacity-40 mb-1 block">Unit Cost</label>
                                      <input 
                                        type="number"
                                        className="w-full bg-navy-midnight border border-white/10 rounded-xl p-3 text-xs text-theme-text outline-none"
                                        value={item.unit_cost}
                                        onChange={e => {
                                          const newItems = [...orderForm.items];
                                          newItems[idx].unit_cost = parseFloat(e.target.value) || 0;
                                          setOrderForm({...orderForm, items: newItems});
                                        }}
                                      />
                                   </div>
                                   <button 
                                     type="button"
                                     onClick={() => setOrderForm({...orderForm, items: orderForm.items.filter((_, i) => i !== idx)})}
                                     className="p-3 text-red-500/40 hover:text-red-500 transition-colors"
                                   >
                                     <X size={16} />
                                   </button>
                                </div>
                              ))}
                              {orderForm.items.length === 0 && <p className="text-center py-10 text-xs italic text-theme-text/20">Empty manifest. Select products from catalog to start.</p>}
                           </div>
                        </div>
                     </div>

                     <div className="lg:border-l border-white/5 lg:pl-12 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[10px] uppercase font-black tracking-widest text-gold-brushed flex items-center gap-2">
                             <Package size={14} /> Product Catalog
                           </h4>
                        </div>
                        <div className="relative mb-6">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                           <input 
                             placeholder="Search items..."
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-mono"
                             value={productSearch}
                             onChange={e => setProductSearch(e.target.value)}
                           />
                        </div>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {filteredProducts.map(p => (
                             <button
                               key={p.id}
                               type="button"
                               onClick={() => setOrderForm({...orderForm, items: [...orderForm.items, { product_id: p.id, quantity: 1, unit_cost: p.price || 0 }]})}
                               className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-gold-brushed/10 rounded-2xl text-left transition-all group border border-transparent hover:border-gold-brushed/20"
                             >
                               <div>
                                  <p className="text-xs text-theme-text font-serif italic group-hover:text-gold-brushed transition-colors">{p.name}</p>
                                  <p className="text-[8px] opacity-40 uppercase font-black tracking-widest mt-1">{p.sku} | {p.category}</p>
                               </div>
                               <Plus size={14} className="text-gold-brushed opacity-0 group-hover:opacity-100 transition-all" />
                             </button>
                           ))}
                        </div>
                        <p className="text-[8px] text-center italic text-theme-text/20">Click catalog items to add to requisition</p>
                     </div>
                   </div>

                   <button 
                     type="submit"
                     disabled={isSubmitting} 
                     className="w-full bg-gold-brushed text-navy-midnight py-6 rounded-2xl font-black uppercase text-xs tracking-[0.5em] shadow-xl shadow-gold-brushed/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                   >
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto text-navy-midnight" /> : 'Authorize Purchase Order'}
                   </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'tracking' && (
              <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {orders.map(order => (
                     <div key={order.po_id} className="glass p-8 rounded-[2.5rem] border-white/5 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 text-6xl italic font-serif text-white/5 pointer-events-none">#{order.po_id}</div>
                        <div className="relative">
                           <div className="flex items-center justify-between mb-6">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                order.status === 'Pending' ? "bg-amber-500/10 text-amber-500" :
                                order.status === 'In-Transit' ? "bg-blue-500/10 text-blue-500" :
                                order.status === 'Received' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                              )}>
                                {order.status}
                              </span>
                              <p className="text-[10px] font-mono gold-text font-black">ETB {(order.total_amount || 0).toLocaleString()}</p>
                           </div>

                           <div className="mb-8">
                              <h4 className="text-xl font-serif italic text-theme-text mb-1">{order.supplier_name}</h4>
                              <p className="text-[9px] opacity-40 uppercase font-black tracking-widest">Ordered: {new Date(order.order_date).toLocaleDateString()}</p>
                           </div>

                           <div className="space-y-4 pt-6 border-t border-white/5">
                              <div className="flex justify-between items-center text-[10px]">
                                 <span className="opacity-40 uppercase font-black">Expected Arrival</span>
                                 <span className="text-theme-text font-bold">{new Date(order.expected_delivery_date).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                 {order.status === 'Pending' && (
                                   <button 
                                     onClick={() => updateOrderStatus(order.id || order.po_id, 'In-Transit')}
                                     className="flex-1 bg-blue-500/10 text-blue-500 py-3 rounded-xl border border-blue-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all font-mono"
                                   >
                                     Mark In-Transit
                                   </button>
                                 )}
                                 {order.status === 'In-Transit' && (
                                   <button 
                                     onClick={() => updateOrderStatus(order.id || order.po_id, 'Received')}
                                     className="flex-1 bg-emerald-500/10 text-emerald-500 py-3 rounded-xl border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all font-mono"
                                   >
                                     Confirm Receipt
                                   </button>
                                 )}
                                 <button className="p-3 bg-white/5 rounded-xl text-theme-text/40 hover:text-white transition-all">
                                    <FileText size={16} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Package, Filter, Download, AlertTriangle, X, Loader2, CheckCircle2, Layers, Clock, TrendingUp, Plus, Search, Calendar, User, History } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

type TabType = 'stock' | 'add' | 'batches' | 'expiry' | 'adjustment' | 'categories';

export default function Inventory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);
  
// Data Fetchers
  const fetchPriceHistory = async (productId: string) => {
    try {
      const data = await api.inventory.priceHistory(productId);
      setPriceHistory(data);
    } catch (err) {
      console.error('Failed to fetch price history:', err);
      setPriceHistory([]);
    }
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const data = await api.inventory.list();
      setItems(data.map((item: any) => ({
        id: item.product_id,
        name: item.product_name,
        generic_name: item.generic_name,
        sku: item.sku,
        category: item.category_name || 'General',
        category_id: item.category_id,
        stock: item.total_stock || 0,
        price: item.selling_price || 0,
        cost_price: item.cost_price || 0,
        reorder_level: item.reorder_level || 10,
        manufacturer: item.manufacturer,
        strength: item.strength,
        dosage_form: item.dosage_form,
        is_controlled: item.is_controlled_substance,
        requires_rx: item.requires_prescription,
        description: item.description
      })));
    } catch (err) {
      console.error('Failed to fetch stock:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.inventory.categories();
      setCategories(data);
    } catch (err) {
      setCategories([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await api.inventory.batches();
      setBatches(data);
    } catch (err) {
      setBatches([]);
    }
  };

  const fetchAdjustments = async () => {
    try {
      const data = await api.inventory.listAdjustments();
      setAdjustments(data);
    } catch (err) {
      setAdjustments([]);
    }
  };

  const fetchExpiring = async () => {
    try {
      const response = await fetch('/api/analytics/expiry-alerts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('aria_token')}` }
      });
      const data = await response.json();
      setExpiring(data);
    } catch (err) {
      setExpiring([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await api.inventory.suppliers();
      setSuppliers(data);
    } catch (err) {
      setSuppliers([]);
    }
  };

  useEffect(() => {
    fetchStock();
    fetchCategories();
    fetchBatches();
    fetchSuppliers();
    fetchAdjustments();
    fetchExpiring();
  }, []);

  // Form States & Handlers
  const [productForm, setProductForm] = useState({
    name: '', 
    sku: '', 
    generic_name: '',
    description: '',
    category_id: '', 
    manufacturer: '',
    strength: '', 
    dosage_form: '', 
    unit_of_measure: 'Box',
    reorder_level: 10,
    is_controlled_substance: false,
    requires_prescription: true,
    image_url: '',
    selling_price: 0,
    cost_price: 0
  });

  const [batchForm, setBatchForm] = useState({
    product_id: '', 
    batch_number: '', 
    expiry_date: '', 
    manufacturing_date: '',
    quantity_on_hand: 0, 
    unit_cost: 0, 
    selling_price: 0,
    supplier_id: ''
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    product_id: '', batch_id: '', quantity_adjusted: 0, adjustment_type: 'Subtract', reason: 'Correction'
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '', description: ''
  });

  const [newPriceForm, setNewPriceForm] = useState({
    batch_id: '', new_price: 0, change_reason: 'Market Adjustment'
  });

  const handlePriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      // Find the product being updated to get current values
      const currentProduct = items.find(i => i.id === selectedProduct.id);
      
      await api.inventory.update(selectedProduct.id, {
        ...currentProduct,
        product_name: currentProduct.name, // matching API naming
        selling_price: newPriceForm.new_price,
        change_reason: newPriceForm.change_reason,
        batch_id: newPriceForm.batch_id
      });
      
      setSuccess(true);
      fetchStock();
      fetchPriceHistory(selectedProduct.id);
      
      setTimeout(() => {
        setSuccess(false);
        setNewPriceForm({ batch_id: '', new_price: 0, change_reason: 'Market Adjustment' });
      }, 2000);
    } catch (err: any) {
      setErrorStatus(err.message || 'Price update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      const payload = {
        product_name: productForm.name,
        sku: productForm.sku,
        generic_name: productForm.generic_name,
        description: productForm.description,
        category_id: productForm.category_id,
        manufacturer: productForm.manufacturer,
        strength: productForm.strength,
        dosage_form: productForm.dosage_form,
        unit_of_measure: productForm.unit_of_measure,
        reorder_level: productForm.reorder_level,
        is_controlled_substance: productForm.is_controlled_substance,
        requires_prescription: productForm.requires_prescription,
        image_url: productForm.image_url,
        selling_price: productForm.selling_price,
        cost_price: productForm.cost_price
      };

      await api.inventory.create(payload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setProductForm({ 
          name: '', sku: '', generic_name: '', description: '', category_id: '', 
          manufacturer: '', strength: '', dosage_form: '', unit_of_measure: 'Box',
          reorder_level: 10, is_controlled_substance: false, requires_prescription: true, image_url: '',
          selling_price: 0, cost_price: 0
        });
        fetchStock();
        setActiveTab('stock');
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Product creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      const payload = {
        product_id: batchForm.product_id,
        batch_number: batchForm.batch_number,
        expiry_date: batchForm.expiry_date,
        manufacturing_date: batchForm.manufacturing_date,
        quantity_on_hand: batchForm.quantity_on_hand,
        unit_cost: batchForm.unit_cost,
        selling_price: batchForm.selling_price,
        supplier_id: batchForm.supplier_id || null
      };

      await api.inventory.createBatch(payload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setBatchForm({ 
          product_id: '', 
          batch_number: '', 
          expiry_date: '', 
          manufacturing_date: '',
          quantity_on_hand: 0, 
          unit_cost: 0, 
          selling_price: 0,
          supplier_id: ''
        });
        fetchBatches();
        fetchStock();
        setActiveTab('batches');
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Batch creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentForm.product_id || !adjustmentForm.batch_id) {
      setErrorStatus("Product and Batch are required.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      await api.inventory.adjustStock(adjustmentForm);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAdjustmentForm({ product_id: '', batch_id: '', quantity_adjusted: 0, adjustment_type: 'Subtract', reason: 'Correction' });
        fetchStock();
        fetchBatches();
        fetchAdjustments();
        setActiveTab('stock');
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      await api.inventory.createCategory(categoryForm);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCategoryForm({ name: '', description: '' });
        fetchCategories();
        setActiveTab('categories');
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Category creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'stock', label: 'View Stock', icon: Package },
    { id: 'add', label: 'Add Medicine', icon: Plus },
    { id: 'batches', label: 'Batches', icon: Layers },
    { id: 'expiry', label: 'Expiry Alerts', icon: Clock },
    { id: 'adjustment', label: 'Adjustment', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: Filter },
  ];

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPriceModal(false)}
              className="absolute inset-0 bg-navy-midnight/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="glass p-10 rounded-[3rem] w-full max-w-4xl relative z-10 border-gold-brushed/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowPriceModal(false)}
                className="absolute top-8 right-8 text-gold-brushed/40 hover:text-gold-brushed transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Registry Audit</p>
                <h3 className="text-3xl text-theme-text italic">Price Evolution: {selectedProduct?.name}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div>
                    <h4 className="font-serif italic text-xl text-theme-text mb-6 flex items-center gap-2">
                       <TrendingUp className="text-gold-brushed" size={20} /> Calibration History
                    </h4>
                    <div className="space-y-4">
                       {priceHistory.length === 0 ? (
                         <p className="text-sm text-theme-text/20 italic p-10 text-center border border-white/5 rounded-3xl">No historical calibrations recorded.</p>
                       ) : priceHistory.map((ph) => (
                         <div key={ph.price_id} className="bg-white/5 p-5 rounded-2xl border border-gold-brushed/5 flex items-center justify-between">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gold-brushed opacity-60">
                                  <Clock size={10} /> {ph.created_at?.toDate ? ph.created_at.toDate().toLocaleString() : new Date(ph.created_at).toLocaleString()}
                               </div>
                               <p className="text-xs text-theme-text mt-1 italic opacity-60">{ph.change_reason || 'Manual Adjustment'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <p className="text-[10px] opacity-40 uppercase font-black">Evolution</p>
                                  <p className="text-sm font-mono text-theme-text line-through opacity-40 uppercase">ETB {ph.old_price}</p>
                                  <p className="text-sm font-mono gold-text font-black">ETB {ph.new_price}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div>
                    <form onSubmit={handlePriceUpdate} className="glass p-8 rounded-[2.5rem] border-gold-brushed/10 space-y-6 bg-gold-brushed/5">
                        <h4 className="font-serif italic text-xl text-theme-text mb-4">Re-Calibrate Value</h4>
                        {success && <div className="bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black tracking-widest p-4 rounded-xl">Value Registry Updated.</div>}
                        
                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Source Batch</label>
                          <select 
                            className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none focus:border-gold-brushed"
                            value={newPriceForm.batch_id}
                            onChange={e => setNewPriceForm({...newPriceForm, batch_id: e.target.value})}
                          >
                            {batches.filter(b => String(b.product_id) === String(selectedProduct?.id)).length > 0 ? (
                              <>
                                <option value="">Base Product & All Batches</option>
                                {batches.filter(b => String(b.product_id) === String(selectedProduct?.id)).map(b => (
                                  <option key={b.batch_id} value={b.batch_id}>
                                    Batch #{b.batch_number} (Price: ETB {b.selling_price})
                                  </option>
                                ))}
                              </>
                            ) : (
                              <option value="">Base Product (No Batches Registered)</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">New Terminal Price (ETB)</label>
                          <input 
                            required
                            type="number"
                            step="0.01"
                            className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none focus:border-gold-brushed shadow-inner"
                            placeholder="0.00"
                            value={newPriceForm.new_price}
                            onChange={e => setNewPriceForm({...newPriceForm, new_price: parseFloat(e.target.value) || 0})}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Reason for Adjustment</label>
                          <input 
                            required
                            type="text"
                            className="w-full bg-navy-midnight border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none focus:border-gold-brushed shadow-inner italic"
                            placeholder="e.g. Supplier Price Increase"
                            value={newPriceForm.change_reason}
                            onChange={e => setNewPriceForm({...newPriceForm, change_reason: e.target.value})}
                          />
                        </div>

                        <button className="w-full bg-gold-brushed text-navy-midnight py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold-brushed/20">
                           Seal Pricing Calibration
                        </button>
                    </form>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Inventory Management</p>
          <h2 className="text-4xl text-theme-text italic">Pharmacy Assets</h2>
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
        <div className="p-8 border-b border-gold-brushed/10 bg-gold-brushed/5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif italic text-2xl text-theme-text">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40 group-focus-within:text-gold-brushed transition-colors" size={16} />
               <input 
                 type="text" 
                 placeholder="Quick filter registry..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl py-3 pl-12 pr-6 text-theme-text outline-none focus:border-gold-brushed/60 transition-all w-64 text-xs"
               />
            </div>
          </div>
        </div>

        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'stock' && (
              <motion.div key="stock" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-gold-brushed font-black opacity-40">
                        <th className="px-6 py-2">Catalog Detail</th>
                        <th className="px-6 py-2">Classification</th>
                        <th className="px-6 py-2">Stock Level</th>
                        <th className="px-6 py-2">Value</th>
                        <th className="px-6 py-2 text-right">Protocol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="group hover:scale-[1.01] transition-transform">
                          <td className="bg-white/5 px-6 py-5 rounded-l-2xl border-l border-t border-b border-gold-brushed/5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-theme-text">{item.name}</span>
                                {item.requires_rx !== false && <span className="text-[7px] bg-gold-brushed/20 text-gold-brushed px-1 rounded border border-gold-brushed/30 font-black uppercase tracking-tighter">Rx</span>}
                                {item.is_controlled && <span className="text-[7px] bg-red-500/20 text-red-500 px-1 rounded border border-red-500/30 font-black uppercase tracking-tighter">C</span>}
                              </div>
                              <span className="text-[9px] opacity-60 italic text-gold-brushed/80">{item.generic_name || 'Specialized Formula'}</span>
                              <span className="text-[9px] opacity-40 uppercase tracking-widest font-mono mt-0.5">SKU: {item.sku}</span>
                            </div>
                          </td>
                          <td className="bg-white/5 px-6 py-5 border-t border-b border-gold-brushed/5">
                            <span className="px-3 py-1 bg-gold-brushed/10 text-gold-brushed text-[9px] font-black uppercase tracking-widest rounded-full">
                              {item.category || 'Unassigned'}
                            </span>
                          </td>
                          <td className="bg-white/5 px-6 py-5 border-t border-b border-gold-brushed/5">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", item.stock <= item.reorder_level ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                              <span className="text-sm font-mono text-theme-text font-bold">{item.stock}</span>
                            </div>
                          </td>
                          <td className="bg-white/5 px-6 py-5 border-t border-b border-gold-brushed/5">
                            <button 
                              onClick={() => {
                                setSelectedProduct(item);
                                setShowPriceModal(true);
                                fetchPriceHistory(item.id);
                              }}
                              className="text-sm gold-text font-bold hover:underline"
                            >
                              ETB {Number(item.price).toLocaleString()}
                            </button>
                          </td>
                          <td className="bg-white/5 px-6 py-5 rounded-r-2xl border-r border-t border-b border-gold-brushed/5 text-right">
                             <button 
                              onClick={() => {
                                setBatchForm(prev => ({ 
                                  ...prev, 
                                  product_id: item.id,
                                  unit_cost: item.cost_price || 0,
                                  selling_price: item.price || 0
                                }));
                                setActiveTab('batches');
                              }}
                               className="p-2 hover:bg-gold-brushed/20 rounded-xl transition-all text-gold-brushed group/btn relative"
                               title="Replenish Protocol"
                             >
                                <Plus size={16} />
                                <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-navy-midnight text-gold-brushed text-[8px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity border border-gold-brushed/20 font-black uppercase tracking-widest">Open Replenish Protocol</span>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'add' && (
              <motion.div key="add" className="max-w-2xl mx-auto" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <form onSubmit={handleAddProduct} className="space-y-8 glass p-10 rounded-[3rem] border-gold-brushed/10">
                  {success && <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl flex items-center gap-3 mb-6 font-black uppercase text-[10px] tracking-widest"><CheckCircle2 size={18} /> Entry successfully committed.</div>}
                  {errorStatus && <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl flex items-center gap-3 mb-6 font-black uppercase text-[10px] tracking-widest"><AlertTriangle size={18} /> {errorStatus}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-full">
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Product Designation</label>
                       <input 
                         required
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner"
                         placeholder="e.g. Lipitor Specialized Lipid Regulator"
                         value={productForm.name}
                         onChange={e => setProductForm({...productForm, name: e.target.value})}
                       />
                    </div>
                    <div className="col-span-full">
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Generic Name / Active Composition</label>
                       <input 
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner"
                         placeholder="e.g. Atorvastatin Calcium"
                         value={productForm.generic_name}
                         onChange={e => setProductForm({...productForm, generic_name: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Identifier Code (SKU)</label>
                       <input 
                         required
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner font-mono"
                         placeholder="RX-LP-20"
                         value={productForm.sku}
                         onChange={e => setProductForm({...productForm, sku: e.target.value})}
                       />
                    </div>
                    <div className="relative group">
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block group-focus-within:opacity-100 transition-opacity">Structural Family</label>
                       <div className="relative">
                        <select 
                          id="category-select"
                          required
                          className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text focus:border-gold-brushed focus:ring-1 focus:ring-gold-brushed/20 outline-none transition-all appearance-none cursor-pointer hover:bg-navy-midnight/70 font-sans shadow-inner"
                          value={productForm.category_id}
                          onChange={e => setProductForm({...productForm, category_id: e.target.value})}
                        >
                          <option value="" className="bg-navy-midnight">Select Classification...</option>
                          {categories.map(c => <option key={c.category_id} value={c.category_id} className="bg-navy-midnight">{c.name}</option>)}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gold-brushed/40 group-focus-within:text-gold-brushed transition-colors">
                          <Filter size={16} />
                        </div>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Manufacturer / Lab</label>
                       <input 
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner"
                         placeholder="e.g. Pfizer Pharmaceuticals"
                         value={productForm.manufacturer}
                         onChange={e => setProductForm({...productForm, manufacturer: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Concentration (Strength)</label>
                       <input 
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner"
                         placeholder="20mg"
                         value={productForm.strength}
                         onChange={e => setProductForm({...productForm, strength: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Delivery Mechanism</label>
                       <input 
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner"
                         placeholder="Oral Tablet"
                         value={productForm.dosage_form}
                         onChange={e => setProductForm({...productForm, dosage_form: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Unit of Measure</label>
                       <select 
                          className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text focus:border-gold-brushed focus:ring-1 focus:ring-gold-brushed/20 outline-none transition-all appearance-none cursor-pointer hover:bg-navy-midnight/70 font-sans shadow-inner"
                          value={productForm.unit_of_measure}
                          onChange={e => setProductForm({...productForm, unit_of_measure: e.target.value})}
                        >
                          <option value="Box" className="bg-navy-midnight">Box</option>
                          <option value="Bottle" className="bg-navy-midnight">Bottle</option>
                          <option value="Strip" className="bg-navy-midnight">Strip</option>
                          <option value="Vial" className="bg-navy-midnight">Vial</option>
                          <option value="Tube" className="bg-navy-midnight">Tube</option>
                        </select>
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Retail Value (Price)</label>
                       <input 
                         required
                         type="number"
                         step="0.01"
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner font-mono"
                         placeholder="0.00"
                         value={productForm.selling_price}
                         onChange={e => setProductForm({...productForm, selling_price: parseFloat(e.target.value) || 0})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Purchase Cost (Optional)</label>
                       <input 
                         type="number"
                         step="0.01"
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all shadow-inner font-mono"
                         placeholder="0.00"
                         value={productForm.cost_price}
                         onChange={e => setProductForm({...productForm, cost_price: parseFloat(e.target.value) || 0})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Reorder Threshold</label>
                       <input 
                         type="number"
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text focus:border-gold-brushed outline-none transition-all shadow-inner font-mono"
                         value={productForm.reorder_level}
                         onChange={e => setProductForm({...productForm, reorder_level: parseInt(e.target.value) || 0})}
                       />
                    </div>
                    <div className="col-span-full">
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Clinical Memo (Description)</label>
                       <textarea 
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text placeholder:text-theme-text/20 focus:border-gold-brushed outline-none transition-all h-32 resize-none shadow-inner"
                         placeholder="Pharmacological notes, contraindications, and storage protocols..."
                         value={productForm.description}
                         onChange={e => setProductForm({...productForm, description: e.target.value})}
                       />
                    </div>
                    <div className="flex flex-wrap items-center gap-12 col-span-full pt-4">
                       <label className="flex items-center gap-4 cursor-pointer group">
                          <div className="relative">
                             <input 
                                type="checkbox"
                                className="sr-only"
                                checked={productForm.requires_prescription}
                                onChange={e => setProductForm({...productForm, requires_prescription: e.target.checked})}
                             />
                             <div className={cn("w-12 h-6 rounded-full transition-all border shadow-inner", productForm.requires_prescription ? "bg-gold-brushed border-gold-brushed" : "bg-white/5 border-white/10")} />
                             <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all shadow-md", productForm.requires_prescription ? "translate-x-6" : "translate-x-0")} />
                          </div>
                          <span className="text-[10px] uppercase tracking-widest font-black text-theme-text opacity-60 group-hover:opacity-100 italic transition-opacity">Protocol: Rx Required</span>
                       </label>

                       <label className="flex items-center gap-4 cursor-pointer group">
                          <div className="relative">
                             <input 
                                type="checkbox"
                                className="sr-only"
                                checked={productForm.is_controlled_substance}
                                onChange={e => setProductForm({...productForm, is_controlled_substance: e.target.checked})}
                             />
                             <div className={cn("w-12 h-6 rounded-full transition-all border shadow-inner", productForm.is_controlled_substance ? "bg-red-500 border-red-500" : "bg-white/5 border-white/10")} />
                             <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all shadow-md", productForm.is_controlled_substance ? "translate-x-6" : "translate-x-0")} />
                          </div>
                          <span className={cn("text-[10px] uppercase tracking-widest font-black transition-opacity italic", productForm.is_controlled_substance ? "text-red-500 opacity-100" : "text-theme-text opacity-60 group-hover:opacity-100")}>Controlled Substance</span>
                       </label>
                    </div>
                  </div>
                  <button 
                    id="commit-medicine-btn"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-gold-brushed via-amber-200 to-gold-brushed bg-[length:200%_100%] animate-shimmer text-navy-midnight p-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(234,179,8,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Committing to Registry...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-6 group-hover:ml-0" />
                          <span>Commit New Asset</span>
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'batches' && (
              <motion.div key="batches" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-6">
                      {batches.map(b => (
                        <div key={b.batch_id} className="glass border-gold-brushed/5 p-6 rounded-3xl flex items-center justify-between group hover:border-gold-brushed/30 transition-all">
                           <div className="flex gap-6 items-center">
                              <div className="p-4 bg-gold-brushed/10 rounded-2xl text-gold-brushed">
                                 <Layers size={24} />
                              </div>
                              <div>
                                 <p className="text-sm font-semibold text-theme-text">{b.product_name}</p>
                                 <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <span className="text-[10px] bg-white/5 py-0.5 px-2 rounded-full text-gold-brushed font-black uppercase tracking-widest">#{b.batch_number}</span>
                                    <span className="text-[10px] text-theme-text/40 flex items-center gap-1 uppercase tracking-widest font-bold">
                                       <Calendar size={10} /> Exp: {new Date(b.expiry_date).toLocaleDateString()}
                                    </span>
                                    {b.manufacturing_date && (
                                       <span className="text-[10px] text-theme-text/20 flex items-center gap-1 uppercase tracking-widest font-bold border-l border-white/10 pl-3">
                                          Mfg: {new Date(b.manufacturing_date).toLocaleDateString()}
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-4 mt-2">
                                    <div className="flex flex-col">
                                       <span className="text-[8px] opacity-40 uppercase font-black">Unit Cost</span>
                                       <span className="text-xs font-mono text-theme-text/60 italic">ETB {b.unit_cost || 0}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-white/5 pl-4">
                                       <span className="text-[8px] opacity-40 uppercase font-black">Retail</span>
                                       <span className="text-xs font-mono gold-text font-black">ETB {b.selling_price || 0}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xl font-mono gold-text font-black">{b.quantity_on_hand}</p>
                              <p className="text-[9px] uppercase tracking-widest text-theme-text/40 font-bold">Units Available</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   <div>
                      <form onSubmit={handleAddBatch} className="glass p-8 rounded-3xl border-gold-brushed/10 sticky top-10 space-y-6">
                        <h4 className="font-serif italic text-xl text-theme-text mb-4">Initialize Batch</h4>
                        {success && <div className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-4 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex items-center gap-2"><CheckCircle2 size={14} /> Batch Logged.</div>}
                        {errorStatus && <div className="text-red-500 text-[10px] uppercase font-black tracking-widest mb-4 bg-red-500/5 p-3 rounded-xl border border-red-500/10 flex items-center gap-2"><AlertTriangle size={14} /> {errorStatus}</div>}
                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Link Product</label>
                          <select 
                            required
                            className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                            value={batchForm.product_id}
                            onChange={e => {
                              const prodId = e.target.value;
                              const selectedProd = items.find(p => String(p.id) === String(prodId));
                              setBatchForm(prev => ({
                                ...prev,
                                product_id: prodId,
                                unit_cost: selectedProd ? selectedProd.cost_price : 0,
                                selling_price: selectedProd ? selectedProd.price : 0
                              }));
                            }}
                          >
                            <option value="">Select Asset</option>
                            {items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Batch Serial</label>
                          <input 
                            required
                            className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                            placeholder="LOT-X99"
                            value={batchForm.batch_number}
                            onChange={e => setBatchForm({...batchForm, batch_number: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Expiration Datum</label>
                              <input 
                                required
                                type="date"
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                                value={batchForm.expiry_date}
                                onChange={e => setBatchForm({...batchForm, expiry_date: e.target.value})}
                              />
                           </div>
                           <div>
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Manufacturing Date</label>
                              <input 
                                type="date"
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                                value={batchForm.manufacturing_date}
                                onChange={e => setBatchForm({...batchForm, manufacturing_date: e.target.value})}
                              />
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Quantity</label>
                              <input 
                                required
                                type="number"
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                                value={batchForm.quantity_on_hand}
                                onChange={e => setBatchForm({...batchForm, quantity_on_hand: parseInt(e.target.value) || 0})}
                              />
                           </div>
                           <div>
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Supplier</label>
                              <select 
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none transition-all cursor-pointer"
                                value={batchForm.supplier_id}
                                onChange={e => setBatchForm({...batchForm, supplier_id: e.target.value})}
                              >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                  <option key={s.supplier_id || s.id} value={s.supplier_id || s.id}>
                                    {s.name || s.supplier_name}
                                  </option>
                                ))}
                              </select>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Unit Cost (ETB)</label>
                              <input 
                                required
                                type="number"
                                step="any"
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                                value={batchForm.unit_cost}
                                onChange={e => setBatchForm({...batchForm, unit_cost: parseFloat(e.target.value) || 0})}
                              />
                           </div>
                           <div>
                              <label className="text-[9px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-2 block">Retail Price (ETB)</label>
                              <input 
                                required
                                type="number"
                                step="any"
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-4 text-xs text-theme-text outline-none"
                                value={batchForm.selling_price}
                                onChange={e => setBatchForm({...batchForm, selling_price: parseFloat(e.target.value) || 0})}
                              />
                           </div>
                        </div>
                        <button className="w-full bg-gold-brushed text-navy-midnight py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all">
                          Seal Batch Entry
                        </button>
                      </form>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'expiry' && (
              <motion.div key="expiry" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {expiring.length === 0 ? (
                      <div className="col-span-full p-20 text-center glass border-emerald-500/10 rounded-[3rem]">
                         <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-6 opacity-40" />
                         <p className="font-serif italic text-2xl text-theme-text opacity-40">All inventories current. No expiration risks detected.</p>
                      </div>
                    ) : expiring.map((e) => (
                      <div key={e.batch_id} className="glass p-8 rounded-[2.5rem] border-red-500/10 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] italic font-serif text-6xl text-red-500">Expiring</div>
                        <div className="flex flex-col h-full gap-6 relative">
                           <div className="flex items-center justify-between">
                              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                                 <AlertTriangle size={20} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                                 T-Minus {e.days_until_expiry} Days
                              </span>
                           </div>
                           <div>
                              <h4 className="text-lg font-serif italic text-theme-text mb-1">{e.product_name}</h4>
                              <p className="text-[10px] opacity-40 uppercase tracking-widest font-black">Batch Identification: #{e.batch_number}</p>
                           </div>
                           <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-mono gold-text font-bold">{e.quantity_on_hand} Units</p>
                                 <p className="text-[9px] opacity-40 uppercase font-black">At Risk</p>
                              </div>
                              <button className="text-[9px] uppercase tracking-widest font-black text-gold-brushed hover:underline">Liquidate Entry</button>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'adjustment' && (
              <motion.div key="adjustment" className="max-w-4xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <form onSubmit={handleAdjustment} className="glass p-10 rounded-[3rem] border-gold-brushed/10 space-y-6">
                        <h4 className="font-serif italic text-2xl text-theme-text mb-6">Physical Verification</h4>
                        {success && <div className="text-emerald-500 text-[10px] uppercase font-black tracking-widest p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 mb-6 flex items-center gap-3"><CheckCircle2 size={18} /> Registry Calibrated.</div>}
                        {errorStatus && <div className="text-red-500 text-[10px] uppercase font-black tracking-widest p-4 bg-red-500/5 rounded-2xl border border-red-500/10 mb-6 flex items-center gap-3"><AlertTriangle size={18} /> {errorStatus}</div>}
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Subject Product</label>
                          <select 
                            required
                            className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed appearance-none"
                            value={adjustmentForm.product_id}
                            onChange={e => setAdjustmentForm({...adjustmentForm, product_id: e.target.value})}
                          >
                            <option value="">Select Asset</option>
                            {items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Target Batch</label>
                          <select 
                            required
                            className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed appearance-none"
                            value={adjustmentForm.batch_id}
                            onChange={e => setAdjustmentForm({...adjustmentForm, batch_id: e.target.value})}
                          >
                            <option value="">Select Batch</option>
                            {batches.filter(b => b.product_id == adjustmentForm.product_id || true).map(b => (
                              <option key={b.batch_id} value={b.batch_id}>{b.product_name} - #{b.batch_number}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Type</label>
                              <select 
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed appearance-none"
                                value={adjustmentForm.adjustment_type}
                                onChange={e => setAdjustmentForm({...adjustmentForm, adjustment_type: e.target.value as any})}
                              >
                                <option value="Add">Add (+) </option>
                                <option value="Subtract">Subtract (-)</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Units</label>
                              <input 
                                required
                                type="number"
                                className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed"
                                value={adjustmentForm.quantity_adjusted}
                                onChange={e => setAdjustmentForm({...adjustmentForm, quantity_adjusted: parseInt(e.target.value) || 0})}
                              />
                           </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Justification</label>
                          <select 
                            className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed appearance-none"
                            value={adjustmentForm.reason}
                            onChange={e => setAdjustmentForm({...adjustmentForm, reason: e.target.value as any})}
                          >
                            <option value="Correction">Manual Correction</option>
                            <option value="Damage">Damage</option>
                            <option value="Loss">Loss / Theft</option>
                            <option value="Expiry">Expiry Liquidation</option>
                          </select>
                        </div>
                        <button className="w-full bg-gold-brushed text-navy-midnight py-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] mt-4 hover:scale-[1.02] shadow-xl shadow-gold-brushed/20">
                           Calibrate Registry
                        </button>
                     </form>

                     <div className="space-y-6">
                        <h4 className="font-serif italic text-2xl text-theme-text flex items-center gap-2 mb-6">
                           <History className="text-gold-brushed" size={24} /> Audit Trail
                        </h4>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {adjustments.map((a) => (
                             <div key={a.adjustment_id} className="glass border-gold-brushed/5 p-5 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                   <p className="text-xs font-bold text-theme-text">{a.product_name}</p>
                                   <span className={cn(
                                     "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                     a.adjustment_type === 'Add' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                   )}>
                                     {a.adjustment_type === 'Add' ? '+' : '-'}{a.quantity_adjusted} Units
                                   </span>
                                </div>
                                <div className="flex items-center justify-between opacity-40">
                                   <div className="flex items-center gap-2">
                                      <User size={10} />
                                      <span className="text-[9px] uppercase tracking-widest font-bold">{a.first_name || 'System'}</span>
                                   </div>
                                   <span className="text-[9px] uppercase tracking-widest font-bold">{new Date(a.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="mt- focus:bg-gold-brushed/50 transition-all text-[8px] uppercase tracking-[0.2em] font-black text-gold-brushed mt-3 opacity-60">Reason: {a.reason}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div key="categories" className="max-w-xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <form onSubmit={handleAddCategory} className="glass p-10 rounded-[3rem] border-gold-brushed/10 space-y-6 mb-12">
                    <h4 className="font-serif italic text-2xl text-theme-text mb-6">Define Classification</h4>
                    {success && <div className="text-emerald-500 text-[10px] uppercase font-black tracking-widest bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 flex items-center gap-3"><CheckCircle2 size={18} /> Classified.</div>}
                    {errorStatus && <div className="text-red-500 text-[10px] uppercase font-black tracking-widest bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex items-center gap-3"><AlertTriangle size={18} /> {errorStatus}</div>}
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Family Name</label>
                       <input 
                         required
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed"
                         placeholder="e.g. Critical Care"
                         value={categoryForm.name}
                         onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase tracking-widest text-gold-brushed opacity-60 font-black mb-3 block">Structural Memo</label>
                       <textarea 
                         className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-2xl p-5 text-theme-text outline-none focus:border-gold-brushed h-32 resize-none"
                         placeholder="Description of usage and special handling..."
                         value={categoryForm.description}
                         onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                       />
                    </div>
                    <button className="w-full bg-gold-brushed text-navy-midnight py-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] hover:scale-[1.02] shadow-xl shadow-gold-brushed/20">
                       Commit Structural Change
                    </button>
                 </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(c => (
                      <div key={c.category_id} className="glass border-gold-brushed/5 p-6 rounded-2xl relative group overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                            <h5 className="font-serif italic text-lg text-theme-text">{c.name}</h5>
                            <span className={cn(
                               "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                               c.is_active !== false ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                               {c.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                         </div>
                         <p className="text-xs text-theme-text/40">{c.description || 'No detailed memo provided.'}</p>
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

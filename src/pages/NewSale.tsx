/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Search, Trash2, CheckCircle2, CreditCard, ShieldCheck, User, Loader2, RotateCw, AlertCircle, Smartphone, Wallet } from 'lucide-react';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string; // Changed from number to string for Firestore ID
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
}

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

export default function NewSale() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number; batchId: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'telebirr' | 'cbe_birr' | 'Insurance' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    // General parameters
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    amount: '',

    // Card specifics
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardNetwork: 'Visa',

    // telebirr specifics
    telebirrPhone: '',
    telebirrPin: '',

    // CBE Birr specifics
    cbePhone: '',
    cbeWallet: '',
    cbePin: '',

    // Insurance fields
    insuranceCompany: '',
    insurancePolicyId: '',
    insuranceMemberName: '',
    insuranceExpiry: '',
    insuranceCardPhoto: '',
    insuranceAuthCode: '',
    insuranceContact: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Auto-propagate chosen patient data into client payment profiles
  useEffect(() => {
    if (selectedPatientId) {
      const patient = patients.find(p => p.patient_id === selectedPatientId);
      if (patient) {
        const fName = `${patient.first_name} ${patient.last_name}`;
        const hasInsurance = !!patient.insurance_provider && patient.insurance_provider.trim() !== '';
        setPaymentMethod(hasInsurance ? 'Insurance' : 'telebirr');
        setPaymentDetails(prev => ({
          ...prev,
          fullName: fName,
          emailAddress: patient.email || '',
          phoneNumber: patient.phone || '',
          amount: total > 0 ? total.toFixed(2) : '',
          telebirrPhone: patient.phone || '',
          cbePhone: patient.phone || '',
          insuranceMemberName: fName,
          insuranceContact: patient.phone || '',
          insuranceCompany: patient.insurance_provider || '',
          insurancePolicyId: patient.insurance_policy_number || '',
          insuranceExpiry: '',
          insuranceCardPhoto: '',
          insuranceAuthCode: 'AUTH-' + Math.floor(Math.floor(100000 + Math.random() * 900000))
        }));
      }
    } else {
      setPaymentMethod(null);
      setPaymentDetails({
        fullName: '',
        emailAddress: '',
        phoneNumber: '',
        amount: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        cardNetwork: 'Visa',
        telebirrPhone: '',
        telebirrPin: '',
        cbePhone: '',
        cbeWallet: '',
        cbePin: '',
        insuranceCompany: '',
        insurancePolicyId: '',
        insuranceMemberName: '',
        insuranceExpiry: '',
        insuranceCardPhoto: '',
        insuranceAuthCode: '',
        insuranceContact: ''
      });
    }
  }, [selectedPatientId, patients]);

  const resetCart = () => {
    setCart([]);
    setPaymentMethod(null);
    setSelectedPatientId(null);
    setSearchTerm('');
    setPaymentDetails({
      fullName: '',
      emailAddress: '',
      phoneNumber: '',
      amount: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardNetwork: 'Visa',
      telebirrPhone: '',
      telebirrPin: '',
      cbePhone: '',
      cbeWallet: '',
      cbePin: '',
      insuranceCompany: '',
      insurancePolicyId: '',
      insuranceMemberName: '',
      insuranceExpiry: '',
      insuranceCardPhoto: '',
      insuranceAuthCode: '',
      insuranceContact: ''
    });
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };
  const [isInstantMode, setIsInstantMode] = useState(true);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const data = await api.inventory.list();
      const mapped = data.map((p: any) => ({
        id: String(p.product_id),
        name: p.product_name,
        sku: p.sku,
        category: p.category_name || 'General',
        stock: p.total_stock || 0,
        price: p.selling_price || 0
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    const focusInput = () => {
      if (isInstantMode && !showSuccess && !isSubmitting) {
        scanInputRef.current?.focus();
      }
    };

    focusInput();
    // Re-focus periodically if focus is lost
    const interval = setInterval(focusInput, 2000);
    return () => clearInterval(interval);
  }, [isInstantMode, showSuccess, isSubmitting]);

  // Auto-scan logic: If searchTerm matches a SKU exactly, add to cart automatically
  useEffect(() => {
    const sku = searchTerm.trim();
    if (sku.length >= 4 && isInstantMode) {
      const product = products.find(p => 
        p.sku === sku || 
        p.sku?.replace(/^0+/, '') === sku.replace(/^0+/, '')
      );
      if (product) {
        addToCart(product).then(() => {
          setSearchTerm('');
        });
      }
    }
  }, [searchTerm, products, isInstantMode]);

  const handleQuickScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const sku = searchTerm.trim();
      // Search for SKU match, ID match, or SKU match without leading zeros
      const product = products.find(p => 
        p.sku === sku || 
        p.id === sku || 
        p.sku?.replace(/^0+/, '') === sku.replace(/^0+/, '')
      );
      
      if (product) {
        setSearchTerm('');
        await addToCart(product);
      } else {
        // High visibility error for scanner
        triggerError(`Product with SKU/ID "${sku}" not found in registry.`);
        setSearchTerm('');
      }
    }
  };

  const seedSampleData = async () => {
    alert("Please use the inventory management screen to add products to the MySQL database.");
  };

  useEffect(() => {
    fetchProducts();

    const fetchPatients = async () => {
      try {
        const data = await api.patients.list();
        setPatients(data);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      }
    };
    fetchPatients();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm || searchTerm.length === 0) return products.slice(0, 10); // Show top 10 products by default
    
    return products.filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const addToCart = async (product: Product, providedBatchId?: string) => {
    try {
      let bestBatch;
      
      if (providedBatchId) {
        bestBatch = { batch_id: providedBatchId };
      } else {
        try {
          // Find First Expiry First Out (FEFO) batch from API
          const batches = await api.inventory.batches();
          const productBatches = batches
            .filter((b: any) => String(b.product_id) === product.id && (b.quantity_on_hand || 0) > 0)
            .sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
          
          bestBatch = productBatches[0] || { batch_id: 'SYSTEM_GENERIC' };
        } catch (err) {
          console.warn('Batch fetch bypassed. Using system default.');
          bestBatch = { batch_id: 'SYSTEM_GENERIC' };
        }
      }

      setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id && item.batchId === String(bestBatch.batch_id));
        if (existing) {
          return prev.map(item => 
            item.product.id === product.id && item.batchId === String(bestBatch.batch_id)
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
        return [...prev, { product, quantity: 1, batchId: String(bestBatch.batch_id) }];
      });
      setSearchTerm('');
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0);
  const tax = subtotal * 0.05; 
  const total = subtotal + tax;

  // Set Default Amount based on total
  useEffect(() => {
    setPaymentDetails(prev => ({
      ...prev,
      amount: total > 0 ? total.toFixed(2) : ''
    }));
  }, [total]);

  const getMissingPaymentFields = () => {
    const missing: string[] = [];
    if (!selectedPatientId) {
      missing.push('Select Registered Patient Profile');
    }
    if (!paymentMethod) {
      missing.push('Payment Method');
      return missing;
    }

    // General validations
    if (!paymentDetails.fullName.trim()) missing.push('Client\'s Full Name');
    
    if (paymentDetails.emailAddress.trim()) {
      const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/.test(paymentDetails.emailAddress.trim());
      if (!isEmailValid) {
        missing.push('Valid Email Address');
      }
    }

    if (!paymentDetails.phoneNumber.trim()) {
      missing.push('Phone Number');
    } else {
      const cleanPhone = paymentDetails.phoneNumber.replace(/[\s\-\(\)]/g, '');
      const isPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanPhone);
      if (!isPhoneValid) {
        missing.push('Valid Ethiopian Contact Phone Number (e.g. 09xxxxxxxx or +251 9xxxxxxxx)');
      }
    }

    const payAmt = parseFloat(paymentDetails.amount);
    if (!paymentDetails.amount.trim() || isNaN(payAmt) || payAmt < total) {
      missing.push('Amount to Pay (must be >= total)');
    }

    // Method-specific validators
    if (paymentMethod === 'Card') {
      const ccNum = paymentDetails.cardNumber.replace(/\s+/g, '');
      if (!paymentDetails.cardNumber.trim() || ccNum.length < 13) {
        missing.push('Valid 13-19 digit Card Number');
      } else {
        if (paymentDetails.cardNetwork === 'Visa') {
          if (!ccNum.startsWith('4')) {
            missing.push('Card Number conflict: Visa card numbers must start with 4. Please adjust the selected Card Network or card number.');
          }
        } else if (paymentDetails.cardNetwork === 'Mastercard') {
          const prefixMatch = /^5[1-5]|^222[1-9]|^22[3-9]|^2[3-6]|^27[0-1]|^2720/.test(ccNum);
          if (!prefixMatch) {
            missing.push('Card Number conflict: Mastercard numbers must start with 51-55 or 2221-2720. Please adjust the selected Card Network or card number.');
          }
        }
      }
      if (!paymentDetails.cardExpiry.trim()) {
        missing.push('Card Expiry (MM/YY)');
      }
      if (!paymentDetails.cardCvv.trim() || paymentDetails.cardCvv.length < 3) {
        missing.push('CVV/CVC Code');
      }
    } else if (paymentMethod === 'telebirr') {
      if (!paymentDetails.telebirrPhone.trim()) {
        missing.push('telebirr Phone Number');
      } else {
        const cleanTPhone = paymentDetails.telebirrPhone.replace(/[\s\-\(\)]/g, '');
        const isTPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanTPhone);
        if (!isTPhoneValid) {
          missing.push('Valid telebirr Phone Number');
        }
      }
      if (!paymentDetails.telebirrPin.trim()) {
        missing.push('telebirr OTP / PIN confirmation');
      }
    } else if (paymentMethod === 'cbe_birr') {
      if (!paymentDetails.cbePhone.trim()) {
        missing.push('CBE Birr Phone Number');
      } else {
        const cleanCPhone = paymentDetails.cbePhone.replace(/[\s\-\(\)]/g, '');
        const isCPhoneValid = /^(?:\+251|251|0)(?:[79]\d{8}|11\d{7})$/.test(cleanCPhone);
        if (!isCPhoneValid) {
          missing.push('Valid CBE Birr Registered Phone Number');
        }
      }
      if (!paymentDetails.cbeWallet.trim()) {
        missing.push('CBE Birr Account or Wallet Details');
      }
      if (!paymentDetails.cbePin.trim()) {
        missing.push('CBE Birr OTP or PIN confirmation');
      }
    } else if (paymentMethod === 'Insurance') {
      if (!paymentDetails.insuranceCompany.trim()) {
        missing.push('Insurance Company Name');
      }
      if (!paymentDetails.insurancePolicyId.trim()) {
        missing.push('Insurance Policy ID / Number');
      }
      if (!paymentDetails.insuranceMemberName.trim()) {
        missing.push('Insurance Member / Cardholder Name');
      }
      if (!paymentDetails.insuranceAuthCode.trim()) {
        missing.push('Insurance Claim Approval Auth code');
      }
    }
    return missing;
  };

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    
    const missing = getMissingPaymentFields();
    if (missing.length > 0) {
      triggerError(`Required details missing: ${missing.join(', ')}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const dbPaymentType = paymentMethod === 'Card' ? 'Credit Card' : (paymentMethod === 'Insurance' ? 'Insurance' : 'Other');
      const cardNumberClean = paymentDetails.cardNumber.replace(/\s+/g, '');

      const mappedDetails = {
        ...paymentDetails,
        ethiopianMethod: paymentMethod,
        cardLastFour: paymentMethod === 'Card' ? cardNumberClean.slice(-4) : '0000',
        cardAuthCode: paymentMethod === 'Card' ? 'AUTH-DIGITAL' : 'N/A',
        insuranceProvider: paymentMethod === 'Insurance' ? paymentDetails.insuranceCompany : 'N/A',
        policyNumber: paymentMethod === 'Insurance' ? paymentDetails.insurancePolicyId : 'N/A',
        cashTendered: paymentDetails.amount || String(total)
      };

      const payload = {
        patient_id: selectedPatientId || 'WALK_IN',
        total_amount: subtotal,
        tax_amount: tax,
        discount_amount: 0,
        final_amount: total,
        payment_type: dbPaymentType,
        payment_details: mappedDetails,
        items: cart.map(item => ({
          product_id: parseInt(item.product.id),
          quantity: item.quantity,
          unit_price: item.product.price,
          batch_id: item.batchId === 'SYSTEM_GENERIC' ? null : parseInt(item.batchId)
        }))
      };

      await api.transactions.create(payload);

      setShowSuccess(true);
      fetchProducts(); // Refresh stock immediately

      setTimeout(() => {
        setShowSuccess(false);
        resetCart();
      }, 5000);
    } catch (error: any) {
      console.error("Sale failed:", error);
      triggerError(error.message || "Transaction failed during registry sync.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-10 z-[110] glass-gold border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4 bg-emerald-500/5 backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-serif italic text-theme-text">Transaction Finalized</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] uppercase tracking-widest opacity-40 text-theme-text">Inventory reconciled successfully</p>
                <a 
                  href="/dashboard/transactions" 
                  className="text-[10px] uppercase tracking-widest text-gold-brushed font-black hover:underline underline-offset-4"
                >
                  View Ledger
                </a>
              </div>
            </div>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-10 z-[110] glass border-red-500/30 p-6 rounded-2xl flex items-center gap-4 bg-red-500/5 backdrop-blur-xl shadow-2xl shadow-red-500/10"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-serif italic text-theme-text">Operational Fault</p>
              <p className="text-[10px] uppercase tracking-widest opacity-40 text-theme-text">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-xs mb-2">Checkout Terminal</p>
          <h2 className="text-4xl text-theme-text italic leading-tight">Enact New Sale</h2>
        </div>
        <button 
          onClick={handleFinalize}
          disabled={cart.length === 0 || isSubmitting}
          className={cn(
            "px-8 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-gold-brushed/10",
            cart.length > 0 && !isSubmitting
              ? "bg-gold-brushed text-navy-midnight hover:scale-105 active:scale-95" 
              : "bg-theme-text/5 text-theme-text/20 cursor-not-allowed"
          )}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {isSubmitting ? 'Processing...' : 'Finalize Transaction'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Patient Selection */}
            <div className="glass p-4 rounded-2xl flex items-center gap-4 border-gold-brushed/20 transition-colors">
              <User className="text-gold-brushed/40" size={20} />
              <select 
                className="bg-transparent border-none outline-none flex-1 text-sm text-theme-text font-light"
                value={selectedPatientId || ''}
                onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="" disabled className="bg-theme-bg text-theme-text/40">Select Patient Profile *</option>
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id} className="bg-theme-bg">
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Search */}
            <div className="relative group">
              <motion.div 
                animate={isInstantMode ? {
                  boxShadow: [
                    "0 0 0px 0px rgba(16,185,129,0)",
                    "0 0 15px 2px rgba(16,185,129,0.2)",
                    "0 0 0px 0px rgba(16,185,129,0)"
                  ]
                } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "glass p-4 rounded-2xl flex items-center gap-4 border transition-all",
                  isInstantMode ? "border-emerald-500/40" : "border-gold-brushed/20 focus-within:border-gold-brushed/50"
                )}
              >
                <Search className={isInstantMode ? "text-emerald-500" : "text-gold-brushed/40"} size={20} />
                <input 
                  ref={scanInputRef}
                  type="text" 
                  placeholder={isInstantMode ? "System active. Scan bottle..." : "Search pharmacopoeia..."}
                  className="bg-transparent border-none outline-none flex-1 text-sm text-theme-text placeholder:text-theme-text/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleQuickScan}
                />
                <button 
                  onClick={() => setIsInstantMode(!isInstantMode)}
                  className={cn(
                    "text-[8px] uppercase tracking-tighter font-bold px-3 py-1 rounded-full border transition-all",
                    isInstantMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-gold-brushed/10 border-gold-brushed/20 text-gold-brushed"
                  )}
                >
                  {isInstantMode ? "Instant" : "Manual"}
                </button>
              </motion.div>
              
              <AnimatePresence>
                {filteredProducts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-2 glass-gold rounded-2xl p-2 z-50 border-gold-brushed/10 max-h-[300px] overflow-y-auto shadow-2xl"
                  >
                    {filteredProducts.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gold-brushed/5 rounded-xl transition-all group"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-theme-text group-hover:text-gold-brushed transition-colors">{product.name}</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-40 text-theme-text">{product.sku} — {product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm gold-text">ETB {Number(product.price).toFixed(2)}</p>
                          <p className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold">{product.stock} in stock</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass p-8 rounded-[2rem] min-h-[500px] flex flex-col border-gold-brushed/10">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-theme-text/20 border-2 border-dashed border-gold-brushed/5 rounded-3xl p-12">
                <motion.div
                  animate={{ 
                    scale: isInstantMode ? [1, 1.05, 1] : 1,
                    opacity: isInstantMode ? [0.2, 0.4, 0.2] : 0.2 
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <ShoppingCart size={64} className="mb-6" />
                </motion.div>
                <h3 className="font-serif italic text-2xl text-theme-text/40 mb-3">Terminal Ready</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed mb-6">Waiting for input...</p>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="glass p-6 rounded-2xl text-center border-gold-brushed/5">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 mb-2">Scan Barcode</p>
                    <p className="text-xs text-theme-text/60">Position the scanner over the product code for instant detection.</p>
                  </div>
                  <div className="glass p-6 rounded-2xl text-center border-gold-brushed/5">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 mb-2">Manual Entry</p>
                    <p className="text-xs text-theme-text/60">Type the product name or SKU into the search field above.</p>
                  </div>
                </div>

                {products.length === 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={seedSampleData}
                    disabled={isSubmitting}
                    className="mt-8 px-6 py-3 rounded-xl border border-gold-brushed/20 text-gold-brushed text-[10px] uppercase tracking-widest hover:bg-gold-brushed/5 disabled:opacity-50"
                  >
                    {isSubmitting ? "Initializing Registry..." : "Seed Sample Inventory"}
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 pb-4 border-b border-gold-brushed/5 text-[10px] uppercase tracking-widest opacity-40 font-bold">
                  <span>Dispense Item</span>
                  <div className="flex gap-16">
                    <span>Qty</span>
                    <span className="w-20 text-right">Ext. Price</span>
                  </div>
                </div>
                {cart.map((item) => (
                  <motion.div 
                    layout
                    key={`${item.product.id}-${item.batchId}`}
                    className="flex items-center justify-between p-4 group hover:bg-gold-brushed/5 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="text-left">
                        <p className="text-sm font-medium text-theme-text">{item.product.name}</p>
                        <p className="text-[10px] opacity-40 text-theme-text">ETB {Number(item.product.price).toFixed(2)} / unit — Batch #{item.batchId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-16">
                      <span className="font-mono text-sm text-theme-text font-bold">{item.quantity}</span>
                      <p className="w-20 text-right font-mono text-sm gold-text font-bold">
                        ETB {(Number(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] space-y-8 border-gold-brushed/5 sticky top-24">
            <h3 className="font-serif italic text-2xl text-theme-text border-b border-gold-brushed/10 pb-4">Consolidated Summary</h3>
            
            <div className="space-y-5">
              <div className="flex justify-between text-xs text-theme-text/40 font-bold uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="font-mono text-theme-text/80">ETB {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-theme-text/40 font-bold uppercase tracking-widest">
                <span>Luxury Surcharge (5%)</span>
                <span className="font-mono text-theme-text/80">ETB {tax.toFixed(2)}</span>
              </div>
              <div className="pt-6 border-t border-gold-brushed/10 flex justify-between text-2xl font-serif italic text-theme-text">
                <span>Grand Total</span>
                <span className gold-text>ETB {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gold-brushed/10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-brushed font-black opacity-60 font-mono">Customer & Payment Details</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Full Name</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="customer_full_name"
                    id="customer_full_name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors"
                    placeholder="e.g. Abiye Tesfaye"
                    value={paymentDetails.fullName}
                    onChange={(e) => setPaymentDetails({...paymentDetails, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Email Address</label>
                  <input
                    type="email"
                    autoComplete="off"
                    name="customer_email"
                    id="customer_email"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors"
                    placeholder="abiye@example.com"
                    value={paymentDetails.emailAddress}
                    onChange={(e) => setPaymentDetails({...paymentDetails, emailAddress: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Phone Number</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="customer_phone"
                    id="customer_phone"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors"
                    placeholder="e.g. 0912345678"
                    value={paymentDetails.phoneNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, phoneNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Amount (ETB)</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="transaction_amount"
                    id="transaction_amount"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text font-mono outline-none focus:border-gold-brushed/40 transition-colors"
                    placeholder={`${total.toFixed(2)}`}
                    value={paymentDetails.amount}
                    onChange={(e) => setPaymentDetails({...paymentDetails, amount: e.target.value})}
                  />
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-brushed font-black opacity-60 font-mono pt-2">Payment Method Selection</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all glass border border-gold-brushed/10 min-h-[72px] text-center",
                    paymentMethod === 'Card' ? "border-gold-brushed bg-gold-brushed/10 text-gold-brushed shadow-md" : "text-theme-text/40 hover:bg-gold-brushed/5"
                  )}
                >
                  <CreditCard size={16} className={paymentMethod === 'Card' ? "text-gold-brushed" : "opacity-20"} />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telebirr')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all glass border border-gold-brushed/10 min-h-[72px] text-center",
                    paymentMethod === 'telebirr' ? "border-gold-brushed bg-gold-brushed/10 text-gold-brushed shadow-md" : "text-theme-text/40 hover:bg-gold-brushed/5"
                  )}
                >
                  <Smartphone size={16} className={paymentMethod === 'telebirr' ? "text-gold-brushed" : "opacity-20"} />
                  telebirr (Chapa)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cbe_birr')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all glass border border-gold-brushed/10 min-h-[72px] text-center",
                    paymentMethod === 'cbe_birr' ? "border-gold-brushed bg-gold-brushed/10 text-gold-brushed shadow-md" : "text-theme-text/40 hover:bg-gold-brushed/5"
                  )}
                >
                  <Wallet size={16} className={paymentMethod === 'cbe_birr' ? "text-gold-brushed" : "opacity-20"} />
                  CBE Birr
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Insurance')}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all glass border border-gold-brushed/10 min-h-[72px] text-center",
                    paymentMethod === 'Insurance' ? "border-gold-brushed bg-gold-brushed/10 text-gold-brushed shadow-md" : "text-theme-text/40 hover:bg-gold-brushed/5"
                  )}
                >
                  <ShieldCheck size={16} className={paymentMethod === 'Insurance' ? "text-gold-brushed" : "opacity-20"} />
                  Insurance
                </button>
              </div>

              {/* Dynamic Payment Attributes */}
              <AnimatePresence>
                {paymentMethod && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-gold p-5 rounded-2xl border-gold-brushed/10 space-y-3.5 bg-gold-brushed/5 mt-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <p className="text-[9px] uppercase tracking-widest text-gold-brushed font-black font-mono">
                          {paymentMethod === 'Card' ? 'Card Details' : paymentMethod === 'telebirr' ? 'telebirr through Chapa' : paymentMethod === 'cbe_birr' ? 'CBE Birr Wallet' : 'Insurance Coverage Details'}
                        </p>
                        <span className="text-[8px] bg-gold-brushed/15 text-gold-brushed font-semibold uppercase px-2 py-0.5 rounded tracking-widest font-mono">
                          {paymentMethod === 'Insurance' ? 'Authorized Policy' : 'Secure Connection'}
                        </span>
                      </div>

                      {/* 1. CARD DETAIL FORM */}
                      {paymentMethod === 'Card' && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Card Network</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Visa', 'Mastercard'].map((network) => (
                                <button
                                  key={network}
                                  type="button"
                                  onClick={() => setPaymentDetails({...paymentDetails, cardNetwork: network})}
                                  className={cn(
                                    "py-2 px-3 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                    paymentDetails.cardNetwork === network
                                      ? "bg-gold-brushed/10 border-gold-brushed text-gold-brushed font-mono shadow-sm"
                                      : "bg-white/5 border-white/5 text-theme-text/40 hover:bg-white/10 font-mono"
                                  )}
                                >
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    paymentDetails.cardNetwork === network ? "bg-gold-brushed" : "bg-transparent border border-white/20"
                                  )} />
                                  {network}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Card Number</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                maxLength={19}
                                autoComplete="off"
                                name="cc_number_field"
                                id="cc_number_field"
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-20 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                                placeholder={paymentDetails.cardNetwork === 'Visa' ? "4111 2222 3333 4444" : "5123 4567 8901 2345"}
                                value={paymentDetails.cardNumber}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                  let detected = paymentDetails.cardNetwork;
                                  if (v.startsWith('4')) {
                                    detected = 'Visa';
                                  } else if (/^5[1-5]|^2[2-7]/.test(v)) {
                                    detected = 'Mastercard';
                                  }
                                  const parts = [];
                                  for (let i = 0; i < v.length; i += 4) {
                                    parts.push(v.substring(i, i + 4));
                                  }
                                  setPaymentDetails({
                                    ...paymentDetails, 
                                    cardNumber: parts.join(' '),
                                    cardNetwork: detected
                                  });
                                }}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-gold-brushed bg-gold-brushed/10 border border-gold-brushed/20 px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
                                {paymentDetails.cardNetwork}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono font-mono">Expiry Date</label>
                              <input 
                                type="text" 
                                maxLength={5}
                                autoComplete="off"
                                name="cc_expiry_field"
                                id="cc_expiry_field"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                                placeholder="MM/YY"
                                value={paymentDetails.cardExpiry}
                                onChange={(e) => setPaymentDetails({...paymentDetails, cardExpiry: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono font-mono font-mono">CVV</label>
                              <input 
                                type="password" 
                                maxLength={4}
                                autoComplete="off"
                                name="cc_cvv_field"
                                id="cc_cvv_field"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                                placeholder="•••"
                                value={paymentDetails.cardCvv}
                                onChange={(e) => setPaymentDetails({...paymentDetails, cardCvv: e.target.value.replace(/[^0-9]/g, '')})}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. TELEBIRR THROUGH CHAPA */}
                      {paymentMethod === 'telebirr' && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Phone Number</label>
                            <input 
                              type="text" 
                              autoComplete="off"
                              name="tele_phone_field"
                              id="tele_phone_field"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                              placeholder="e.g. 09xxxxxxxx"
                              value={paymentDetails.telebirrPhone}
                              onChange={(e) => setPaymentDetails({...paymentDetails, telebirrPhone: e.target.value})}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono font-mono">OTP / PIN Confirmation</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              autoComplete="off"
                              name="tele_pin_field"
                              id="tele_pin_field"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                              placeholder="Enter OTP or PIN confirmation"
                              value={paymentDetails.telebirrPin}
                              onChange={(e) => setPaymentDetails({...paymentDetails, telebirrPin: e.target.value})}
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. CBE BIRR WALLET */}
                      {paymentMethod === 'cbe_birr' && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono font-mono">Registered Phone Number</label>
                            <input 
                              type="text" 
                              autoComplete="off"
                              name="cbe_phone_field"
                              id="cbe_phone_field"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                              placeholder="e.g. 09xxxxxxxx"
                              value={paymentDetails.cbePhone}
                              onChange={(e) => setPaymentDetails({...paymentDetails, cbePhone: e.target.value})}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">CBE Birr Account / Wallet</label>
                            <input 
                              type="text" 
                              autoComplete="off"
                              name="cbe_wallet_field"
                              id="cbe_wallet_field"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                              placeholder="Enter account or wallet details"
                              value={paymentDetails.cbeWallet}
                              onChange={(e) => setPaymentDetails({...paymentDetails, cbeWallet: e.target.value})}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">OTP or PIN Confirmation</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              autoComplete="off"
                              name="cbe_pin_field"
                              id="cbe_pin_field"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                              placeholder="Enter OTP/PIN confirmation"
                              value={paymentDetails.cbePin}
                              onChange={(e) => setPaymentDetails({...paymentDetails, cbePin: e.target.value})}
                            />
                          </div>
                        </div>
                      )}

                      {/* 4. INSURANCE CLAIM DETAILS FORM */}
                      {paymentMethod === 'Insurance' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Insurance Provider</label>
                              <input 
                                type="text"
                                autoComplete="off"
                                className="w-full bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors"
                                placeholder="e.g. Nyala, Jubilee, Blue Cross"
                                value={paymentDetails.insuranceCompany}
                                onChange={(e) => setPaymentDetails({...paymentDetails, insuranceCompany: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Policy ID / Number</label>
                              <input 
                                type="text"
                                autoComplete="off"
                                className="w-full bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors font-mono"
                                placeholder="e.g. POL-88210"
                                value={paymentDetails.insurancePolicyId}
                                onChange={(e) => setPaymentDetails({...paymentDetails, insurancePolicyId: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Member / Patient Name</label>
                              <input 
                                type="text"
                                autoComplete="off"
                                className="w-full bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors"
                                placeholder="Patient Representative Name"
                                value={paymentDetails.insuranceMemberName}
                                onChange={(e) => setPaymentDetails({...paymentDetails, insuranceMemberName: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Expiration Date</label>
                              <input 
                                type="date"
                                className="w-full bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                                value={paymentDetails.insuranceExpiry}
                                onChange={(e) => setPaymentDetails({...paymentDetails, insuranceExpiry: e.target.value})}
                              />
                            </div>
                          </div>

                          {/* Insurance Proof File Upload */}
                          <div className="space-y-1.5">
                            <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Insurance Card Proof (Image/PDF)</label>
                            <div className="relative border border-dashed border-white/10 hover:border-gold-brushed/40 rounded-xl p-4 transition-all bg-white/5 flex flex-col items-center justify-center text-center group cursor-pointer">
                              <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setUploadedFileName(e.target.files[0].name);
                                    setPaymentDetails(prev => ({ ...prev, insuranceCardPhoto: e.target.files![0].name }));
                                  }
                                }}
                              />
                              {paymentDetails.insuranceCardPhoto ? (
                                <div className="flex flex-col items-center gap-1 text-gold-brushed text-[11px] font-semibold">
                                  <span className="flex items-center gap-1.5 text-emerald-500 font-mono w-full justify-center">
                                    <CheckCircle2 size={14} className="animate-pulse" /> Document Attached
                                  </span>
                                  <span className="text-[9px] text-theme-text/60 max-w-[180px] truncate font-mono">{paymentDetails.insuranceCardPhoto}</span>
                                  <button 
                                    onClick={(e) => { 
                                      e.preventDefault(); 
                                      e.stopPropagation();
                                      setUploadedFileName(null); 
                                      setPaymentDetails(prev => ({ ...prev, insuranceCardPhoto: '' }));
                                    }}
                                    className="mt-1 px-2 py-0.5 rounded bg-red-400/10 text-red-400 hover:bg-red-400/20 text-[7px] uppercase font-bold tracking-widest transition-all z-20"
                                  >
                                    Reset File
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="p-1.5 rounded-lg bg-gold-brushed/10 text-gold-brushed mb-1">
                                    <ShieldCheck size={14} />
                                  </div>
                                  <p className="text-[9px] text-theme-text/80 font-medium">Click to select or drag card copy</p>
                                  <p className="text-[7px] text-theme-text/30 uppercase tracking-widest mt-0.5">Image or PDF up to 5MB</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Auth Reference Code</label>
                              <input 
                                type="text"
                                autoComplete="off"
                                className="w-full bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 font-mono transition-colors"
                                placeholder="e.g. AUTH-99120"
                                value={paymentDetails.insuranceAuthCode}
                                onChange={(e) => setPaymentDetails({...paymentDetails, insuranceAuthCode: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-widest text-theme-text/40 font-mono">Verification Helpline</label>
                              <input 
                                type="text"
                                autoComplete="off"
                                className="w-full bg-white/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-gold-brushed/40 transition-colors"
                                placeholder="e.g. +251-912xxxxxx"
                                value={paymentDetails.insuranceContact}
                                onChange={(e) => setPaymentDetails({...paymentDetails, insuranceContact: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-[9px] text-center opacity-30 text-theme-text leading-relaxed font-light italic">
              By finalizing, you acknowledge that all digital signatures have been verified and clinical checks are satisfied.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

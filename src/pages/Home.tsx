/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import LandingNavbar from '../components/layout/LandingNavbar';
import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Award, 
  Clock, 
  Truck, 
  Stethoscope, 
  ShoppingBag, 
  Calendar,
  Star,
  Smartphone,
  MapPin,
  Mail,
  Youtube,
  Instagram,
  Twitter,
  Search,
  Phone,
  Infinity,
  Check,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

import HeroSearch from '../components/search/HeroSearch';

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      setTimeout(() => {
        setIsContactOpen(false);
        setIsSent(false);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text selection:bg-gold-brushed selection:text-navy-midnight overflow-x-hidden pt-20 lg:pt-32 transition-colors duration-500">
      <LandingNavbar />

      {/* 🎯 Contact Modal */}
      <AnimatePresence>
        {isContactOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-navy-midnight/80 backdrop-blur-xl"
            onClick={() => setIsContactOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-navy-midnight border border-gold-brushed/20 p-8 md:p-12 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsContactOpen(false)}
                className="absolute top-8 right-8 text-gold-brushed/40 hover:text-gold-brushed transition-colors p-2"
              >
                <X size={24} />
              </button>

              {isSent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-gold-brushed/10 rounded-full flex items-center justify-center mx-auto border border-gold-brushed/20">
                    <Check className="text-gold-brushed" size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-serif italic text-3xl text-white">Message Dispatched</h3>
                    <p className="text-gold-brushed/60 text-[10px] font-black uppercase tracking-[0.4em]">Our clinical team will connect shortly.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-8">
                  <div className="space-y-4 text-center">
                    <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.6em]">Premium Concierge</span>
                    <h3 className="font-serif italic text-4xl text-white">Clinical Support</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] text-gold-brushed/40 uppercase font-black tracking-widest pl-4">Identification</label>
                       <input 
                         required
                         type="text" 
                         placeholder="Your Name"
                         className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-gold-brushed/40 outline-none transition-all placeholder:text-white/10 text-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gold-brushed/40 uppercase font-black tracking-widest pl-4">Digital Address</label>
                       <input 
                         required
                         type="email" 
                         placeholder="Email Address"
                         className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-gold-brushed/40 outline-none transition-all placeholder:text-white/10 text-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gold-brushed/40 uppercase font-black tracking-widest pl-4">Inquiry Context</label>
                       <textarea 
                         required
                         placeholder="How can our specialists assist you?"
                         rows={4}
                         className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-gold-brushed/40 outline-none transition-all placeholder:text-white/10 text-sm resize-none"
                       />
                    </div>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-gold-brushed text-navy-midnight py-6 rounded-full font-black uppercase text-xs tracking-[0.4em] shadow-xl shadow-gold-brushed/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Transmitting..." : "Send Inquiry"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎯 2. Hero Section */}
      <section className="relative h-[90vh] min-h-[800px] flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1582719471384-894fbb16e024?auto=format&fit=crop&q=80&w=2070" 
            alt="Premium Pharmacy Laboratory"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-gold-brushed/30 mb-8 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gold-brushed animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold-brushed">Aria Health Pharmacy</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-7xl md:text-9xl font-serif italic text-navy-midnight leading-tight tracking-tight mb-6"
          >
            Pharmacy <br /> <span className="gold-text">Managements</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-navy-midnight/60 text-xl md:text-2xl font-light italic tracking-widest max-w-2xl mx-auto mb-12"
          >
            Science. Trust. Care.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8"
          >
            <Link to="/login" className="bg-gold-brushed text-navy-midnight px-12 py-6 rounded-full font-bold uppercase text-[12px] tracking-[0.3em] shadow-xl shadow-gold-brushed/30 hover:scale-105 active:scale-95 transition-all group flex items-center gap-3">
              Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="bg-white/80 backdrop-blur-md border border-gold-brushed/20 px-12 py-6 rounded-full text-navy-midnight font-bold uppercase text-[12px] tracking-[0.3em] hover:bg-soft-blue transition-all active:scale-95 text-center"
            >
              Contact Specialist
            </button>
          </motion.div>
        </div>
      </section>

      {/* 🧪 3. Services Section */}
      <section id="services" className="py-40 px-6 bg-soft-blue/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32 space-y-6">
            <span className="text-gold-brushed text-[11px] uppercase font-bold tracking-[0.5em] block">Our Specialized Expertise</span>
            <h2 className="text-6xl font-serif italic text-navy-midnight">High-End Pharmaceutical Services</h2>
            <div className="w-24 h-0.5 bg-gold-brushed/30 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: 'Clinical Compounding', desc: 'Custom medication uniquely formulated in our ISO-certified cleanroom.' },
              { icon: Stethoscope, title: 'Tele-Health Advisory', desc: 'Secure consultations with senior pharmacists from the comfort of your sanctuary.' },
              { icon: Zap, title: 'Rapid Diagnostics', desc: 'In-house diagnostic testing with digital results delivered instantly to your profile.' },
            ].map((service, i) => (
              <div key={i} className="bg-white p-16 rounded-[4rem] border border-gold-brushed/10 hover:shadow-2xl hover:shadow-gold-brushed/10 transition-all group">
                <div className="w-20 h-20 rounded-[2rem] bg-soft-blue border border-gold-brushed/20 items-center justify-center flex text-gold-brushed mb-12 group-hover:scale-110 transition-transform">
                  <service.icon size={32} />
                </div>
                <h3 className="text-3xl font-serif italic text-navy-midnight mb-6">{service.title}</h3>
                <p className="text-navy-midnight/50 leading-relaxed font-light">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💊 4. Featured Medicines */}
      <section id="shop" className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24">
            <div className="space-y-6 text-left">
              <span className="text-gold-brushed text-[11px] uppercase font-bold tracking-[0.5em]">The Boutique Collection</span>
              <h2 className="text-6xl font-serif italic text-navy-midnight leading-tight tracking-tight">Curated <br /> Wellness Solutions</h2>
            </div>
            <Link to="/dashboard/inventory" className="text-navy-midnight font-bold uppercase text-[11px] tracking-[0.3em] flex items-center gap-3 group border-b border-gold-brushed/20 pb-2 hover:border-gold-brushed transition-all">
              View Full Catalog <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { name: 'Elite Vitality Pack', cat: 'Wellness', price: 'ETB 14,880', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=2070' },
              { name: 'Pure Hydration Serum', cat: 'DermaCare', price: 'ETB 10,680', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=2070' },
              { name: 'Aria Restorative Blend', cat: 'Clinical', price: 'ETB 18,720', img: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=2070' },
              { name: 'Signature Multi-Nutrient', cat: 'Vitamins', price: 'ETB 13,440', img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=2070' },
            ].map((med, i) => (
              <div key={i} className="space-y-6 group cursor-pointer">
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border border-gold-brushed/10 relative">
                  <img src={med.img} alt={med.name} className="w-full h-full object-cover grayscale brightness-110 group-hover:scale-110 transition-transform duration-[2s]" />
                  <div className="absolute top-6 left-6 py-2 px-4 bg-white/10 backdrop-blur-md rounded-full border border-gold-brushed/20 text-[9px] uppercase font-bold tracking-widest text-gold-brushed">
                    {med.cat}
                  </div>
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-2xl font-serif italic text-navy-midnight">{med.name}</h4>
                  <p className="text-gold-brushed text-sm font-bold tracking-widest">{med.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔮 5. Flagship Highlight */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="relative group overflow-hidden rounded-[4rem] aspect-[16/9] border border-gold-brushed/10">
                 <img 
                   src="https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=2070" 
                   className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-all duration-[3s]" 
                   alt="Aria Restorative Blend"
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.5em] mb-4">Clinical Apothecary</span>
                    <h3 className="text-4xl md:text-5xl font-serif italic text-white mb-6">Aria <br /> Restorative Blend</h3>
                    <div className="w-16 h-px bg-gold-brushed/50 mb-6" />
                    <button className="text-white text-[10px] uppercase font-bold tracking-[0.3em] border border-white/20 px-8 py-3 rounded-full hover:bg-gold-brushed hover:border-gold-brushed transition-all">
                       Explore Profile
                    </button>
                 </div>
              </div>

              <div className="relative group overflow-hidden rounded-[4rem] aspect-[16/9] border border-gold-brushed/10">
                 <img 
                   src="https://images.unsplash.com/photo-1550572017-ed200f5e6a33?auto=format&fit=crop&q=80&w=2070" 
                   className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-all duration-[3s]" 
                   alt="Signature Multi-Nutrient"
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.5em] mb-4">Precision Nutrition</span>
                    <h3 className="text-4xl md:text-5xl font-serif italic text-white mb-6">Signature <br /> Multi-Nutrient</h3>
                    <div className="w-16 h-px bg-gold-brushed/50 mb-6" />
                    <button className="text-white text-[10px] uppercase font-bold tracking-[0.3em] border border-white/20 px-8 py-3 rounded-full hover:bg-gold-brushed hover:border-gold-brushed transition-all">
                       Examine Science
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </section>

       <section className="py-40 px-6 bg-theme-bg relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12 text-left">
               <div className="space-y-4">
                  <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.4em]">24/7 Digital Hub</span>
                  <h2 className="text-6xl font-serif italic text-theme-text leading-tight">A Modern Pharmacy <br /> That Never Sleeps</h2>
               </div>
               
               <div className="space-y-8">
                  {[
                    { icon: Smartphone, title: 'One-Tap Refills', desc: 'Instant authorization via facial recognition and encrypted profiles.' },
                    { icon: Youtube, title: 'Virtual Consults', desc: 'High-bandwidth video streaming for deep clinical consultations.' },
                    { icon: ShoppingBag, title: 'Boutique Catalog', desc: 'Shop our curated collection of international wellness products.' },
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-8 group">
                       <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-alabaster/40 group-hover:text-gold-brushed transition-colors">
                          <feat.icon size={20} />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-xl font-serif italic text-white">{feat.title}</h4>
                          <p className="text-alabaster/40 text-sm font-light leading-relaxed">{feat.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
            </div>

            <div className="relative">
               <div className="glass rounded-[4rem] aspect-square overflow-hidden border-white/5 group">
                  <img 
                    src="https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=2070" 
                    alt="Senior Pharmacist at Aria Wellness Flagship" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-midnight/80 via-transparent to-transparent" />
                  <div className="absolute bottom-12 left-12 right-12 text-center space-y-4">
                     <p className="font-serif italic text-2xl text-white">Trust. Integrity. Expertise.</p>
                     <p className="text-[10px] uppercase tracking-[0.4em] text-gold-brushed font-bold italic">Consult with a Specialist</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⭐ 6. Trust & Credibility */}
      <section className="py-40 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Laboratory of the Future */}
          <div className="mb-40 relative rounded-[4rem] overflow-hidden aspect-[21/9] glass border-white/10 group">
             <img 
               src="https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&q=80&w=2070" 
               alt="Aria Precision Laboratories"
               className="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 transition-transform duration-[5s]"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-navy-midnight/90 via-navy-midnight/40 to-transparent flex items-center p-20">
                <div className="max-w-xl space-y-8">
                   <div className="space-y-4">
                      <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.4em]">Clinical Precision</span>
                      <h2 className="text-5xl font-serif italic text-white leading-tight">The Art of <br /> Pharmaceutical Craft</h2>
                      <p className="text-alabaster/60 leading-relaxed font-light">
                        Our state-of-the-art laboratory at 5 Kilo combines antique botanical wisdom with nuclear-grade precision. Every compounding is a masterpiece of clinical integrity.
                      </p>
                   </div>
                   <div className="flex gap-12 pt-4">
                      <div className="space-y-1">
                         <p className="text-white font-serif text-3xl italic">99.9%</p>
                         <p className="text-[9px] uppercase tracking-widest text-gold-brushed font-bold">Purity Standard</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-white font-serif text-3xl italic">ISO-7</p>
                         <p className="text-[9px] uppercase tracking-widest text-gold-brushed font-bold">Cleanroom Certified</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="text-center mb-24">
             <h2 className="text-5xl font-serif italic text-white mb-4">Patient Voices</h2>
             <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#C5A059" className="text-gold-brushed" />)}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Arthur Penhaligon', role: 'Premium Member', quote: 'The level of care is unprecedented. They don\'t just fill prescriptions; they provide peace of mind with artistic precision.' },
              { name: 'Diana Cavendish', role: 'Local Resident', quote: 'Aria is the gold standard for Addis Ababa pharmacies. Same-day delivery is flawlessly executed每一次.' },
              { name: 'Dr Biniyam DEGEF', role: 'Clinic Director', quote: 'Their digital infrastructure has saved our practice countless hours in compliance management. Simply the best.' }
            ].map((test, i) => (
              <div key={i} className="glass p-12 rounded-[3.5rem] border-white/5 italic space-y-8 flex flex-col text-left">
                 <p className="text-alabaster/60 leading-relaxed text-lg flex-1">"{test.quote}"</p>
                 <div className="space-y-1">
                    <p className="text-white font-serif text-xl">{test.name}</p>
                    <p className="text-[9px] uppercase tracking-widest text-gold-brushed font-bold">{test.role}</p>
                 </div>
              </div>
            ))}
          </div>

          <div className="mt-32 flex flex-wrap justify-center items-center gap-20 opacity-30 grayscale">
             {['FMHACA Certified', 'Ethiopian Health Bureau', 'Verified Labs', 'PCI Secure'].map(label => (
                <span key={label} className="text-2xl font-serif italic text-alabaster">{label}</span>
             ))}
          </div>
        </div>
      </section>

      {/* 📍 7. Location & Contact Info */}
      <section id="contact" className="py-40 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative rounded-[4rem] overflow-hidden aspect-[4/3] glass border-white/10 group">
               <img 
                 src="https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=2070" 
                 alt="Aria Wellness Flagship Boutique Storefront"
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
               />
               <div className="absolute inset-0 bg-navy-midnight/40 flex items-center justify-center">
                  <div className="glass p-8 rounded-full border-gold-brushed/40 animate-pulse">
                     <MapPin size={32} className="text-gold-brushed" />
                  </div>
               </div>
            </div>

            <div className="space-y-12 text-left">
               <div className="space-y-4">
                  <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.4em]">Visit Us</span>
                  <h2 className="text-6xl font-serif italic text-white leading-tight">Your Destination <br /> for Wellbeing</h2>
               </div>

               <div className="space-y-8">
                  <div className="flex gap-6">
                     <div className="w-12 h-12 rounded-xl bg-gold-brushed/10 border border-gold-brushed/20 flex items-center justify-center text-gold-brushed">
                        <MapPin size={20} />
                     </div>
                     <div>
                        <p className="text-white font-serif text-xl">Arada Sub City</p>
                        <p className="text-alabaster/40 text-sm">Addis Ababa, 5 Kilo</p>
                     </div>
                  </div>
                  <div className="flex gap-6">
                     <div className="w-12 h-12 rounded-xl bg-gold-brushed/10 border border-gold-brushed/20 flex items-center justify-center text-gold-brushed">
                        <Phone size={20} />
                     </div>
                     <div>
                        <p className="text-white font-serif text-xl">+2511414141414</p>
                        <p className="text-alabaster/40 text-sm">Priority Concierge Line Available</p>
                     </div>
                  </div>
                  <div className="flex gap-6">
                     <div className="w-12 h-12 rounded-xl bg-gold-brushed/10 border border-gold-brushed/20 flex items-center justify-center text-gold-brushed">
                        <Mail size={20} />
                     </div>
                     <div>
                        <p className="text-white font-serif text-xl">ariahealthcomp@gmail.com</p>
                        <p className="text-alabaster/40 text-sm">Encrypted Communications Guaranteed</p>
                     </div>
                  </div>
               </div>

               <div className="glass p-8 rounded-3xl border border-gold-brushed/10 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                     <span className="text-alabaster/40">Weekday Hours</span>
                     <span className="text-gold-brushed">12:00 — 12:00</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                     <span className="text-alabaster/40">Weekend Experience</span>
                     <span className="text-gold-brushed">12:00 — 12:00</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

        <footer className="py-32 px-6 border-t border-gold-brushed/10 bg-theme-bg">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
            <div className="space-y-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold-brushed/10 border border-gold-brushed/30 text-gold-brushed">
                   <Infinity size={24} />
                </div>
                <span className="text-2xl font-serif text-theme-text italic tracking-tight">Aria Health Pharmacy</span>
              </Link>
              <p className="text-theme-text opacity-40 text-sm leading-relaxed italic">
                Aria Health Pharmacy: Defining the intersection of artisanal care and digital precision. Apothecary since 2017.
              </p>
            </div>
            
            <div className="space-y-8">
               <h5 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed">Navigation</h5>
               <ul className="space-y-4 text-alabaster/40 text-sm font-light">
                 <li><Link to="/about" className="hover:text-gold-brushed transition-colors cursor-pointer">Our Story</Link></li>
                 {['Boutique Shop', 'Refill System', 'Health Advisor'].map(link => (
                   <li key={link} className="hover:text-gold-brushed transition-colors cursor-pointer">{link}</li>
                 ))}
               </ul>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed">Resources</h5>
               <ul className="space-y-4 text-alabaster/40 text-sm font-light">
                 {['Privacy Policy', 'Patient Rights', 'Security Compliance', 'ADA Access'].map(link => (
                   <li key={link} className="hover:text-gold-brushed transition-colors cursor-pointer">{link}</li>
                 ))}
               </ul>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed">Newsletter</h5>
               <div className="relative group">
                  <input 
                    type="email" 
                    placeholder="Enter email for curation..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-[10px] italic focus:outline-none focus:border-gold-brushed/40 transition-all text-white placeholder:text-alabaster/20"
                  />
                  <button className="absolute right-2 top-2 p-2 rounded-full bg-gold-brushed text-navy-midnight hover:scale-110 transition-transform">
                    <ArrowRight size={16} />
                  </button>
               </div>
               <div className="flex gap-6 text-alabaster/20">
                  <Instagram size={18} className="hover:text-gold-brushed cursor-pointer transition-colors" />
                  <Twitter size={18} className="hover:text-gold-brushed cursor-pointer transition-colors" />
                  <Youtube size={18} className="hover:text-gold-brushed cursor-pointer transition-colors" />
               </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] uppercase tracking-[0.3em] text-alabaster/20 font-bold">
            <p>© 2026 Aria Premium Pharmacy Group. All Rights Reserved.</p>
            <div className="flex gap-12">
               <span>PCI Level 1 Certified</span>
               <span>HIPAA Compliant Network</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import LandingNavbar from '../components/layout/LandingNavbar';
import { Award, ShieldCheck, Heart, Sparkles, Infinity, Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text selection:bg-gold-brushed selection:text-navy-midnight overflow-x-hidden pt-20 lg:pt-32 transition-colors duration-500">
      <LandingNavbar />

      {/* 🏛️ Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full border border-gold-brushed/20"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-brushed">A Century of Excellence</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-serif italic text-theme-text leading-tight tracking-tight"
          >
            The Art of <span className="gold-text">Apothecary</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-theme-text opacity-40 text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto italic"
          >
            Since 2017, Aria Health Pharmacy has stood at the intersection of traditional pharmaceutical grace and modern clinical precision.
          </motion.p>
        </div>
      </section>

      {/* 📜 The Story Section */}
      <section className="py-24 px-6 bg-gold-brushed/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.4em]">Our Narrative</span>
                <h2 className="text-5xl font-serif italic text-theme-text leading-tight">Born in Addis Ababa, <br /> Refined by Time.</h2>
              </div>
              <div className="space-y-6 text-theme-text opacity-60 font-light leading-relaxed text-lg">
                <p>
                  Aria Health Pharmacy began as a boutique pharmacy in 5 Kilo, serving Addis Ababa's most discerning individuals with bespoke medicinal compounding. Our founder, Dr. Aria Erick, believed that healthcare should be as personal as it is professional.
                </p>
                <p>
                  Over ten decades later, we haven't lost that human touch. We've simply augmented it with the world's most advanced pharmaceutical ERP ecosystem, ensuring that every patient receives care that is both high-tech and high-touch.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="glass aspect-square rounded-[4rem] overflow-hidden border-gold-brushed/10 relative">
                <img 
                  src="https://www.pexels.com/photo/man-technology-portrait-doctor-14797857/?utm_source=chatgpt.com" 
                  alt="Aria Lead Pharmacist" 
                  className="w-full h-full object-cover grayscale opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-midnight/80 to-transparent" />
                <div className="absolute bottom-12 left-12">
                   <p className="text-white text-3xl font-serif italic">Est. 2017</p>
                   <p className="text-gold-brushed text-[10px] uppercase tracking-[0.4em] font-bold">Addis Ababa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 Values Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-24 space-y-4">
            <span className="text-gold-brushed text-[10px] uppercase font-bold tracking-[0.4em]">Our Principles</span>
            <h2 className="text-5xl font-serif italic text-theme-text font-medium">The Values that Guide Us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: 'Inviolable Trust', desc: 'Medical confidentiality and data security are our highest honors. We protect your history like our own.' },
              { icon: Heart, title: 'Compassionate Care', desc: 'Every prescription is a promise of wellbeing. We treat the individual, not just the diagnosis.' },
              { icon: Award, title: 'Clinical Rigor', desc: 'We maintain the highest global standards for pharmaceutical storage, handling, and verification.' }
            ].map((value, i) => (
              <div key={i} className="glass p-12 rounded-[3.5rem] space-y-6 border-gold-brushed/10">
                <div className="w-16 h-16 rounded-2xl bg-gold-brushed/5 border border-gold-brushed/20 flex items-center justify-center text-gold-brushed">
                   <value.icon size={32} />
                </div>
                <h3 className="text-2xl font-serif italic text-theme-text">{value.title}</h3>
                <p className="text-theme-text opacity-40 leading-relaxed font-light">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🌿 Commitment to Wellness */}
      <section className="py-32 px-6 relative overflow-hidden bg-gold-brushed/[0.01]">
         <div className="max-w-7xl mx-auto glass p-16 md:p-24 rounded-[4rem] border-gold-brushed/5 relative overflow-hidden text-center">
            <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <Sparkles className="text-gold-brushed mx-auto" size={32} />
                <h2 className="text-5xl font-serif italic text-theme-text leading-tight">Our Commitment <br /> to Your Vitality</h2>
              </div>
              <p className="max-w-2xl mx-auto text-theme-text opacity-60 text-lg font-light leading-relaxed italic">
                "Wellness is not a destination, but a state of harmonious being. We are here to facilitate that journey with every consultation, every digital check, and every hand-delivered remedy."
              </p>
              <div className="w-20 h-0.5 bg-gold-brushed/20 mx-auto" />
              <p className="text-gold-brushed uppercase tracking-[0.4em] text-[10px] font-bold">The Aria Ethics Committee</p>
            </div>
         </div>
      </section>

      {/* Footer (Simplified for About Page) */}
      <footer className="py-24 px-6 border-t border-gold-brushed/10 bg-theme-bg">
        <div className="max-w-7xl mx-auto space-y-16">
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
               <h5 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed">Inquiries</h5>
               <p className="text-theme-text opacity-40 text-sm font-light">ariahealthcomp@gmail.com<br />+2511414141414</p>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed">Legacy</h5>
               <ul className="space-y-4 text-theme-text opacity-40 text-sm font-light">
                 {['Our Story', 'Boutique Shop', 'Refill System'].map(link => (
                   <li key={link} className="hover:text-gold-brushed transition-colors cursor-pointer">{link}</li>
                 ))}
               </ul>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-brushed">Social</h5>
               <div className="flex gap-6 text-theme-text opacity-20">
                  <Instagram size={18} className="hover:text-gold-brushed cursor-pointer transition-colors" />
                  <Twitter size={18} className="hover:text-gold-brushed cursor-pointer transition-colors" />
                  <Youtube size={18} className="hover:text-gold-brushed cursor-pointer transition-colors" />
               </div>
            </div>
          </div>
          <div className="pt-12 border-t border-gold-brushed/5 flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-theme-text opacity-20 font-bold">
            <p>© 2026 Aria Premium Pharmacy Group.</p>
            <Link to="/" className="hover:text-gold-brushed transition-colors">Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

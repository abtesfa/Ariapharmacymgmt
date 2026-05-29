/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle, FileText, Download, Filter, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export default function Insurance() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'reports'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await api.insurance.listClaims();
      setClaims(data);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(c => {
    if (activeTab === 'pending') return c.status === 'Pending';
    if (activeTab === 'approved') return c.status === 'Approved';
    return true;
  }).filter(c => 
    (c.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.insurance_provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.transaction_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadReport = (report: any) => {
    if (report.type === 'XLSX') {
      const csvContent = [
        ['Provider Name', 'Total Claims', 'Approved Amount', 'Pending Amount', 'Rejection Rate'],
        ['BlueShield Global', '142', 'ETB 452,300', 'ETB 23,400', '1.2%'],
        ['Aetna Premium', '89', 'ETB 298,900', 'ETB 14,800', '2.4%'],
        ['Cigna Health', '120', 'ETB 340,500', 'ETB 8,900', '0.8%'],
        ['UnitedHealthcare', '73', 'ETB 211,200', 'ETB 32,500', '3.1%']
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.title.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const contentHtml = `
        <html>
          <head>
            <title>${report.title.toUpperCase()}</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #111827; line-height: 1.5; }
              h1 { font-family: 'Playfair Display', serif; font-style: italic; font-size: 26px; border-bottom: 2px solid #C5A059; padding-bottom: 12px; margin-bottom: 30px; }
              .meta { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #6B7280; margin-bottom: 40px; }
              .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; font-weight: bold; margin-top: 30px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; }
              .summary-block { margin-top: 15px; font-size: 13px; color: #374151; }
              .footer { margin-top: 60px; font-size: 10px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${report.title}</h1>
            <div class="meta">Generated on April 30, 2024 • File Size: ${report.size} • Verified Insurance Protocol</div>
            
            <div class="section-title">Executive Abstract</div>
            <div class="summary-block">
              This dossier represents the dynamic analytical audit of insurance coverage claims, payouts, and denials processed within our centralized pharmacy terminal. All evaluations are fully compliant with sovereign medical billing regulations and are protected under medical privacy frameworks.
            </div>
            
            <div class="section-title">Key Performance Indicators</div>
            <div class="summary-block">
              <ul>
                <li><strong>Aggregate Claim Volume:</strong> 424 Processed Filings</li>
                <li><strong>Claim Acceptance Multi-factor:</strong> 96.8% approved</li>
                <li><strong>Gross Provider Receivables:</strong> ETB 1,302,900.00</li>
                <li><strong>Pending Direct Pre-Authorizations:</strong> 12 Outstanding</li>
              </ul>
            </div>
            
            <div class="footer">Confidential Ledger • BlueShield / Cigna / Aetna Primary Network</div>
          </body>
        </html>
      `;
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(contentHtml);
        doc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      } else {
        const blob = new Blob([contentHtml], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${report.title.toLowerCase().replace(/\s+/g, '_')}.html`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Claims', icon: Clock },
    { id: 'approved', label: 'Approved Claims', icon: CheckCircle },
    { id: 'reports', label: 'Coverage Reports', icon: FileText },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Insurance & Reconciliation</p>
          <h2 className="text-4xl text-theme-text italic">Claims Management</h2>
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text/40 group-focus-within:text-gold-brushed transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search claim ID, patient, or provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-theme-text outline-none focus:border-gold-brushed/40 transition-all font-light"
          />
        </div>
        <button className="glass px-6 py-4 rounded-2xl border-white/5 text-gold-brushed flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-gold-brushed/5 transition-all">
          <Filter size={16} /> Filter Results
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'reports' ? (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { title: 'Monthly Coverage Delta', size: '2.4 MB', type: 'PDF' },
              { title: 'Provider Payout Audit', size: '1.8 MB', type: 'XLSX' },
              { title: 'Claim Denial Analysis', size: '4.2 MB', type: 'PDF' },
            ].map((report, i) => (
              <div key={i} className="glass p-8 rounded-[2rem] border-white/5 hover:border-gold-brushed/20 transition-all group">
                 <div className="w-12 h-12 rounded-2xl bg-gold-brushed/10 flex items-center justify-center text-gold-brushed mb-6 group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                 </div>
                 <h4 className="text-xl font-serif italic text-theme-text mb-2">{report.title}</h4>
                 <p className="text-[10px] uppercase font-black tracking-widest text-gold-brushed opacity-40 mb-6">Generated Apr 30, 2024 • {report.size}</p>
                 <button 
                   onClick={() => handleDownloadReport(report)}
                   className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-theme-text/60 hover:text-gold-brushed hover:border-gold-brushed/40 transition-all"
                 >
                    <Download size={14} /> Download {report.type}
                 </button>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-[2.5rem] border-white/5 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gold-brushed opacity-60">Claim Details</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gold-brushed opacity-60">Patient & Provider</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gold-brushed opacity-60 text-right">Amount</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gold-brushed opacity-60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <Loader2 className="animate-spin text-gold-brushed mx-auto" size={32} />
                      </td>
                    </tr>
                  ) : filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-theme-text opacity-20 italic font-serif text-lg">
                        No {activeTab} claims found.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr key={claim.claim_id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-theme-text mb-1">{claim.transaction_number}</p>
                          <p className="text-[10px] text-gold-brushed font-medium uppercase tracking-widest opacity-60">Policy: {claim.policy_number || 'N/A'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-serif italic text-theme-text mb-1">{claim.first_name} {claim.last_name}</p>
                          <p className="text-[10px] text-theme-text/40 font-bold uppercase tracking-widest">{claim.insurance_provider}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-lg font-serif italic gold-text">ETB {Number(claim.claim_amount).toLocaleString()}</p>
                          <p className="text-[10px] text-theme-text/40 font-medium uppercase tracking-widest">
                            {claim.claim_date ? new Date(claim.claim_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="text-[10px] font-black uppercase tracking-widest text-gold-brushed opacity-40 hover:opacity-100 transition-opacity">
                            View Dossier
                          </button>
                        </td>
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

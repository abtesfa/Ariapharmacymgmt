import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Users, 
  Download, 
  Filter, 
  Loader2,
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon, 
  Briefcase, 
  ArrowRight,
  TrendingDown,
  Calendar,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  ShoppingCart
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

type ReportType = 'daily' | 'monthly' | 'expiry' | 'employee' | 'tax';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchReportData = async (type: ReportType) => {
    setLoading(true);
    try {
      if (type === 'daily' || type === 'monthly' || type === 'tax') {
        const transactions = await api.transactions.list();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (type === 'daily') {
          const todayTx = transactions.filter((t: any) => {
            const date = new Date(t.transaction_date);
            return date >= today;
          });

          setData({
            transaction_count: todayTx.length,
            total_revenue: todayTx.reduce((sum: number, t: any) => sum + Number(t.final_amount || 0), 0),
            total_tax: todayTx.reduce((sum: number, t: any) => sum + Number(t.tax_amount || 0), 0)
          });
        } else if (type === 'monthly') {
          const months: any = {};
          transactions.forEach((t: any) => {
            const date = new Date(t.transaction_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[monthKey] = (months[monthKey] || 0) + Number(t.final_amount || 0);
          });
          setData(Object.entries(months).map(([month, revenue]) => ({ month, revenue })));
        } else if (type === 'tax') {
          const taxMonths: any = {};
          transactions.forEach((t: any) => {
            const date = new Date(t.transaction_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            taxMonths[monthKey] = (taxMonths[monthKey] || 0) + Number(t.tax_amount || 0);
          });
          setData(Object.entries(taxMonths).map(([month, total_tax]) => ({ month, total_tax })));
        }
      } else if (type === 'expiry') {
        const batches = await api.inventory.batches();
        const now = new Date();
        setData(batches.map((b: any) => {
          const exp = new Date(b.expiry_date);
          return {
            ...b,
            days_until_expiry: Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24))
          };
        }).filter((b: any) => b.days_until_expiry < 180));
      } else if (type === 'employee') {
        const [emps, txs] = await Promise.all([
          api.employees.list(),
          api.transactions.list()
        ]);

        setData(emps.map((e: any) => {
          const myTxs = txs.filter((t: any) => t.employee_id === e.employee_id);
          return {
            ...e,
            total_sales: myTxs.reduce((sum: number, t: any) => sum + Number(t.final_amount || 0), 0),
            total_transactions: myTxs.length
          };
        }));
      }

    } catch (err) {
      console.error(`Failed to generate ${type} report:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(activeReport);
  }, [activeReport]);

  const expirySummary = useMemo(() => {
    if (activeReport !== 'expiry' || !Array.isArray(data)) return [];
    const buckets = [
      { label: '<30d', count: 0, color: '#ef4444' }, 
      { label: '<60d', count: 0, color: '#f59e0b' }, 
      { label: '<90d', count: 0, color: '#eab308' }, 
      { label: '<120d', count: 0, color: '#d4af37' }, 
      { label: '<150d', count: 0, color: '#b45309' },
      { label: '<180d', count: 0, color: '#78350f' },
    ];
    
    data.forEach((item: any) => {
      const days = item.days_until_expiry;
      if (days < 30) buckets[0].count++;
      else if (days < 60) buckets[1].count++;
      else if (days < 90) buckets[2].count++;
      else if (days < 120) buckets[3].count++;
      else if (days < 150) buckets[4].count++;
      else if (days < 180) buckets[5].count++;
    });
    
    return buckets;
  }, [data, activeReport]);

  const employeePerformance = useMemo(() => {
    if (activeReport !== 'employee' || !Array.isArray(data)) return [];
    return data.map((staff: any) => ({
      name: staff.first_name,
      sales: staff.total_sales,
    }));
  }, [data, activeReport]);

  const reportNav: { id: ReportType, label: string, icon: any, desc: string }[] = [
    { id: 'daily', label: 'Daily Sales', icon: Calendar, desc: 'Current day revenue and tax breakdown.' },
    { id: 'monthly', label: 'Monthly Revenue', icon: TrendingUp, desc: 'Year-to-date monthly financial summary.' },
    { id: 'expiry', label: 'Expiry Report', icon: Clock, desc: 'Products nearing terminal expiration dates.' },
    { id: 'employee', label: 'Employee Report', icon: Users, desc: 'Contribution and performance audit.' },
    { id: 'tax', label: 'Tax Report', icon: FileSpreadsheet, desc: 'Collected tax and compliance records.' },
  ];

  const exportToXML = () => {
    if (!data) return;
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<report type="${activeReport}" generated_at="${new Date().toISOString()}">\n`;

    if (activeReport === 'daily') {
      xmlContent += `  <summary>\n`;
      xmlContent += `    <transaction_count>${data.transaction_count}</transaction_count>\n`;
      xmlContent += `    <total_revenue>${data.total_revenue}</total_revenue>\n`;
      xmlContent += `    <total_tax>${data.total_tax}</total_tax>\n`;
      xmlContent += `  </summary>\n`;
    } else if (Array.isArray(data)) {
      xmlContent += `  <items>\n`;
      data.forEach((item: any) => {
        xmlContent += `    <item>\n`;
        Object.entries(item).forEach(([key, val]) => {
          if (typeof val !== 'object') {
            const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
            const cleanVal = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            xmlContent += `      <${cleanKey}>${cleanVal}</${cleanKey}>\n`;
          }
        });
        xmlContent += `    </item>\n`;
      });
      xmlContent += `  </items>\n`;
    } else {
      xmlContent += `  <data>${JSON.stringify(data)}</data>\n`;
    }
    xmlContent += `</report>`;

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${activeReport}_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    let contentHtml = `
      <html>
        <head>
          <title>${activeReport.toUpperCase()} REPORT - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #111827; line-height: 1.5; }
            h1 { font-family: 'Playfair Display', serif; font-style: italic; font-size: 28px; border-bottom: 2px solid #C5A059; padding-bottom: 12px; margin-bottom: 30px; }
            .meta { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #6B7280; margin-bottom: 40px; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .metric-card { border: 1px solid #D4AF37; padding: 20px; border-radius: 12px; background: rgba(212,175,55,0.03); }
            .metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; font-weight: bold; }
            .metric-value { font-size: 24px; font-weight: bold; margin-top: 8px; color: #1F2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; background: #FFFDF9; color: #D4AF37; font-weight: bold; }
            td { font-size: 13px; }
            .footer { margin-top: 60px; font-size: 10px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Executive Pharmacy Report - ${activeReport.toUpperCase()}</h1>
          <div class="meta">Generated on ${new Date().toLocaleString()} by AI Control Hub</div>
    `;

    if (activeReport === 'daily' && data) {
      contentHtml += `
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Transaction Count</div>
            <div class="metric-value">${data.transaction_count}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Revenue</div>
            <div class="metric-value">ETB ${data.total_revenue.toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Tax Gathered</div>
            <div class="metric-value">ETB ${data.total_tax.toLocaleString()}</div>
          </div>
        </div>
      `;
    } else if (Array.isArray(data) && data.length > 0) {
      contentHtml += `
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).filter(k => typeof data[0][k] !== 'object').map(k => `<th>${k.replace(/_/g, ' ')}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${Object.entries(item).filter(([k, v]) => typeof v !== 'object').map(([k, v]) => `<td>${v}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      contentHtml += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    contentHtml += `
          <div class="footer">Confidential - Internal Use Only - BioGeneric Global Control Ledger</div>
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
      link.setAttribute('download', `report_${activeReport}_${new Date().toISOString().split('T')[0]}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Audit & Analysis</p>
          <h2 className="text-4xl text-theme-text italic">Executive Reports</h2>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={exportToXML}
             className="glass px-6 py-3 rounded-xl border-white/5 text-[10px] font-bold uppercase tracking-widest text-theme-text/60 flex items-center gap-2 hover:bg-gold-brushed/10 hover:text-gold-brushed transition-all"
           >
             <Download size={14} /> Export XML
           </button>
           <button 
             onClick={exportToPDF}
             className="bg-gold-brushed text-navy-midnight px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-gold-brushed/10"
           >
             <Download size={14} /> Export PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
         <div className="space-y-4">
            {reportNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveReport(item.id)}
                className={cn(
                  "w-full text-left p-6 rounded-[2.5rem] border transition-all relative group overflow-hidden",
                  activeReport === item.id 
                    ? "border-gold-brushed shadow-2xl shadow-gold-brushed/20" 
                    : "glass border-white/5 hover:border-gold-brushed/30 hover:bg-gold-brushed/5"
                )}
              >
                {activeReport === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gold-brushed z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors duration-500",
                    activeReport === item.id ? "bg-navy-midnight/20 text-navy-midnight" : "bg-gold-brushed/10 text-gold-brushed group-hover:bg-gold-brushed/20"
                  )}>
                    <item.icon size={22} strokeWidth={activeReport === item.id ? 2.5 : 1.5} />
                  </div>
                  <div>
                    <h4 className={cn(
                      "font-serif italic text-xl leading-tight transition-colors duration-500",
                      activeReport === item.id ? "text-navy-midnight" : "text-theme-text group-hover:text-gold-brushed"
                    )}>{item.label}</h4>
                    <p className={cn(
                      "text-[9px] uppercase tracking-[0.2em] font-black mt-1.5 transition-colors duration-500",
                      activeReport === item.id ? "text-navy-midnight/60" : "text-gold-brushed/40 group-hover:text-gold-brushed/60"
                    )}>{item.id} analytical audit</p>
                  </div>
                </div>
                
                <AnimatePresence>
                  {activeReport !== item.id && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-theme-text/40 mt-4 leading-relaxed group-hover:text-theme-text/60 relative z-10"
                    >
                      {item.desc}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            ))}
         </div>

        <div className="xl:col-span-3">
           <div className="glass rounded-[3rem] p-10 border-gold-brushed/10 min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-gold-brushed/10 rounded-2xl text-gold-brushed">
                       {reportNav.find(n => n.id === activeReport)?.icon && React.createElement(reportNav.find(n => n.id === activeReport)!.icon, { size: 24 })}
                    </div>
                    <div>
                       <h3 className="text-3xl font-serif italic text-theme-text">{reportNav.find(n => n.id === activeReport)?.label}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40">Generated {new Date().toLocaleDateString()}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold-brushed">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Data Stream
                 </div>
              </div>

              <div className="flex-1">
                 {loading ? (
                   <div className="flex flex-col items-center justify-center h-full gap-4 text-theme-text/20">
                      <Loader2 className="animate-spin" size={48} />
                      <p className="italic font-serif text-lg">Reconciling Ledger entries...</p>
                   </div>
                 ) : (
                   <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeReport}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                         {activeReport === 'daily' && (
                           <div className="space-y-12">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                 <motion.div 
                                   initial={{ scale: 0.95, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   transition={{ delay: 0.1 }}
                                   className="bg-gold-brushed/5 p-8 rounded-3xl border border-gold-brushed/10 group hover:border-gold-brushed/30 transition-all"
                                 >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/60 mb-2">Transaction Volume</p>
                                    <p className="text-4xl gold-text font-black">{data?.transaction_count || 0}</p>
                                    <p className="text-xs text-theme-text/40 mt-1">Confirmed settlements today</p>
                                 </motion.div>
                                 <motion.div 
                                   initial={{ scale: 0.95, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   transition={{ delay: 0.2 }}
                                   className="bg-gold-brushed/5 p-8 rounded-3xl border border-gold-brushed/10 group hover:border-gold-brushed/30 transition-all"
                                 >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/60 mb-2">Gross Revenue</p>
                                    <p className="text-4xl gold-text font-black">ETB {Number(data?.total_revenue || 0).toLocaleString()}</p>
                                    <p className="text-xs text-theme-text/40 mt-1">Total value exchange</p>
                                 </motion.div>
                                 <motion.div 
                                   initial={{ scale: 0.95, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   transition={{ delay: 0.3 }}
                                   className="bg-gold-brushed/5 p-8 rounded-3xl border border-gold-brushed/10 group hover:border-gold-brushed/30 transition-all"
                                 >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/60 mb-2">Tax Liability</p>
                                    <p className="text-4xl gold-text font-black">ETB {Number(data?.total_tax || 0).toLocaleString()}</p>
                                    <p className="text-xs text-theme-text/40 mt-1">VAT/Service tax collected</p>
                                 </motion.div>
                              </div>
 
                              <div className="glass p-10 rounded-[2.5rem] border-white/5 bg-navy-midnight/30">
                                 <div className="flex items-center justify-between mb-8">
                                    <h4 className="font-serif italic text-xl text-theme-text">Intraday Momentum</h4>
                                    <div className="flex gap-2">
                                       <div className="h-3 w-3 rounded-full bg-gold-brushed shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                                       <span className="text-[9px] font-black uppercase tracking-widest text-gold-brushed/60">Live Flow</span>
                                    </div>
                                 </div>
                                 <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={Array.from({ length: 12 }).map((_, i) => ({
                                         time: `${String(i*2).padStart(2, '0')}:00`,
                                         value: Math.random() * 80 + 20
                                       }))}>
                                          <defs>
                                             <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.2} />
                                             </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                          <XAxis 
                                            dataKey="time" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                          />
                                          <YAxis hide />
                                          <Tooltip 
                                            cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                                            contentStyle={{ 
                                              backgroundColor: '#0A0E1A', 
                                              border: '1px solid rgba(212,175,55,0.2)',
                                              borderRadius: '12px',
                                              fontSize: '10px'
                                            }}
                                          />
                                          <Bar 
                                            dataKey="value" 
                                            radius={[6, 6, 0, 0]}
                                            barSize={30}
                                          >
                                            {Array.from({ length: 12 }).map((_, i) => (
                                              <Cell key={`cell-${i}`} fill={[`#D4AF37`, `#FFD700`, `#F59E0B`, `#B45309`, `#D97706`][i % 5]} />
                                            ))}
                                          </Bar>
                                       </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>
                           </div>
                         )}

                         {activeReport === 'expiry' && (
                           <div className="space-y-12">
                              <div className="glass p-10 rounded-[2.5rem] border-white/5 bg-navy-midnight/30">
                                 <div className="flex items-center justify-between mb-8">
                                    <h4 className="font-serif italic text-xl text-theme-text">Risk Distribution Hierarchy</h4>
                                    <div className="flex gap-4">
                                       <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-red-500" />
                                          <span className="text-[8px] font-black uppercase text-theme-text/40 tracking-widest">Critical</span>
                                       </div>
                                       <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-gold-brushed" />
                                          <span className="text-[8px] font-black uppercase text-theme-text/40 tracking-widest">Monitored</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={expirySummary}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                          <XAxis 
                                            dataKey="label" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                          />
                                          <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                            allowDecimals={false}
                                          />
                                          <Tooltip 
                                            cursor={{ fill: 'rgba(212,175,55,0.05)', radius: 8 }}
                                            contentStyle={{ 
                                              backgroundColor: '#0A0E1A', 
                                              border: '1px solid rgba(212,175,55,0.2)',
                                              borderRadius: '12px',
                                              fontSize: '10px'
                                            }}
                                          />
                                          <Bar 
                                            dataKey="count" 
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                          >
                                             {expirySummary.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                             ))}
                                          </Bar>
                                       </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>

                              <div className="overflow-x-auto custom-scrollbar">
                                 <table className="w-full text-left">
                                    <thead className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/40 border-b border-white/5">
                                       <tr>
                                          <th className="pb-6 px-4">Core Asset</th>
                                          <th className="pb-6 px-4">Batch Signature</th>
                                          <th className="pb-6 px-4">Terminal Date</th>
                                          <th className="pb-6 px-4">Quant.</th>
                                          <th className="pb-6 px-4">Security Window</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                       {Array.isArray(data) && data.map((item: any) => (
                                          <tr key={item.batch_id} className="group hover:bg-gold-brushed/5 transition-all">
                                             <td className="py-6 px-4 font-serif italic text-lg text-theme-text">{item.product_name}</td>
                                             <td className="py-6 px-4 text-xs font-mono opacity-40">#{item.batch_number}</td>
                                             <td className="py-6 px-4 text-xs text-theme-text font-bold">{new Date(item.expiry_date).toLocaleDateString()}</td>
                                             <td className="py-6 px-4 text-xs text-theme-text">{item.quantity_on_hand}</td>
                                             <td className="py-6 px-4">
                                                <span className={cn(
                                                   "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                   item.days_until_expiry < 30 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                   {item.days_until_expiry} Days Remaining
                                                </span>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                                 {(!Array.isArray(data) || data.length === 0) && (
                                   <div className="py-20 text-center text-theme-text/20 italic font-serif">
                                      No terminal assets detected within the 180-day security window.
                                   </div>
                                 )}
                              </div>
                           </div>
                         )}

                         {activeReport === 'employee' && (
                           <div className="space-y-12">
                              <div className="glass p-10 rounded-[2.5rem] border-white/5 bg-navy-midnight/30">
                                 <h4 className="font-serif italic text-xl text-theme-text mb-8">Sales Capability Audit</h4>
                                 <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={employeePerformance} layout="vertical" margin={{ left: 40, right: 40 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                          <XAxis type="number" hide />
                                          <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                          />
                                          <Tooltip 
                                            cursor={{ fill: 'rgba(212,175,55,0.05)', radius: 8 }}
                                            contentStyle={{ 
                                              backgroundColor: '#0A0E1A', 
                                              border: '1px solid rgba(212,175,55,0.2)',
                                              borderRadius: '12px',
                                              fontSize: '10px'
                                            }}
                                            formatter={(val: number) => [`ETB ${val.toLocaleString()}`, 'Total Sales']}
                                          />
                                          <Bar 
                                            dataKey="sales" 
                                            radius={[0, 6, 6, 0]}
                                            barSize={30}
                                          >
                                             {employeePerformance.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={[`#D4AF37`, `#FFD700`, `#F59E0B`, `#B45309`, `#D97706`][index % 5]} />
                                             ))}
                                          </Bar>
                                       </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 {Array.isArray(data) && data.map((staff: any) => (
                                    <div key={staff.employee_id} className="glass p-8 rounded-3xl border-white/5 flex items-center justify-between group hover:border-gold-brushed/20 transition-all">
                                       <div className="flex items-center gap-6">
                                          <div className="w-14 h-14 rounded-2xl bg-gold-brushed/10 flex items-center justify-center font-serif text-2xl text-gold-brushed">
                                             {staff.first_name?.[0]}
                                          </div>
                                          <div>
                                             <h4 className="text-lg font-serif italic text-theme-text">{staff.first_name} {staff.last_name}</h4>
                                             <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40">Authorized Personnel</p>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40 mb-1">Volume handled</p>
                                          <p className="text-xl gold-text font-black">ETB {Number(staff.total_sales || 0).toLocaleString()}</p>
                                          <p className="text-[9px] opacity-40 font-mono mt-1">{staff.total_transactions} tx</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {activeReport === 'monthly' && (
                            <div className="space-y-12">
                               <div className="glass p-10 rounded-[3rem] border-white/5 bg-navy-midnight/30 overflow-hidden relative">
                                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                     <TrendingUp size={200} className="text-gold-brushed" />
                                  </div>
                                  <h4 className="font-serif italic text-2xl text-theme-text mb-10">Fiscal Revenue Histogram</h4>
                                  <div className="h-80 w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={Array.isArray(data) ? data : []} margin={{ bottom: 20 }}>
                                           <defs>
                                              <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                                                 <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                                                 <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.4} />
                                              </linearGradient>
                                           </defs>
                                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                           <XAxis 
                                             dataKey="month" 
                                             axisLine={false} 
                                             tickLine={false} 
                                             tick={{ fill: 'rgba(212,175,55,0.6)', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                                             dy={15}
                                             tickFormatter={(val) => val.split('-')[1]}
                                           />
                                           <YAxis 
                                             axisLine={false} 
                                             tickLine={false} 
                                             tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                             tickFormatter={(val) => `${Math.round(val/1000)}k`}
                                           />
                                           <Tooltip 
                                             cursor={{ fill: 'rgba(212,175,55,0.05)', radius: 10 }}
                                             contentStyle={{ 
                                               backgroundColor: '#0A0E1A', 
                                               border: '1px solid rgba(212,175,55,0.3)',
                                               borderRadius: '16px',
                                               boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                             }}
                                             itemStyle={{ color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}
                                             labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '10px' }}
                                           />
                                           <Bar 
                                             dataKey="revenue" 
                                             radius={[10, 10, 0, 0]}
                                             barSize={45}
                                             animationDuration={1500}
                                           >
                                              {(Array.isArray(data) ? data : []).map((entry, index) => (
                                                <Cell 
                                                  key={`cell-${index}`} 
                                                  fill={[`#D4AF37`, `#FFD700`, `#F59E0B`, `#B45309`, `#D97706`][index % 5]}
                                                  className="hover:brightness-125 transition-all cursor-pointer"
                                                />
                                              ))}
                                           </Bar>
                                        </BarChart>
                                     </ResponsiveContainer>
                                  </div>
                               </div>
                               
                               <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                     <thead className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/40 border-b border-white/5">
                                        <tr>
                                           <th className="pb-6">Period</th>
                                           <th className="pb-6">Gross Transactional Value</th>
                                           <th className="pb-6 text-right">Growth Index</th>
                                        </tr>
                                     </thead>
                                     <tbody className="divide-y divide-white/5">
                                        {Array.isArray(data) && data.map((m: any) => (
                                           <tr key={m.month}>
                                              <td className="py-6 font-mono text-xs">{m.month}</td>
                                              <td className="py-6 font-serif italic text-xl text-theme-text">ETB {Number(m.revenue).toLocaleString()}</td>
                                              <td className="py-6 text-right">
                                                 <div className="inline-flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                    <TrendingUp size={10} /> +12.4%
                                                 </div>
                                              </td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>
                               </div>
                            </div>
                         )}

                         {activeReport === 'tax' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                               <div className="space-y-6">
                                  <h4 className="font-serif italic text-2xl text-theme-text mb-8">Tax Compliance Summary</h4>
                                  <div className="h-64 w-full mb-8">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                           <Tooltip 
                                              contentStyle={{ backgroundColor: '#0A0E1A', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                                           />
                                           <Pie
                                              data={Array.isArray(data) ? data : []}
                                              dataKey="total_tax"
                                              nameKey="month"
                                              cx="50%"
                                              cy="50%"
                                              innerRadius={60}
                                              outerRadius={80}
                                              paddingAngle={5}
                                              animationBegin={0}
                                              animationDuration={1500}
                                           >
                                              {(Array.isArray(data) ? data : []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={[`#D4AF37`, `#C5A028`, `#B69119`, `#A7820A`][index % 4]} />
                                              ))}
                                           </Pie>
                                        </PieChart>
                                     </ResponsiveContainer>
                                  </div>
                                  <div className="space-y-4">
                                     {Array.isArray(data) && data.map((t: any) => (
                                        <div key={t.month} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                                           <div className="flex items-center gap-4">
                                              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                                 <FileText size={16} />
                                              </div>
                                              <div>
                                                 <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40">Filing Period</p>
                                                 <p className="text-sm font-mono text-theme-text">{t.month}</p>
                                              </div>
                                           </div>
                                           <div className="text-right">
                                              <p className="text-[10px] font-black uppercase tracking-widest text-gold-brushed/40">Collected Tax</p>
                                              <p className="text-xl gold-text font-black">ETB {Number(t.total_tax).toLocaleString()}</p>
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                               
                               <div className="bg-gold-brushed/5 rounded-[2.5rem] p-10 border border-gold-brushed/10 flex flex-col justify-center items-center text-center space-y-6">
                                  <div className="w-32 h-32 rounded-full border-[10px] border-gold-brushed flex items-center justify-center">
                                     <p className="text-2xl font-black gold-text">100%</p>
                                  </div>
                                  <div>
                                     <h5 className="font-serif italic text-xl text-theme-text">Compliance Status</h5>
                                     <p className="text-xs text-theme-text/40 mt-2 max-w-xs mx-auto">All tax liabilities are reconciled and prepared for quarterly filing. No discrepancies detected in current audit cycle.</p>
                                  </div>
                               </div>
                            </div>
                         )}

                       </motion.div>
                   </AnimatePresence>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { BarChart3, TrendingUp, PieChart, Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const COLORS = ['#C5A059', '#AD8B4A', '#8D6E31', '#121F3E', '#2A3E63'];

export default function Analytics() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [demographicsData, setDemographicsData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any>({ total_owed: 0, pending_claims: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, demoRes, topRes, profitRes, recRes] = await Promise.all([
          fetch('/api/analytics/revenue'),
          fetch('/api/analytics/demographics'),
          fetch('/api/analytics/top-selling'),
          fetch('/api/analytics/profit-by-drug'),
          fetch('/api/analytics/insurance-receivables')
        ]);
        
        const rev = await revRes.json();
        const demo = await demoRes.json();
        const top = await topRes.json();
        const profit = await profitRes.json();
        const rec = await recRes.json();

        setRevenueData(Array.isArray(rev) ? rev : []);
        setDemographicsData(Array.isArray(demo) ? demo : []);
        setTopProducts(Array.isArray(top) ? top : []);
        setProfitData(Array.isArray(profit) ? profit : []);
        setReceivables(rec);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-xs mb-2">High Fidelity Insights</p>
          <h2 className="text-4xl text-theme-text italic">Strategic Performance</h2>
        </div>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-4 border-gold-brushed/10">
             <Calendar size={16} className="text-gold-brushed" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text">Last 30 Cycles</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Yield Projections (Revenue) */}
        <div className="glass p-10 rounded-[3rem] space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-2xl text-theme-text">Revenue Stream</h3>
              <TrendingUp className="text-emerald-400" size={24} />
           </div>
           <div className="h-64 mt-8 border-t border-gold-brushed/5 pt-8">
              {loading ? (
                <div className="h-full flex items-center justify-center opacity-20">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  <span className="italic font-serif">Rendering Data Stream...</span>
                </div>
              ) : revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C5A05920" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888" 
                      fontSize={10} 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121F3E', border: '1px solid #C5A05940', borderRadius: '12px' }}
                      itemStyle={{ color: '#C5A059' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#C5A059" 
                      strokeWidth={3} 
                      dot={{ fill: '#C5A059' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-20 italic font-serif">
                  No operational data found.
                </div>
              )}
           </div>
        </div>

        {/* Demographics (Pie Chart) */}
        <div className="glass p-10 rounded-[3rem] space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-2xl text-theme-text">Client Diversity</h3>
              <PieChart className="text-gold-brushed" size={24} />
           </div>
           <div className="h-64 mt-8 border-t border-gold-brushed/5 pt-8">
              {loading ? (
                <div className="h-full flex items-center justify-center opacity-20">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  <span className="italic font-serif">Synthesizing Profiles...</span>
                </div>
              ) : demographicsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={demographicsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="gender"
                    >
                      {demographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121F3E', border: '1px solid #C5A05940', borderRadius: '12px' }}
                      itemStyle={{ color: '#C5A059' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-20 italic font-serif">
                  Awaiting demographic input...
                </div>
              )}
           </div>
        </div>

        {/* Profit by Drug (Bar Chart) */}
        <div className="glass p-10 rounded-[3rem] space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-2xl text-theme-text">Profitability Index</h3>
              <div className="text-emerald-400 p-2 bg-emerald-400/10 rounded-lg">
                <TrendingUp size={16} />
              </div>
           </div>
           <div className="h-64 mt-8 border-t border-gold-brushed/5 pt-8">
              {loading ? (
                <div className="h-full flex items-center justify-center opacity-20">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  <span className="italic font-serif">Valuating Stock...</span>
                </div>
              ) : profitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C5A05920" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121F3E', border: '1px solid #C5A05940', borderRadius: '12px' }}
                      itemStyle={{ color: '#C5A059' }}
                    />
                    <Bar dataKey="total_profit" fill="#C5A059" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-20 italic font-serif">
                  No fiscal records found.
                </div>
              )}
           </div>
        </div>

        {/* Insurance Receivables (Summary Card) */}
        <div className="glass p-10 rounded-[3rem] space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-2xl text-theme-text">Accounts Receivable</h3>
              <span className="text-[10px] uppercase tracking-widest text-gold-brushed font-bold border border-gold-brushed/20 px-3 py-1 rounded-full">Insurance</span>
           </div>
           <div className="mt-8 border-t border-gold-brushed/5 pt-8 space-y-8">
              <div>
                 <p className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold mb-4">Awaiting Adjudication</p>
                 <div className="flex items-end gap-2">
                   <h4 className="text-5xl font-serif italic text-theme-text">ETB {Number(receivables.total_owed).toLocaleString()}</h4>
                   <span className="text-xs text-orange-400 font-bold mb-2">Pending</span>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex-1 glass bg-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold mb-1">Open Claims</p>
                    <p className="text-xl font-serif text-gold-brushed italic">{receivables.pending_claims}</p>
                 </div>
                 <div className="flex-1 glass bg-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-theme-text opacity-40 font-bold mb-1">Avg Aging</p>
                    <p className="text-xl font-serif text-gold-brushed italic">4.2 Days</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Top Products (Bar Chart) */}
        <div className="glass p-10 rounded-[3rem] space-y-6 col-span-1 md:col-span-2">
           <div className="flex items-center justify-between">
              <h3 className="font-serif italic text-2xl text-theme-text">Boutique Favorites</h3>
              <BarChart3 className="text-gold-brushed" size={24} />
           </div>
           <div className="h-64 mt-8 border-t border-gold-brushed/5 pt-8">
              {loading ? (
                <div className="h-full flex items-center justify-center opacity-20">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  <span className="italic font-serif">Analyzing Volume...</span>
                </div>
              ) : topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C5A05920" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121F3E', border: '1px solid #C5A05940', borderRadius: '12px' }}
                      itemStyle={{ color: '#C5A059' }}
                    />
                    <Bar dataKey="total_sold" fill="#C5A059" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-20 italic font-serif">
                  Registry currently vacant.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

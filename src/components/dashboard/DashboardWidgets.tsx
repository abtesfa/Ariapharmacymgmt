/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AlertTriangle, 
  TrendingUp, 
  ArrowDown, 
  CreditCard, 
  User, 
  History, 
  Truck, 
  Users, 
  Receipt,
  FileText,
  Calendar,
  Clock,
  FileSpreadsheet,
  ChevronRight,
  Shield,
  Plus,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export function InventoryAlerts({ alerts }: { alerts: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={20} /> Inventory Alerts
        </h4>
        <span className="text-[10px] uppercase tracking-widest text-gold-brushed">{alerts.length} Tasks</span>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[300px]">
        {alerts.length === 0 ? (
          <p className="text-theme-text opacity-40 text-xs text-center py-8 italic">No critical alerts detected.</p>
        ) : (
            alerts.map((item, i) => {
              const expiryDate = new Date(item.expiry_date);
              const isExpiringSoon = (expiryDate.getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days
              
              return (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-3 rounded-xl bg-white/5 border transition-all",
                  isExpiringSoon ? "border-red-500/30 bg-red-500/5 shadow-[0_0_10px_-5px_rgba(239,68,68,0.3)]" : "border-gold-brushed/5"
                )}>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-theme-text">{item.product_name}</p>
                    <p className="text-[10px] opacity-40 text-theme-text">Batch: {item.batch_number}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[10px] font-bold uppercase", item.quantity_on_hand <= 5 ? "text-red-400" : "text-orange-400")}>
                      {item.quantity_on_hand} Units
                    </p>
                    <p className={cn("text-[9px] font-bold", isExpiringSoon ? "text-red-400" : "opacity-40 text-theme-text")}>
                      Exp: {expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

export function SalesSnapshot({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 italic font-serif text-6xl text-gold-brushed">Rev</div>
        <p className="text-[10px] uppercase tracking-widest text-gold-brushed mb-2 font-bold">Today's Revenue</p>
        <h3 className="font-serif text-3xl text-theme-text italic">ETB {Number(data.today_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        <p className="text-[10px] mt-2 text-emerald-400 font-medium flex items-center gap-1">
          <TrendingUp size={10} /> Active Growth
        </p>
      </div>

      <div className="glass p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 italic font-serif text-6xl text-gold-brushed">Qty</div>
        <p className="text-[10px] uppercase tracking-widest text-gold-brushed mb-2 font-bold">Volume</p>
        <h3 className="font-serif text-3xl text-theme-text italic">{data.today_sales} Sales</h3>
        <p className="text-[10px] mt-2 opacity-50 text-theme-text">Market operations</p>
      </div>

      <div className="glass p-6 rounded-3xl relative overflow-hidden group border-orange-400/20">
        <div className="absolute top-0 right-0 p-4 opacity-5 italic font-serif text-6xl text-gold-brushed">Ref</div>
        <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-2 font-bold">Returns</p>
        <h3 className="font-serif text-3xl text-theme-text italic">ETB {Number(data.today_refunds).toLocaleString()}</h3>
        <p className="text-[10px] mt-2 text-orange-400 font-medium flex items-center gap-1">
          <ArrowDown size={10} /> Outflow
        </p>
      </div>
    </div>
  );
}

export function PendingClaims({ claims }: { claims: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <CreditCard className="text-gold-brushed" size={20} /> Pending Claims
        </h4>
      </div>
      <div className="space-y-4">
        {claims.length === 0 ? (
          <p className="text-theme-text opacity-40 text-xs text-center py-8 italic">No pending adjudications.</p>
        ) : (
          claims.map((claim, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b border-gold-brushed/5 last:border-0 hover:bg-white/5 transition-colors rounded-xl">
              <div>
                <p className="text-xs font-medium text-theme-text">{claim.insurance_provider}</p>
                <p className="text-[10px] opacity-40 text-theme-text">Ref: #{claim.claim_id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-serif italic text-gold-brushed">ETB {Number(claim.claim_amount).toLocaleString()}</p>
                <p className="text-[9px] opacity-40 text-theme-text">{new Date(claim.claim_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function VerificationQueue({ prescriptions, onVerify }: { prescriptions: any[], onVerify: (id: string) => void }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <History className="text-gold-brushed" size={20} /> Verification Queue
        </h4>
        <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">{prescriptions.length} Pending</span>
      </div>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {prescriptions.length === 0 ? (
          <p className="text-theme-text opacity-40 text-xs text-center py-8 italic">Clean queue. All verified.</p>
        ) : (
          prescriptions.map((rx, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-gold-brushed/5 rounded-2xl group hover:border-gold-brushed/30 transition-all">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-theme-text">{rx.first_name} {rx.last_name}</p>
                <p className="text-[10px] opacity-40 text-theme-text italic">Issued: {new Date(rx.issue_date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => onVerify(rx.rx_id)}
                className="px-4 py-2 bg-gold-brushed/10 text-gold-brushed text-[9px] uppercase tracking-widest font-bold rounded-lg hover:bg-gold-brushed hover:text-navy-midnight transition-all"
              >
                Verify Rx
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ProfitReport({ data }: { data: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={20} /> Profit/Drug Index
        </h4>
        <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Top Yielding</span>
      </div>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {data.length === 0 ? (
          <p className="text-theme-text opacity-40 text-xs text-center py-8 italic">No transaction data available.</p>
        ) : (
          data.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-gold-brushed/5 rounded-xl">
              <div>
                <p className="text-xs font-medium text-theme-text">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 w-24 bg-theme-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${Math.min(100, (item.total_profit / data[0].total_profit) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold text-emerald-400">ETB {Number(item.total_profit).toLocaleString()}</p>
                <p className="text-[9px] opacity-40 text-theme-text uppercase font-bold">Consolidated</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function InsuranceReceivables({ data }: { data: any }) {
  return (
    <div className="glass p-6 rounded-3xl relative overflow-hidden group border-gold-brushed/10">
      <div className="absolute top-[-10px] right-[-10px] p-6 opacity-[0.03] italic font-serif text-8xl text-gold-brushed rotate-12">Receivables</div>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-gold-brushed/10 rounded-2xl text-gold-brushed">
          <CreditCard size={20} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gold-brushed font-black opacity-60">Insurance Due</p>
          <h3 className="font-serif text-3xl text-theme-text italic">ETB {Number(data.total_owed).toLocaleString()}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
        <p className="text-[10px] uppercase tracking-widest opacity-60 text-theme-text font-bold">
          {data.pending_claims} Unsettled Adjudications
        </p>
      </div>
    </div>
  );
}

export function StaffActivity({ logs }: { logs: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <History className="text-blue-400" size={20} /> System Audit Feed
        </h4>
      </div>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="relative pl-6 py-1">
            <div className="absolute left-0 top-3 w-2 h-2 rounded-full bg-gold-brushed/30" />
            <div className="absolute left-[3px] top-5 bottom-0 w-[1px] bg-gold-brushed/10" />
            <p className="text-[10px] font-bold text-theme-text uppercase tracking-tight">
              {log.first_name} {log.last_name}
            </p>
            <p className="text-[11px] text-theme-text opacity-70 italic">{log.action} on {log.table_name}</p>
            <p className="text-[9px] opacity-30 text-theme-text mt-1">{new Date(log.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupplyChain({ orders }: { orders: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <Truck className="text-gold-brushed" size={20} /> Procurement
        </h4>
      </div>
      <div className="space-y-3">
        {orders.map((order, i) => (
          <div key={i} className="glass bg-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-gold-brushed/30 transition-all">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] uppercase tracking-widest text-gold-brushed font-medium">#{order.po_id}</span>
              <p className="text-xs text-theme-text opacity-90">{order.status}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-theme-text opacity-40">ETC: {new Date(order.expected_delivery_date).toLocaleDateString()}</p>
              <div className={`mt-1 h-1 w-16 rounded-full bg-gold-brushed/10 overflow-hidden`}>
                <div className={`h-full bg-gold-brushed ${order.status === 'In-Transit' ? 'w-2/3' : 'w-1/3'}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueChart({ history }: { history: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <TrendingUp className="text-gold-brushed" size={20} /> Revenue Velocity
        </h4>
        <span className="text-[10px] uppercase tracking-widest text-gold-brushed font-medium">Last 7 Days</span>
      </div>
      <div className="flex-1 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4AF3720" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#D4AF37', opacity: 0.5 }}
              tickFormatter={(str) => {
                const date = new Date(str);
                return date.toLocaleDateString('en-US', { weekday: 'short' });
              }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#D4AF37', opacity: 0.5 }}
              tickFormatter={(val) => `ETB ${val / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0A0A0A', 
                border: '1px solid #D4AF3720',
                borderRadius: '16px',
                fontSize: '10px',
                color: '#D4AF37'
              }}
              itemStyle={{ color: '#D4AF37' }}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#D4AF37" 
              fillOpacity={1} 
              fill="url(#colorRev)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RecentTransactions({ transactions }: { transactions: any[] }) {
  return (
    <div className="glass p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-serif italic text-lg text-theme-text flex items-center gap-2">
          <Receipt className="text-gold-brushed" size={20} /> Latest Settlements
        </h4>
        <span className="text-[10px] uppercase tracking-widest text-gold-brushed font-medium">Real-time Feed</span>
      </div>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <p className="text-theme-text opacity-40 text-xs text-center py-8 italic">No recent transactions recorded.</p>
        ) : (
          transactions.map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-gold-brushed/5 rounded-2xl hover:border-gold-brushed/30 transition-all">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-mono text-gold-brushed/60">#TX-{String(tx.transaction_id || tx.id).slice(-6).toUpperCase()}</p>
                <p className="text-[10px] opacity-60 text-theme-text uppercase tracking-widest leading-none">
                  Status: {tx.status || 'Verified'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-gold-brushed">ETB {Number(tx.final_amount || 0).toLocaleString()}</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-[9px] opacity-40 text-theme-text uppercase font-bold">{tx.payment_type || 'Cash'}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ReportsHub() {
  const navigate = useNavigate();
  
  const reportLinks = [
    { id: 'daily', label: 'Daily Sales', icon: Calendar, color: 'text-emerald-400' },
    { id: 'monthly', label: 'Monthly Revenue', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'expiry', label: 'Expiry Report', icon: Clock, color: 'text-red-400' },
    { id: 'employee', label: 'Employee Report', icon: Users, color: 'text-purple-400' },
    { id: 'tax', label: 'Tax Report', icon: FileSpreadsheet, color: 'text-gold-brushed' },
  ];

  return (
    <div className="glass p-8 rounded-[2.5rem] border-gold-brushed/10 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
         <h4 className="font-serif italic text-2xl text-theme-text flex items-center gap-3">
           <FileText className="text-gold-brushed" size={24} /> Reports
         </h4>
         <button 
           onClick={() => navigate('/dashboard/reports')}
           className="text-[10px] uppercase font-black tracking-widest text-gold-brushed/60 hover:text-gold-brushed transition-colors"
         >
           Audit Hub
         </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 flex-1">
         {reportLinks.map((report) => (
           <button
             key={report.id}
             onClick={() => navigate('/dashboard/reports')}
             className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-gold-brushed/20 hover:bg-gold-brushed/5 transition-all group"
           >
             <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-xl bg-theme-bg/50", report.color)}>
                   <report.icon size={18} />
                </div>
                <span className="text-sm font-serif italic text-theme-text group-hover:text-gold-brushed transition-colors">{report.label}</span>
             </div>
             <ChevronRight className="text-gold-brushed/20 group-hover:text-gold-brushed transition-all" size={16} />
           </button>
         ))}
      </div>
    </div>
  );
}

export function PersonnelGovernance({ employees, rolesCount, isAdmin = true }: { employees: any[], rolesCount: number, isAdmin?: boolean }) {
  const navigate = useNavigate();

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    try {
      await api.employees.updateStatus(id, !currentStatus);
    } catch (err) {
      console.error('Failed to update employee status:', err);
    }
  };

  return (
    <div className="glass p-8 rounded-[2.5rem] border-gold-brushed/10 h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h4 className="font-serif italic text-2xl text-theme-text flex items-center gap-3">
              <Shield className="text-gold-brushed" size={24} /> {isAdmin ? 'Governance' : 'Staff Directory'}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-gold-brushed font-bold opacity-60">{rolesCount} Privilege Tiers</span>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => navigate('/dashboard/employees')}
              className="bg-gold-brushed text-navy-midnight px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Full Directory
            </button>
          )}
       </div>
       
       <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
          {employees.length === 0 ? (
            <p className="text-theme-text opacity-40 text-xs text-center py-12 italic">No personnel signatures detected.</p>
          ) : (
            employees.map((staff) => (
              <div key={staff.id} className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between",
                staff.is_active ? "bg-white/5 border-white/5" : "bg-red-500/5 border-red-500/10 opacity-60"
              )}>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-brushed/10 flex items-center justify-center font-serif text-lg text-gold-brushed">
                       {staff.first_name?.[0]}
                    </div>
                    <div>
                       <p className="text-xs font-bold text-theme-text">{staff.first_name} {staff.last_name}</p>
                       <p className="text-[9px] opacity-40 uppercase tracking-widest font-bold">{staff.role_name || staff.role_id}</p>
                    </div>
                 </div>
                 
                 {isAdmin && (
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => toggleStatus(staff.id, staff.is_active)}
                         className={cn(
                           "p-1.5 rounded-lg transition-colors",
                           staff.is_active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-red-500 hover:bg-red-500/10"
                         )}
                       >
                         {staff.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                       </button>
                    </div>
                 )}
              </div>
            ))
          )}
       </div>

       {isAdmin && (
         <div className="mt-8 pt-6 border-t border-white/5">
            <button 
              onClick={() => navigate('/dashboard/employees')}
              className="w-full py-4 border border-gold-brushed/20 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-gold-brushed hover:bg-gold-brushed/5 transition-all"
            >
               <Plus size={14} /> Authorize New Personnel
            </button>
         </div>
       )}
    </div>
  );
}

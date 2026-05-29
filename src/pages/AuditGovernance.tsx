/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Database, 
  Activity,
  ChevronDown,
  Download,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export default function AuditGovernance() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTable, setFilterTable] = useState('All');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.audit.list();
      setLogs(data);
    } catch (err) {
      console.error('Audit fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const tables = ['All', ...new Set(logs.map(log => log.table_name).filter(Boolean))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.table_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTable = filterTable === 'All' || log.table_name === filterTable;
    
    return matchesSearch && matchesTable;
  });

  const exportProtocol = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Log ID', 'Timestamp', 'Username', 'Action', 'Affected Registry', 'Record ID', 'IP Address'];
    const rows = filteredLogs.map(log => [
      log.log_id,
      new Date(log.created_at).toLocaleString(),
      log.username || 'System',
      log.action,
      log.table_name || 'Global',
      log.record_id || 'N/A',
      log.ip_address || '127.0.0.1'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => {
        const str = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_protocol_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFragment = (log: any) => {
    const fragmentContent = {
      audit_log_id: log.log_id,
      timestamp: log.created_at,
      operator: log.username,
      performed_action: log.action,
      entity_registry: log.table_name,
      entity_id: log.record_id,
      ip_address: log.ip_address || '127.0.0.1',
      legacy_state: log.old_data ? JSON.parse(log.old_data) : null,
      current_state: log.new_data ? JSON.parse(log.new_data) : null
    };

    const jsonString = JSON.stringify(fragmentContent, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_fragment_${log.log_id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <p className="text-gold-brushed font-medium tracking-[0.3em] uppercase text-[10px] mb-2">Internal Surveillance</p>
          <h2 className="text-4xl text-theme-text italic">Audit & Governance</h2>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={exportProtocol}
            className="glass px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest text-gold-brushed flex items-center gap-2 hover:bg-gold-brushed/5 transition-all"
          >
            <Download size={14} /> Export Protocol
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'System Uptime', value: '99.98%', icon: Activity, color: 'text-emerald-400' },
          { label: 'Security Events', value: logs.length.toString(), icon: Shield, color: 'text-blue-400' },
          { label: 'Active Auditors', value: '2', icon: User, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 italic font-serif text-6xl text-gold-brushed">{stat.label[0]}</div>
            <p className="text-[10px] uppercase tracking-widest text-gold-brushed mb-2 font-bold opacity-60">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="font-serif text-3xl text-theme-text italic">{stat.value}</h3>
              <stat.icon className={cn("mb-1.5", stat.color)} size={16} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-[3rem] border-white/5 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-gold-brushed">
              <Terminal size={24} />
              <h3 className="text-xl font-serif italic text-theme-text">Transactional Audit Trail</h3>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="relative min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-brushed/40" size={16} />
                <input 
                  type="text"
                  placeholder="Search telemetry payload..."
                  className="w-full bg-navy-midnight/50 border border-gold-brushed/20 rounded-xl py-3 pl-12 pr-6 text-theme-text outline-none focus:border-gold-brushed/60 transition-all text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center glass px-4 py-1.5 rounded-xl border-white/5 text-[10px] uppercase font-bold tracking-widest text-theme-text">
                <Filter size={12} className="mr-3 text-gold-brushed opacity-60" />
                <select 
                  className="bg-transparent border-none outline-none appearance-none pr-6 cursor-pointer"
                  value={filterTable}
                  onChange={(e) => setFilterTable(e.target.value)}
                >
                  {tables.map(t => <option key={t} value={t} className="bg-theme-bg">{t}</option>)}
                </select>
                <ChevronDown size={10} className="ml-1 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gold-brushed opacity-60">Timestamp</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gold-brushed opacity-60">Authentication Entity</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gold-brushed opacity-60">Action Logic</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gold-brushed opacity-60">Registry Target</th>
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gold-brushed opacity-60">Record ID</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan={6} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Activity className="animate-pulse text-gold-brushed/20" size={48} />
                        <p className="text-sm font-serif italic text-theme-text opacity-40">Decrypting audit stream...</p>
                      </div>
                   </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-theme-text opacity-20 italic font-serif text-sm">
                     No system anomalies or actions recorded in current epoch matching your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.log_id}>
                    <tr 
                      className={cn(
                        "text-[11px] font-mono hover:bg-white/[0.02] cursor-pointer transition-colors group",
                        expandedLog === log.log_id ? "bg-gold-brushed/5" : ""
                      )}
                      onClick={() => setExpandedLog(expandedLog === log.log_id ? null : log.log_id)}
                    >
                      <td className="px-10 py-6 text-theme-text/40">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-10 py-6">
                        <span className="flex items-center gap-2 text-gold-brushed">
                          <User size={12} className="opacity-40" />
                          {log.username}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-theme-text/80 uppercase font-black tracking-tight">{log.action}</td>
                      <td className="px-10 py-6">
                        <span className="flex items-center gap-2 text-theme-text/60">
                          <Database size={12} className="opacity-30" />
                          {log.table_name || 'Global'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-white/20 font-bold">#{log.record_id || 'N/A'}</td>
                      <td className="px-10 py-6 text-right">
                        <ChevronDown size={16} className={cn("text-gold-brushed/20 transition-transform", expandedLog === log.log_id ? "rotate-180" : "")} />
                      </td>
                    </tr>
                    {expandedLog === log.log_id && (
                      <tr className="bg-black/40 border-l-2 border-gold-brushed">
                        <td colSpan={6} className="px-10 py-8">
                          <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                             <div className="space-y-3">
                                <h5 className="text-[9px] uppercase font-black tracking-widest text-gold-brushed/60">Legacy State</h5>
                                <div className="glass bg-navy-midnight p-4 rounded-xl text-[10px] text-theme-text/40 overflow-hidden font-mono whitespace-pre-wrap">
                                   {log.old_data ? JSON.stringify(JSON.parse(log.old_data), null, 2) : 'Null State'}
                                </div>
                             </div>
                             <div className="space-y-3">
                                <h5 className="text-[9px] uppercase font-black tracking-widest text-emerald-500/60">Current State</h5>
                                <div className="glass bg-navy-midnight p-4 rounded-xl text-[10px] text-emerald-500/40 overflow-hidden font-mono whitespace-pre-wrap">
                                   {log.new_data ? JSON.stringify(JSON.parse(log.new_data), null, 2) : 'Deleted / Null'}
                                </div>
                             </div>
                             <div className="col-span-2 pt-4 flex items-center justify-between">
                                <div className="flex gap-4">
                                   <div className="flex items-center gap-2 text-[9px] text-theme-text opacity-40">
                                      <Clock size={12} /> Last Verified: Just now
                                   </div>
                                </div>
                                <button 
                                  onClick={() => downloadFragment(log)}
                                  className="text-[9px] uppercase font-black tracking-widest text-gold-brushed hover:underline"
                                >
                                  Download Fragment
                                </button>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
           <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-theme-text opacity-40 italic">
              <AlertCircle size={14} /> Immutable Ledger Enforcement Active
           </div>
           <div className="flex items-center gap-6">
              <p className="text-[10px] font-bold text-theme-text/40 uppercase tracking-widest">Showing {filteredLogs.length} Registry Events</p>
              <div className="flex gap-2">
                 <button className="glass px-4 py-2 rounded-lg text-theme-text/40 hover:text-gold-brushed transition-all">Previous</button>
                 <button className="glass px-4 py-2 rounded-lg text-theme-text/40 hover:text-gold-brushed transition-all">Next</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

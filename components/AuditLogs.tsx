import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface LogItem {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  userName: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.activityLogs.list();
      setLogs(data);
    } catch (e) {
      console.error("Failed to load audit logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const base = "text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ";
    switch (action) {
      case 'CREATE_PROJECT':
      case 'CREATE_TASK':
        return base + "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'UPDATE_PROJECT':
      case 'UPDATE_TASK':
      case 'UPDATE_TASK_STATUS':
        return base + "bg-blue-50 text-blue-600 border-blue-100";
      case 'DELETE_PROJECT':
      case 'DELETE_TASK':
        return base + "bg-rose-50 text-rose-600 border-rose-100";
      case 'ADD_COMMENT':
        return base + "bg-indigo-50 text-indigo-600 border-indigo-100";
      default:
        return base + "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Security Audit Trail</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Activity & Modification Registry</p>
        </div>
        
        <button onClick={fetchLogs} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"/></svg>
        </button>
      </div>

      {/* Logs Card */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden p-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold uppercase mt-4">Reading Audit Stream...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs font-black uppercase tracking-widest">
            No activity records found
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-my-6 divide-y divide-slate-100">
              {logs.map((log) => (
                <li key={log.id} className="py-6 flex items-start gap-4">
                  {/* Action Badge */}
                  <div className="min-w-[120px] pt-1">
                    <span className={getActionBadge(log.action)}>{log.action.replace('_', ' ')}</span>
                  </div>
                  
                  {/* Activity Details */}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-900 leading-snug">{log.details}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      <span>By {log.userName}</span>
                      <span>&bull;</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

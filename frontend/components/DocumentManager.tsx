
import React from 'react';
import { Project } from '../types';

interface DocumentManagerProps {
  projects: Project[];
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ projects }) => {
  const allLinks = projects.flatMap(p => 
    Object.entries(p.links || {}).map(([key, url]) => ({
      projectName: p.name,
      type: key,
      url: url as string
    }))
  ).filter(link => link.url);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Knowledge Base</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Centralized Project Assets & Documentation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm">
             <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-black"></span>
               Project Links
             </h4>
             
             {allLinks.length === 0 ? (
               <div className="text-center py-20">
                 <p className="text-sm font-bold text-slate-400">No project links detected.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {allLinks.map((link, i) => (
                   <a 
                     key={i} 
                     href={link.url} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center justify-between p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:scale-[1.01] transition-all group overflow-hidden"
                   >
                     <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-[10px] uppercase">
                          {link.type.charAt(0)}
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-black text-slate-900 truncate">{link.projectName}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{link.type}</p>
                        </div>
                     </div>
                     <svg className="w-5 h-5 text-slate-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                     </svg>
                   </a>
                 ))}
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black text-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
             <h4 className="text-xl font-black mb-6">Internal Docs</h4>
             <ul className="space-y-6">
                <li className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand Guidelines</p>
                   <p className="text-sm font-bold opacity-80 cursor-pointer hover:opacity-100 transition-opacity underline">View Redmind Style Guide v2.0</p>
                </li>
                <li className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workflow Protocol</p>
                   <p className="text-sm font-bold opacity-80 cursor-pointer hover:opacity-100 transition-opacity underline">Development & Review Standards</p>
                </li>
                <li className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Onboarding</p>
                   <p className="text-sm font-bold opacity-80 cursor-pointer hover:opacity-100 transition-opacity underline">Team Integration Handbook</p>
                </li>
             </ul>
          </div>
          
          <div className="bg-emerald-50 rounded-[2.5rem] p-10 border border-emerald-100">
             <h4 className="text-xl font-black text-emerald-900 mb-4">Storage Tip</h4>
             <p className="text-sm font-bold text-emerald-700 leading-relaxed">Centralizing your links here ensures the whole team stays synced without messy Slack threads or emails.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;

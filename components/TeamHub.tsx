
import React from 'react';
import { User, Task, TaskStatus, UserRole } from '../types';

interface TeamHubProps {
  members: User[];
  tasks: Task[];
  isAdmin: boolean;
}

const TeamHub: React.FC<TeamHubProps> = ({ members, tasks, isAdmin }) => {
  const getMemberPerformance = (userId: string) => {
    const memberTasks = tasks.filter(t => t.assignedTo === userId);
    const completed = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = memberTasks.length;
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Team Hub</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Operational Capacity & Talent Directory</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Delta</p>
              <p className="text-xl font-black text-emerald-500">+12.5%</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => {
          const stats = getMemberPerformance(member.id);
          return (
            <div key={member.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
               {/* Performance Background Bar */}
               <div className="absolute bottom-0 left-0 h-1 bg-slate-50 w-full">
                  <div className="h-full bg-black transition-all duration-1000" style={{ width: `${stats.percent}%` }}></div>
               </div>

               <div className="flex items-start justify-between mb-8">
                  <div className="relative">
                     <img 
                       src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} 
                       className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-slate-50"
                       alt={member.name}
                     />
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                     <p className="text-2xl font-black text-slate-900">{stats.percent}%</p>
                  </div>
               </div>

               <div className="space-y-1 min-w-0">
                  <h4 className="text-lg font-black text-slate-900 truncate">{member.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{member.role === UserRole.LEAD ? 'Strategic Lead' : 'Execution Specialist'}</p>
               </div>

               <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</p>
                     <p className="text-sm font-bold text-slate-900">{stats.total - stats.completed}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestones</p>
                     <p className="text-sm font-bold text-slate-900">{stats.completed}</p>
                  </div>
               </div>

               {isAdmin && (
                 <button className="w-full mt-6 py-3 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                   View Analytics
                 </button>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamHub;

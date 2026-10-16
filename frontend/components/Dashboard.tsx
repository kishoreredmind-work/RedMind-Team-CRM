
import React from 'react';
import { Client, Project, Task, ProjectStatus, TaskStatus, TaskPriority, User, UserRole, UserStatus } from '../types';
import { api } from '../services/api';
import WorkDayTracker from './WorkDayTracker';
import { getDaysRemaining } from '../services/workDays';

interface DashboardProps {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  onNavigate: (tab: string, id?: string) => void;
  teamMembers: User[];
  refreshAll?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, projects, tasks, onNavigate, teamMembers, refreshAll }) => {
  const [localTeam, setLocalTeam] = React.useState<User[]>(teamMembers);

  React.useEffect(() => {
    setLocalTeam(teamMembers);
  }, [teamMembers]);

  const activeProjects = projects.filter(p => p.status !== ProjectStatus.COMPLETED);
  const completedProjectsCount = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
  
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  // Critical deadlines (less than 7 days remaining)
  const criticalProjects = activeProjects.filter(p => getDaysRemaining(p.deadline) <= 7);

  // Calculate team workload (only for approved members)
  const approvedMembers = localTeam.filter(m => m.status === UserStatus.APPROVED);
  const pendingMembers = localTeam.filter(m => m.status === UserStatus.PENDING);

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusUpdate = async (userId: string, status: UserStatus) => {
    setUpdatingId(userId);
    try {
      await api.team.updateStatus(userId, status);
      setLocalTeam(prev => prev.map(m => m.id === userId ? { ...m, status } : m));
      refreshAll?.();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Permission Denied: Database rules prevented this update. Please ensure your Lead role is active.");
    } finally {
      setUpdatingId(null);
    }
  };

  const teamWorkload = approvedMembers.map(member => {
    const memberProjects = projects.filter(p => p.assignedMemberIds.includes(member.id));
    const memberTasks = tasks.filter(t => t.assignedTo === member.id && t.status !== TaskStatus.DONE);
    return {
      ...member,
      projectCount: memberProjects.length,
      taskCount: memberTasks.length
    };
  });

  return (
    <div className="space-y-10 max-w-[1400px] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* 1. TOP STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Scorecard */}
        <div className="lg:col-span-8 bg-[#0B0B0B] text-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/10 transition-colors"></div>
          
          <div className="flex justify-between items-start relative z-10 mb-12">
            <div>
              <h3 className="text-xl font-bold opacity-60 uppercase tracking-[0.3em] text-[10px]">Lead Perspective</h3>
              <p className="text-2xl font-black mt-1">Operational Health</p>
            </div>
            <div className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Live Metrics</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 relative z-10">
            <div>
              <div className="text-4xl md:text-6xl font-black tabular-nums">{activeProjects.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-black leading-tight">Active Projects</div>
            </div>
            <div className="cursor-pointer group/stat" onClick={() => onNavigate('tasks')}>
              <div className="text-4xl md:text-6xl font-black tabular-nums group-hover/stat:text-emerald-400 transition-colors">{completedTasksCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-black leading-tight">Tasks Archived</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-black tabular-nums text-emerald-400">{progressPercent}%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-black leading-tight">Execution Flow</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-black tabular-nums text-red-500">{criticalProjects.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-black leading-tight">Alert Threshold</div>
            </div>
          </div>

          <div className="mt-14 relative z-10">
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
               <div className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{width: `${progressPercent}%`}}></div>
            </div>
          </div>
        </div>

        {/* Weekly Velocity / Pulse (Re-styled) */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">System Pulse</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efficiency Delta</p>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-3 min-h-[160px] pb-4">
             {[40, 65, 30, 85, 45, 90, 20].map((v, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="w-full bg-slate-50 rounded-2xl relative transition-all duration-500 group-hover:bg-black group-hover:scale-x-110 overflow-hidden" style={{height: `${v}%`}}>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase">{"MTWTFSS"[i]}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* 2. CRITICAL ALERTS & TEAM WORKLOAD */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Deadline Alerts */}
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Priority Deadlines</h3>
          </div>
          
          <div className="space-y-4">
            {criticalProjects.length === 0 && (
              <div className="p-10 bg-slate-50 rounded-[2rem] text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Critical Deadlines Detected</p>
              </div>
            )}
            {criticalProjects.map(proj => (
              <div 
                key={proj.id} 
                className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-2xl transition-all group flex flex-col justify-between cursor-pointer" 
                onClick={() => onNavigate('projects', proj.id)}
              >
                <div>
                  <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{proj.name}</h4>
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-1">Exiting Operational Window</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-red-600">{getDaysRemaining(proj.deadline)}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Days Left</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Workload Overview */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Team Activation Pulse</h3>
            {pendingMembers.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse uppercase tracking-widest">
                {pendingMembers.length} Request{pendingMembers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Pending Approvals */}
          {pendingMembers.length > 0 && (
            <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 space-y-4">
               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Pending Registrations</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {pendingMembers.map(member => (
                   <div key={member.id} className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                           {member.name.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">New Member</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                          <button 
                            disabled={updatingId === member.id}
                            onClick={() => handleStatusUpdate(member.id, UserStatus.APPROVED)}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                          >
                            {updatingId === member.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                            )}
                          </button>
                          <button 
                            disabled={updatingId === member.id}
                            onClick={() => handleStatusUpdate(member.id, UserStatus.REJECTED)}
                            className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:scale-110 transition-transform disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamWorkload.filter(m => m.role !== UserRole.LEAD).map(member => (
              <div 
                key={member.id} 
                className="bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center justify-between hover:shadow-xl transition-all group cursor-pointer"
                onClick={() => onNavigate('hub')}
              >
                <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt="avatar" />
                <div className="flex-1 min-w-0 ml-4">
                  <h4 className="font-bold text-slate-900 truncate">{member.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{member.projectCount} Projects</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{member.taskCount} Tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PROJECT LIFECYCLE TABLE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Lifecycle Overview</h3>
          <button onClick={() => onNavigate('projects')} className="text-[10px] font-black text-slate-400 hover:text-black uppercase tracking-[0.2em] transition-colors">See All Projects →</button>
        </div>
        
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-slate-50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Health</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {activeProjects.slice(0, 5).map(proj => (
                   <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-6">
                        <div className="font-bold text-slate-900">{proj.name}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{clients.find(c => c.id === proj.clientId)?.company || 'Internal'}</div>
                     </td>
                     <td className="px-8 py-6 min-w-[300px]">
                        <WorkDayTracker startDate={proj.startDate} endDate={proj.deadline} />
                     </td>
                     <td className="px-8 py-6 text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          proj.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState } from 'react';
import { Client, Project, Task, ProjectStatus, TaskStatus, TaskPriority, User, WorkLog } from '../types';
import WorkDayTracker from './WorkDayTracker';
import { api } from '../services/api';

interface MemberDashboardProps {
  currentUser: User;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  onNavigate: (tab: string) => void;
  refreshTasks: () => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ currentUser, clients, projects, tasks, onNavigate, refreshTasks }) => {
  const myProjects = projects.filter(p => p.assignedMemberIds.includes(currentUser.id));
  const myPendingTasks = tasks.filter(t => t.assignedTo === currentUser.id && t.status !== TaskStatus.DONE);
  
  const [logFormData, setLogFormData] = useState({ taskId: '', hours: 0, description: '' });
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logFormData.taskId || !logFormData.description) return;
    
    setIsLogging(true);
    try {
      await api.workLogs.save({
        taskId: logFormData.taskId,
        memberId: currentUser.id,
        logDate: new Date().toISOString().split('T')[0],
        hours: Number(logFormData.hours),
        description: logFormData.description
      });
      setLogFormData({ taskId: '', hours: 0, description: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      refreshTasks();
    } catch (error) {
      console.error("Log failed", error);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-10 max-w-[1400px] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* 1. WELCOME & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 group">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[1.8rem] bg-black flex items-center justify-center text-white text-3xl font-black shadow-2xl group-hover:scale-105 transition-transform">
               {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Your High Score</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Personal Allocation Summary</p>
            </div>
          </div>
          
          <div className="flex items-center gap-12 text-center md:text-left">
            <div>
              <div className="text-4xl md:text-5xl font-black text-slate-900">{myProjects.length}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Assigned Projects</div>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-orange-500">{myPendingTasks.length}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Segments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* 2. MY ACTIVE PROJECTS */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Strategy Window</h3>
            <button onClick={() => onNavigate('projects')} className="text-[10px] font-black text-slate-400 hover:text-black uppercase tracking-[0.2em]">Full Project Hub →</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myProjects.length === 0 && (
              <div className="col-span-full p-12 bg-slate-50 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Projects Allocated to You Yet</p>
              </div>
            )}
            {myProjects.map(proj => {
              const client = clients.find(c => c.id === proj.clientId);
              return (
                <div 
                  key={proj.id} 
                  className="bg-white p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:shadow-2xl transition-all h-full flex flex-col justify-between cursor-pointer group"
                  onClick={() => onNavigate('projects', proj.id)}
                >
                  <div className="mb-6">
                     <h4 className="font-bold text-slate-900 text-lg mb-1">{proj.name}</h4>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">{client?.company || 'Direct Entity'}</p>
                     <WorkDayTracker startDate={proj.startDate} endDate={proj.deadline} />
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <button onClick={(e) => { e.stopPropagation(); onNavigate('tasks', proj.id); }} className="text-[10px] font-black text-slate-400 group-hover:text-black uppercase tracking-[0.2em] transition-colors">View Tasks →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. QUICK LOG + MY TASKS */}
        <div className="xl:col-span-5 space-y-8">
          {/* Quick Work Log */}
          <div className="bg-[#0B0B0B] text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-xl font-black tracking-tight mb-8">Synchronize Today's Work</h3>
            
            <form onSubmit={handleQuickLog} className="space-y-4">
              <select 
                required
                value={logFormData.taskId} 
                onChange={e => setLogFormData({...logFormData, taskId: e.target.value})}
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:bg-white/20 transition-all appearance-none text-white"
              >
                <option value="" className="text-slate-900">Assigned Task Segment...</option>
                {myPendingTasks.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.title}</option>)}
              </select>
              <div className="grid grid-cols-1 gap-4">
                <input 
                  required
                  type="number" 
                  step="0.5" 
                  placeholder="Total Hours Allocation"
                  value={logFormData.hours || ''}
                  onChange={e => setLogFormData({...logFormData, hours: Number(e.target.value)})}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:bg-white/20 transition-all text-white" 
                />
              </div>
              <textarea 
                required
                placeholder="What objective did you accomplish?"
                value={logFormData.description}
                onChange={e => setLogFormData({...logFormData, description: e.target.value})}
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:bg-white/20 transition-all resize-none text-white" 
                rows={3} 
              />
              <button 
                type="submit" 
                disabled={isLogging}
                className={`w-full font-black py-4 rounded-full text-xs uppercase tracking-widest transition-all shadow-xl ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-white/5'} disabled:bg-slate-600`}
              >
                {isLogging ? 'Transmitting...' : showSuccess ? 'Deployment Recorded ✓' : 'Record Deployment'}
              </button>
            </form>
          </div>
          
          {/* My Tasks List */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight px-2">High Priority Segments</h3>
            <div className="space-y-3">
              {myPendingTasks.slice(0, 4).map(task => (
                <div key={task.id} className="bg-white p-5 rounded-[1.8rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all cursor-pointer" onClick={() => onNavigate('tasks')}>
                   <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${task.priority === TaskPriority.URGENT ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{projects.find(p => p.id === task.projectId)?.name || 'Generic'}</p>
                      </div>
                   </div>
                   <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 group-hover:bg-black group-hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                   </div>
                </div>
              ))}
              {myPendingTasks.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-[2rem] text-xs font-bold text-slate-400 uppercase tracking-widest">No Pending Tasks</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;

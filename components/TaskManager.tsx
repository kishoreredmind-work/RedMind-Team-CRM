
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, Project, TaskStatus, TaskPriority, User, UserRole } from '../types';
import { api } from '../services/api';
import WorkLogModal from './WorkLogModal';

interface TaskManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  isAdmin: boolean;
  currentUserId: string;
  teamMembers: User[];
  creationTrigger?: boolean;
  selectedId?: string | null;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, setTasks, projects, isAdmin, currentUserId, teamMembers, creationTrigger, selectedId }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [formData, setFormData] = useState({ 
    title: '', 
    projectId: '', 
    status: TaskStatus.TO_DO, 
    priority: TaskPriority.MEDIUM,
    assignedTo: '' 
  });

  // React to triggers
  useEffect(() => {
    if (creationTrigger) {
      setFormData({ title: '', projectId: '', status: TaskStatus.TO_DO, priority: TaskPriority.MEDIUM, assignedTo: '' });
      setShowModal(true);
    }
  }, [creationTrigger]);

  useEffect(() => {
    if (selectedId) {
      // If we come from a project card, filter for that project
      setSelectedProjectId(selectedId);
    }
  }, [selectedId]);
  
  const [activeWorkLogTask, setActiveWorkLogTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get relevant projects for the user
  const relevantProjects = projects.filter(p => isAdmin || p.assignedMemberIds.includes(currentUserId));
  const projectIds = relevantProjects.map(p => p.id);

  const filteredTasks = tasks.filter(t => {
    const isProjectMatch = selectedProjectId === 'all' ? projectIds.includes(t.projectId) : t.projectId === selectedProjectId;
    const isUserMatch = isAdmin || t.assignedTo === currentUserId || projectIds.includes(t.projectId);
    return isProjectMatch && isUserMatch;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newTaskData: Partial<Task> = {
        ...formData,
        assignedTo: formData.assignedTo || currentUserId
      };
      const newTask = await api.tasks.save(newTaskData);
      setTasks(prev => [newTask, ...prev]);
      setShowModal(false);
      setFormData({ title: '', projectId: '', status: TaskStatus.TO_DO, priority: TaskPriority.MEDIUM, assignedTo: '' });
    } catch (error) {
      console.error("Task save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    try {
      await api.tasks.save({ ...task, ...updates });
    } catch (error) {
      console.error("Task update failed", error);
      // Revert if failed
      setTasks(prev => prev.map(t => t.id === id ? task : t));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1400px] pb-10">
      
      {/* 1. HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div>
           <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Workload Synchronizer</h3>
           <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Operational Segment Management</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flex-1 md:flex-none px-6 py-3 rounded-full bg-white border border-slate-100 text-xs font-bold font-black uppercase tracking-widest outline-none shadow-sm appearance-none"
          >
            <option value="all">All Active Streams</option>
            {relevantProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <button onClick={() => setShowModal(true)} className="flex-1 md:flex-none bg-black text-white px-8 py-3.5 rounded-full hover:scale-105 transition-all font-black shadow-2xl text-xs uppercase tracking-widest">
            + Allocation Segment
          </button>
        </div>
      </div>

      {/* 2. KANBAN BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {Object.values(TaskStatus).map(columnStatus => {
          const statusTasks = filteredTasks.filter(t => t.status === columnStatus);
          return (
            <div key={columnStatus} className="space-y-6">
              <div className="px-6 flex justify-between items-center bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{columnStatus}</h4>
                <div className="text-[10px] font-black text-slate-900 bg-white border border-slate-100 w-6 h-6 flex items-center justify-center rounded-full shadow-sm">{statusTasks.length}</div>
              </div>
              
              <div className="space-y-6 min-h-[500px]">
                {statusTasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <div key={task.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-2">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-black group-hover:text-white transition-all">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-widest ${
                             task.priority === TaskPriority.URGENT ? 'bg-red-50 text-red-600 border-red-100' : 
                             task.priority === TaskPriority.HIGH ? 'bg-orange-50 text-orange-600 border-orange-100' :
                             'bg-slate-50 text-slate-400 border-slate-200'
                           }`}>
                             {task.priority}
                           </span>
                           <button onClick={() => setActiveWorkLogTask(task)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-300 hover:text-black">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                           </button>
                        </div>
                      </div>
                      
                      <h4 className="font-black text-slate-900 mb-2 leading-tight pr-6">{task.title}</h4>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        {project?.name || 'GENERIC SEGMENT'}
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                         <div className="flex items-center gap-4">
                           <select 
                             value={task.status} 
                             onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                             className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer hover:text-black transition-all appearance-none"
                           >
                             {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                           <span className="w-px h-3 bg-slate-100"></span>
                           <select 
                             value={task.priority} 
                             onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                             className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer hover:text-black transition-all appearance-none"
                           >
                             {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                         </div>
                         <button 
                            onClick={() => setActiveWorkLogTask(task)}
                            className="text-[9px] font-black text-slate-400 group-hover:text-black uppercase tracking-widest flex items-center gap-1.5"
                         >
                            Logs
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
                         </button>
                      </div>

                      <div 
                        onClick={() => updateTask(task.id, { status: task.status === TaskStatus.DONE ? TaskStatus.TO_DO : TaskStatus.DONE })}
                        className={`absolute bottom-6 right-8 w-14 h-14 rounded-2xl rounded-tl-[1.8rem] flex items-center justify-center shadow-2xl transition-all cursor-pointer ${task.status === TaskStatus.DONE ? 'bg-emerald-500 scale-100' : 'bg-black group-hover:bg-black group-hover:scale-110'}`}
                      >
                         <svg className={`w-6 h-6 text-white transition-opacity ${task.status === TaskStatus.DONE ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    </div>
                  );
                })}
                <button 
                  onClick={() => {setFormData({...formData, status: columnStatus}); setShowModal(true)}}
                  className="w-full border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center p-12 text-slate-400 font-extrabold text-[10px] hover:border-black hover:text-black transition-all bg-white/30 group"
                >
                  <span className="group-hover:scale-110 transition-transform tracking-[0.3em]">+ ADD SEGMENT</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MODALS */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-12 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Allocate Work Segment</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure individual operational objectives</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Segment Title</label>
                <input required placeholder="Deployment Objective..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Stream</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white font-bold text-xs appearance-none">
                    <option value="">Select Project...</option>
                    {relevantProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Matrix</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})} className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white font-bold text-xs appearance-none">
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-6 mt-12">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 text-sm font-black text-slate-400 hover:text-black transition-colors">Discard</button>
                <button disabled={isSaving} type="submit" className="px-12 py-4 text-sm font-black text-white bg-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  {isSaving ? 'Synching...' : 'Commit Segment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {activeWorkLogTask && (
        <WorkLogModal 
          task={activeWorkLogTask} 
          onClose={() => setActiveWorkLogTask(null)} 
          currentUser={{ id: currentUserId, name: 'User', avatar: '', role: isAdmin ? UserRole.LEAD : UserRole.TEAM_MEMBER }} 
        />
      )}
    </div>
  );
};

export default TaskManager;

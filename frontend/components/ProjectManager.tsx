
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, Client, User, ProjectStatus, ProjectLinks } from '../types';
import WorkDayTracker from './WorkDayTracker';
import { calculateWorkingDays } from '../services/workDays';
import { api } from '../services/api';

interface ProjectManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  teamMembers: User[];
  isAdmin: boolean;
  currentUserId: string;
  creationTrigger?: boolean;
  selectedId?: string | null;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, setProjects, clients, teamMembers, isAdmin, currentUserId, creationTrigger, selectedId }) => {
  const [showModal, setShowModal] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  
  // React to external triggers
  React.useEffect(() => {
    if (creationTrigger) {
      resetForm();
      setShowModal(true);
    }
  }, [creationTrigger]);

  React.useEffect(() => {
    if (selectedId) {
      setHighlightId(selectedId);
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedId]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [categoryTab, setCategoryTab] = useState<'all' | 'website' | 'graphic'>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    clientId: '', 
    status: ProjectStatus.NEW, 
    startDate: new Date().toISOString().split('T')[0],
    deadline: '', 
    assignedMemberIds: [] as string[],
    figma: '',
    live: '',
    googleDoc: '',
    googleSheet: ''
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '',
      clientId: '', 
      status: ProjectStatus.NEW, 
      startDate: new Date().toISOString().split('T')[0],
      deadline: '', 
      assignedMemberIds: [], 
      figma: '', 
      live: '', 
      googleDoc: '', 
      googleSheet: '' 
    });
    setEditingProject(null);
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const projectLinks: ProjectLinks = {
      figma: formData.figma || undefined,
      live: formData.live || undefined,
      googleDoc: formData.googleDoc || undefined,
      googleSheet: formData.googleSheet || undefined
    };

    const workingDays = calculateWorkingDays(formData.startDate, formData.deadline);

    const projectData: Partial<Project> = {
      id: editingProject?.id,
      name: formData.name,
      description: formData.description,
      clientId: formData.clientId,
      status: formData.status,
      startDate: formData.startDate,
      deadline: formData.deadline,
      workingDays,
      links: projectLinks
    };

    try {
      const savedProject = await api.projects.save(projectData, formData.assignedMemberIds);
      
      if (editingProject) {
        setProjects(prev => prev.map(p => p.id === editingProject.id ? savedProject : p));
      } else {
        setProjects(prev => [savedProject, ...prev]);
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save project. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (proj: Project) => {
    setEditingProject(proj);
    setFormData({ 
      name: proj.name, 
      description: proj.description || '',
      clientId: proj.clientId, 
      status: proj.status, 
      startDate: proj.startDate,
      deadline: proj.deadline, 
      assignedMemberIds: proj.assignedMemberIds,
      figma: proj.links?.figma || '',
      live: proj.links?.live || '',
      googleDoc: proj.links?.googleDoc || '',
      googleSheet: proj.links?.googleSheet || ''
    });
    setShowModal(true);
  };

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedMemberIds: prev.assignedMemberIds.includes(memberId)
        ? prev.assignedMemberIds.filter(id => id !== memberId)
        : [...prev.assignedMemberIds, memberId]
    }));
  };
  const handleDeleteProject = async (id: string) => {
    try {
      await api.projects.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete project.");
    }
  };

  const displayedProjects = isAdmin 
    ? projects 
    : projects.filter(p => p.assignedMemberIds.includes(currentUserId));

  // 1. Filter by category tabs
  const filteredByCategory = displayedProjects.filter(p => {
    if (categoryTab === 'all') return true;
    const desc = (p.description || '').toLowerCase();
    if (categoryTab === 'website') {
      return desc.includes('type: website') || desc.includes('type: dynamic website') || desc.includes('e-commerce') || p.links?.live !== undefined;
    }
    if (categoryTab === 'graphic') {
      return (desc.includes('service(s)') || desc.includes('graphic design') || desc.includes('logo') || desc.includes('brochure') || desc.includes('label')) && !desc.includes('ai project');
    }
    return true;
  });

  // 2. Sort by: In Progress (1st), New (2nd), Completed (3rd), then by most recent ID descending
  const sortedProjects = [...filteredByCategory].sort((a, b) => {
    const statusPriority = (status: ProjectStatus) => {
      switch (status) {
        case ProjectStatus.IN_PROGRESS: return 1;
        case ProjectStatus.NEW: return 2;
        case ProjectStatus.COMPLETED: return 3;
        default: return 4;
      }
    };
    
    const priorityA = statusPriority(a.status);
    const priorityB = statusPriority(b.status);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1400px]">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Project Hub</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Lifecycle Management</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-black text-white px-8 py-3 rounded-full hover:scale-105 transition-all font-bold shadow-lg text-sm">
            + Initiate Project
          </button>
        )}
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5 bg-slate-50 p-2 rounded-[1.8rem] border border-slate-100 max-w-fit overflow-x-auto">
        <button 
          onClick={() => setCategoryTab('all')} 
          className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${categoryTab === 'all' ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:text-black hover:bg-slate-100/50'}`}
        >
          All Streams
        </button>
        <button 
          onClick={() => setCategoryTab('website')} 
          className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${categoryTab === 'website' ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:text-black hover:bg-slate-100/50'}`}
        >
          Website Projects
        </button>
        <button 
          onClick={() => setCategoryTab('graphic')} 
          className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${categoryTab === 'graphic' ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:text-black hover:bg-slate-100/50'}`}
        >
          Graphic Designs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {sortedProjects.map(proj => {
          const client = clients.find(c => c.id === proj.clientId);
          return (
            <div 
              key={proj.id} 
              id={`project-${proj.id}`}
              className={`bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between hover:shadow-2xl transition-all border ${highlightId === proj.id ? 'border-black ring-4 ring-black/5 scale-[1.02]' : 'border-slate-100'} group`}
            >
               <div className="mb-8">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest border ${
                      proj.status === ProjectStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      proj.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {proj.status}
                    </span>
                    <div className="flex gap-2">
                       {proj.links?.googleDoc && <a href={proj.links.googleDoc} target="_blank" className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></a>}
                       {proj.links?.figma && <a href={proj.links.figma} target="_blank" className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-purple-600 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 11c-.827 0-1.5-.673-1.5-1.5s.673-1.5 1.5-1.5 1.5.673 1.5 1.5-.673 1.5-1.5 1.5z"/></svg></a>}
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-900 mb-1">{proj.name}</h4>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-4">{client?.company || 'Internal Project'}</p>
                  
                  {proj.description && (
                    <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      {proj.description.split('. Notes')[0].replace('Type: ', '').replace('Service(s): ', '').trim()}
                    </p>
                  )}
                  
                  <WorkDayTracker startDate={proj.startDate} endDate={proj.deadline} />
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-3 overflow-hidden">
                    {proj.assignedMemberIds.map(mId => {
                      const member = teamMembers.find(m => m.id === mId);
                      return (
                        <img 
                          key={mId}
                          className="inline-block h-8 w-8 rounded-full ring-4 ring-white object-cover" 
                          src={member?.avatar || `https://ui-avatars.com/api/?name=${member?.name || 'User'}`} 
                          title={member?.name}
                          alt="member"
                        />
                      );
                    })}
                    {proj.assignedMemberIds.length === 0 && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unassigned</span>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2.5">
                      <button onClick={() => openEdit(proj)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all" title="Edit Project">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => setConfirmDelete({ id: proj.id, name: proj.name })} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all" title="Delete Project">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
               </div>
            </div>
          )
        })}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl p-10 animate-in fade-in zoom-in duration-300 text-black max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Project Configuration</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Setup parameters and team access</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddOrEdit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                <input required placeholder="Project Title" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all" />
              </div>

              <div className="col-span-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Objective</label>
                <textarea rows={3} placeholder="Describe the project goal..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm resize-none" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Timeline</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white font-bold text-xs" />
                    <input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white font-bold text-xs" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})} className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white font-bold text-xs appearance-none">
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Association</label>
                  <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 outline-none focus:bg-white font-bold text-xs appearance-none">
                    <option value="">Select Domain/Client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Assignments</label>
                  <div className="bg-slate-50 rounded-[1.5rem] border border-slate-100 p-4 space-y-2 max-h-[200px] overflow-y-auto">
                    {teamMembers.map(member => (
                      <label key={member.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.assignedMemberIds.includes(member.id)} 
                          onChange={() => toggleMember(member.id)}
                          className="w-4 h-4 rounded text-black focus:ring-black border-slate-300" 
                        />
                        <div className="flex items-center gap-2">
                          <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} className="w-6 h-6 rounded-lg object-cover" alt="avatar" />
                          <span className="text-xs font-bold text-slate-700">{member.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-full grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Doc</label>
                  <input placeholder="Links..." value={formData.googleDoc} onChange={e => setFormData({...formData, googleDoc: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold outline-none focus:bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Figma Link</label>
                  <input placeholder="Links..." value={formData.figma} onChange={e => setFormData({...formData, figma: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold outline-none focus:bg-white" />
                </div>
              </div>

              <div className="col-span-full flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-black transition-colors">Discard</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-12 py-4 text-sm font-black text-white bg-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:bg-slate-400 disabled:scale-100"
                >
                  {isSaving ? 'Synchronizing...' : 'Deploy Project'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in fade-in zoom-in duration-300 text-black">
            <h3 className="text-2xl font-black tracking-tight mb-2 text-rose-600">Delete Project</h3>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to delete <span className="text-black font-black">"{confirmDelete.name}"</span>? This action is permanent and will clear all project allocations, task listings, and member associations.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDelete(null)} 
                className="flex-1 py-4 bg-slate-100 rounded-full font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteProject(confirmDelete.id)} 
                className="flex-1 py-4 bg-rose-600 rounded-full font-black text-xs uppercase tracking-widest text-white hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-600/10"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectManager;

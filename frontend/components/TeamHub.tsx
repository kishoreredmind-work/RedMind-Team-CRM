import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Task, TaskStatus, UserRole, UserStatus } from '../types';
import { api } from '../services/api';

interface TeamHubProps {
  members: User[];
  tasks: Task[];
  isAdmin: boolean;
  refreshMembers?: () => void;
  onNavigate?: (tab: string, id?: string) => void;
}

const TeamHub: React.FC<TeamHubProps> = ({ members, tasks, isAdmin, refreshMembers, onNavigate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TEAM_MEMBER);
  const [status, setStatus] = useState<UserStatus>(UserStatus.APPROVED);

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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.team.create({
        name,
        email,
        password,
        role,
        status
      });
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRole(UserRole.TEAM_MEMBER);
      setStatus(UserStatus.APPROVED);
      setIsAddModalOpen(false);
      
      // Refresh list
      refreshMembers?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Team Hub</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Operational Capacity & Talent Directory</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black text-white px-8 py-4 rounded-full text-sm font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            <span>+</span> Add Team Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => {
          const stats = getMemberPerformance(member.id);
          return (
            <div key={member.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between min-h-[300px]">
               {/* Performance Background Bar */}
               <div className="absolute bottom-0 left-0 h-1 bg-slate-50 w-full">
                  <div className="h-full bg-black transition-all duration-1000" style={{ width: `${stats.percent}%` }}></div>
               </div>

               <div>
                 <div className="flex items-start justify-between mb-8">
                    <div className="relative">
                       <img 
                         src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} 
                         className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-slate-50"
                         alt={member.name}
                       />
                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.status === UserStatus.APPROVED ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                       <p className="text-2xl font-black text-slate-900">{stats.percent}%</p>
                    </div>
                 </div>

                 <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900 truncate">{member.name}</h4>
                      {member.status !== UserStatus.APPROVED && (
                        <span className="bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Pending</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{member.role === UserRole.LEAD ? 'Strategic Lead' : 'Team Member'}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{member.email}</p>
                 </div>

                 <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</p>
                       <p className="text-sm font-bold text-slate-900">{stats.total - stats.completed}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestones</p>
                       <p className="text-sm font-bold text-slate-900">{stats.completed}</p>
                    </div>
                 </div>
               </div>

               {isAdmin && (
                 <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2">
                   <button 
                     onClick={() => onNavigate?.('tasks')}
                     className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all text-center"
                   >
                     Tasks
                   </button>
                   <button 
                     onClick={() => setConfirmDelete({ id: member.id, name: member.name })}
                     className="py-3 px-4 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all text-center"
                   >
                     Remove
                   </button>
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Team Member</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Create operational credential</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-black flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-black outline-none font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-black outline-none font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  required
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-black outline-none font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-sm cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3D%22www.w3.org%202000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20stroke%3D%22%23475569%22%20stroke-width%3D%222%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat focus:bg-white focus:border-black transition-all"
                  >
                    <option value={UserRole.TEAM_MEMBER}>Team Member</option>
                    <option value={UserRole.LEAD}>Lead</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as UserStatus)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-sm cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3D%22www.w3.org%202000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20stroke%3D%22%23475569%22%20stroke-width%3D%222%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat focus:bg-white focus:border-black transition-all"
                  >
                    <option value={UserStatus.APPROVED}>Approved</option>
                    <option value={UserStatus.PENDING}>Pending</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-black text-white py-5 px-4 rounded-full font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl mt-6 disabled:bg-slate-400 disabled:scale-100"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-300">
            <div className="inline-flex p-4 bg-red-50 rounded-2xl text-red-600 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Remove Member</h3>
            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8">Are you sure you want to remove <strong>{confirmDelete.name}</strong> from the team?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-full font-black text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const userId = confirmDelete.id;
                  setConfirmDelete(null);
                  try {
                    await api.team.delete(userId);
                    refreshMembers?.();
                  } catch (err: any) {
                    alert(err.message || 'Failed to delete member');
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-full font-black text-sm transition-all shadow-xl shadow-red-600/10"
              >
                Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeamHub;

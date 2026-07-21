
import React, { useState, useEffect } from 'react';
import { Task, WorkLog, Comment, User } from '../types';
import { api } from '../services/api';

interface WorkLogModalProps {
  task: Task;
  onClose: () => void;
  currentUser: User;
}

const WorkLogModal: React.FC<WorkLogModalProps> = ({ task, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'comments'>('logs');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [logDesc, setLogDesc] = useState('');
  const [logHours, setLogHours] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLogsAndComments();
  }, [task.id]);

  const fetchLogsAndComments = async () => {
    setIsLoading(true);
    try {
      const [l, c] = await Promise.all([
        api.workLogs.list(task.id),
        api.comments.list(task.id)
      ]);
      setLogs(l);
      setComments(c);
    } catch (error) {
      console.error("Load failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc || logHours <= 0) return;
    setIsSubmitting(true);
    try {
      const newLog = await api.workLogs.save({
        taskId: task.id,
        memberId: currentUser.id,
        logDate: new Date().toISOString().split('T')[0],
        hours: logHours,
        description: logDesc
      });
      setLogs([newLog, ...logs]);
      setLogDesc('');
      setLogHours(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText) return;
    setIsSubmitting(true);
    try {
      const newComment = await api.comments.save({
        taskId: task.id,
        authorId: currentUser.id,
        body: commentText
      });
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[60]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col h-[85vh] animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-slate-50 flex justify-between items-start">
           <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">{task.title}</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Segment Logs</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-colors">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 gap-8 border-b border-slate-50 shrink-0">
           <button 
             onClick={() => setActiveTab('logs')}
             className={`py-6 text-xs font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'logs' ? 'text-black' : 'text-slate-300 hover:text-slate-500'}`}
           >
             Work Logs
             {activeTab === 'logs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-t-full"></div>}
           </button>
           <button 
             onClick={() => setActiveTab('comments')}
             className={`py-6 text-xs font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'comments' ? 'text-black' : 'text-slate-300 hover:text-slate-500'}`}
           >
             Team Thread
             {activeTab === 'comments' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-t-full"></div>}
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 min-h-0">
           {isLoading ? (
             <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-spin"></div>
             </div>
           ) : activeTab === 'logs' ? (
             <div className="space-y-8">
                {/* Form */}
                <form onSubmit={handleLogSubmit} className="bg-slate-50 p-6 rounded-[2rem] gap-4 grid grid-cols-3">
                   <div className="col-span-2">
                     <textarea 
                       placeholder="Action description..." 
                       value={logDesc}
                       onChange={e => setLogDesc(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-black resize-none"
                       rows={2}
                     />
                   </div>
                   <div className="space-y-4">
                     <input 
                       type="number" 
                       step="0.5" 
                       placeholder="Hours" 
                       value={logHours || ''}
                       onChange={e => setLogHours(Number(e.target.value))}
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-black"
                     />
                     <button 
                       disabled={isSubmitting}
                       className="w-full bg-black text-white text-[10px] uppercase font-black tracking-widest py-3.5 rounded-xl hover:scale-105 transition-all"
                     >
                       Log Work
                     </button>
                   </div>
                </form>

                {/* List */}
                <div className="space-y-4">
                   {logs.map(log => (
                     <div key={log.id} className="group p-6 rounded-[2rem] bg-white border border-slate-50 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase">
                                 {log.hours}h
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.logDate}</span>
                           </div>
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{log.description}</p>
                     </div>
                   ))}
                   {logs.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase py-10">No Work Recorded Yet</p>}
                </div>
             </div>
           ) : (
             <div className="space-y-8">
                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="flex gap-4 items-end">
                   <textarea 
                     placeholder="Share update or question..." 
                     value={commentText}
                     onChange={e => setCommentText(e.target.value)}
                     className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-black resize-none"
                     rows={2}
                   />
                   <button 
                     disabled={isSubmitting}
                     className="bg-black text-white w-14 h-14 rounded-[1.2rem] flex items-center justify-center hover:scale-105 transition-all shadow-xl"
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                   </button>
                </form>

                {/* Comment List */}
                <div className="space-y-6">
                   {comments.map(comment => (
                     <div key={comment.id} className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex-shrink-0" />
                        <div className="flex-1">
                           <div className="bg-slate-50 p-5 rounded-[1.5rem] relative">
                             <p className="text-sm text-slate-700 font-bold leading-relaxed">{comment.body}</p>
                           </div>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2 ml-2">{new Date(comment.createdAt).toLocaleDateString()} • Sync Ref #{comment.id.slice(0,4)}</p>
                        </div>
                     </div>
                   ))}
                   {comments.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase py-10">No Discussion Segments</p>}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default WorkLogModal;

import React, { useMemo } from 'react';
import { Project, Task, User, WorkLog, TaskStatus } from '../types';

interface AnalyticsDashboardProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: User[];
}

export default function AnalyticsDashboard({ projects, tasks, teamMembers }: AnalyticsDashboardProps) {
  // 1. Task Completion Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === TaskStatus.TO_DO).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { total, todo, inProgress, done, completionRate };
  }, [tasks]);

  // 2. Team Workload (Tasks per Specialist)
  const workloadData = useMemo(() => {
    return teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo === member.id);
      const activeTasks = memberTasks.filter(t => t.status !== TaskStatus.DONE).length;
      const completedTasks = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
      return {
        name: member.name,
        active: activeTasks,
        completed: completedTasks,
        total: memberTasks.length
      };
    }).sort((a, b) => b.total - a.total);
  }, [tasks, teamMembers]);

  // 3. Project Distribution (Tasks per Project)
  const projectDistribution = useMemo(() => {
    return projects.map(proj => {
      const projTasks = tasks.filter(t => t.projectId === proj.id);
      const done = projTasks.filter(t => t.status === TaskStatus.DONE).length;
      const progress = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
      return {
        name: proj.name,
        taskCount: projTasks.length,
        progress
      };
    }).sort((a, b) => b.taskCount - a.taskCount).slice(0, 5);
  }, [projects, tasks]);

  // SVG Chart Calculations
  const maxTasks = Math.max(...workloadData.map(d => d.total), 1);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">CRM Intelligence Center</h2>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Operational Analytics & Performance Analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute right-[-20px] bottom-[-20px] text-white/5 font-black text-[9rem] leading-none select-none pointer-events-none transition-transform group-hover:scale-110 duration-500">%</div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</span>
          <div className="text-5xl font-black mt-4 tracking-tight">{stats.completionRate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
            <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</span>
          <div className="text-5xl font-black mt-4 text-slate-900 tracking-tight">{stats.inProgress}</div>
          <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase">Active operations</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backlog / Todo</span>
          <div className="text-5xl font-black mt-4 text-slate-900 tracking-tight">{stats.todo}</div>
          <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase">Pending queue</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Segment</span>
          <div className="text-5xl font-black mt-4 text-emerald-500 tracking-tight">{stats.done}</div>
          <p className="text-[10px] text-emerald-500/80 font-bold mt-4 uppercase">Successfully committed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Workload (Pure SVG Chart) */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Specialist Task Distribution</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active vs Completed task segments</p>
          </div>

          <div className="space-y-5">
            {workloadData.map((data, index) => {
              const activePct = (data.active / maxTasks) * 100;
              const completedPct = (data.completed / maxTasks) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-700">{data.name}</span>
                    <span className="font-bold text-slate-400">{data.total} Tasks ({data.active} active)</span>
                  </div>
                  <div className="w-full bg-slate-50 h-5 rounded-full overflow-hidden flex">
                    <div className="bg-slate-900 h-full transition-all duration-700" style={{ width: `${activePct}%` }} title="Active Tasks" />
                    <div className="bg-emerald-400 h-full transition-all duration-700 border-l border-white" style={{ width: `${completedPct}%` }} title="Completed Tasks" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart Legend */}
          <div className="flex gap-4 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-sm" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Project Progress Tracker */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Project Stream Load</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total task volume and completed percentage</p>
          </div>

          <div className="space-y-6">
            {projectDistribution.map((proj, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-900 truncate max-w-[150px]">{proj.name}</span>
                  <span className="font-black text-slate-400">{proj.taskCount} tasks</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-black h-full transition-all duration-1000" style={{ width: `${proj.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-900 min-w-[30px] text-right">{proj.progress}%</span>
                </div>
              </div>
            ))}
            {projectDistribution.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase">No active projects</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

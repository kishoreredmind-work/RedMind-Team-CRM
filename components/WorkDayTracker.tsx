import React from 'react';
import { calculateWorkingDays, getDaysRemaining } from '../services/workDays';

interface WorkDayTrackerProps {
  startDate: string;
  endDate: string;
  className?: string;
}

const WorkDayTracker: React.FC<WorkDayTrackerProps> = ({ startDate, endDate, className = '' }) => {
  const workingDays = calculateWorkingDays(startDate, endDate);
  const daysLeft = getDaysRemaining(endDate);
  
  // Calculate progress percentage for visual health
  const totalDays = calculateWorkingDays(startDate, endDate) || 1;
  const elapsedDays = totalDays - calculateWorkingDays(new Date() > new Date(startDate) ? new Date() : startDate, endDate);
  const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Timeline Strategy</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{workingDays} Working Days</span>
            <span className="text-slate-300">|</span>
            <span className={`text-xs font-black uppercase tracking-tighter ${daysLeft <= 3 ? 'text-red-500' : 'text-slate-400'}`}>
              {daysLeft} Days Left
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Deadline</p>
          <p className="text-xs font-bold text-slate-900">{new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${
            daysLeft <= 3 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-black'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
        <span>Start: {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{Math.round(progress)}% Elapsed</span>
      </div>
    </div>
  );
};

export default WorkDayTracker;

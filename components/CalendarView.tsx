import React, { useState, useMemo } from 'react';
import { Project, Task } from '../types';

interface CalendarViewProps {
  projects: Project[];
  tasks: Task[];
}

export default function CalendarView({ projects, tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Last date of current month
    const prevMonthDays = new Date(year, month, 0).getDate(); // Last date of previous month

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month padding days
    const remainingSlots = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  }, [year, month]);

  // Match projects and tasks to a day
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    const dayProjects = projects.filter(p => {
      if (!p.deadline) return false;
      const pDeadlineStr = new Date(p.deadline).toISOString().split('T')[0];
      return pDeadlineStr === dateStr;
    });

    return {
      projects: dayProjects
    };
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Deadline Timeline</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Calendar & Schedule Tracking Matrix</p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-full px-6 py-3 self-start">
          <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-sm font-black text-slate-900 min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden p-8">
        {/* Days of the Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-slate-50 mt-4 rounded-3xl overflow-hidden border border-slate-100">
          {calendarDays.map((dayObj, index) => {
            const events = getEventsForDate(dayObj.date);
            const isToday = new Date().toDateString() === dayObj.date.toDateString();

            return (
              <div 
                key={index} 
                className={`min-h-[120px] bg-white p-4 transition-all hover:bg-slate-50/50 flex flex-col justify-between ${
                  dayObj.isCurrentMonth ? 'text-slate-900' : 'text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-black text-white' : ''
                  }`}>
                    {dayObj.day}
                  </span>
                </div>

                <div className="flex-1 mt-3 space-y-1.5 overflow-y-auto max-h-[80px]">
                  {events.projects.map((proj, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="bg-black text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg truncate max-w-full"
                      title={`Project Deadline: ${proj.name}`}
                    >
                      🚩 {proj.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

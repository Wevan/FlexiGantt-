import React, { useState, useRef } from 'react';
import { ProjectFile, TaskRecord } from '../types';
import { differenceInDays, addDays, startOfMonth, endOfMonth, format, isSameDay, parseISO, isValid } from 'date-fns';

interface Props {
  project: ProjectFile;
  filters: Record<string, string[]>;
}

const PIXELS_PER_DAY = 48;
const ROW_HEIGHT = 48;

export const GanttView: React.FC<Props> = ({ project, filters }) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 1. Identify Start/End fields with fallback
  const startField = project.fields.find(f => f.name.toLowerCase().includes('start') && f.type === 'date') || 
                     project.fields.find(f => f.type === 'date');
  const endField = project.fields.find(f => f.name.toLowerCase().includes('end') && f.type === 'date') || 
                   project.fields.filter(f => f.type === 'date')[1];
  
  const nameField = project.fields.find(f => f.isSystem) || project.fields[0];
  const colorField = project.fields.find(f => f.id === 'f_status') || project.fields.find(f => f.type === 'select');

  // 2. Determine timeline range
  const today = new Date();
  const [viewStartDate] = useState(() => addDays(startOfMonth(today), -7));
  const [viewEndDate] = useState(() => addDays(endOfMonth(today), 60));

  const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1;

  // 3. Filter Tasks
  const visibleTasks = project.tasks.filter(task => {
    return Object.entries(filters).every(([fieldId, filterValues]) => {
      if (!filterValues || filterValues.length === 0) return true;
      const cellValue = task[fieldId];
      if (Array.isArray(cellValue)) {
        return cellValue.some(v => filterValues.includes(v));
      }
      return filterValues.includes(cellValue);
    });
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  if (!startField || !endField) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
           <p>Gantt view requires at least two Date fields (Start & End).</p>
           <p className="text-sm mt-2">Please add them in Table view.</p>
        </div>
      );
  }

  const daysArr = Array.from({ length: totalDays }, (_, i) => addDays(viewStartDate, i));

  // Helper to get bar style
  const getTaskBarStyle = (task: TaskRecord) => {
      const sVal = task[startField.id];
      const eVal = task[endField.id];
      if (!sVal || !eVal) return null;

      const start = parseISO(sVal);
      const end = parseISO(eVal);
      
      if (!isValid(start) || !isValid(end)) return null;

      // Clip start/end to view range
      if (end < viewStartDate || start > viewEndDate) return null;

      const effectiveStart = start < viewStartDate ? viewStartDate : start;
      // If we want to clamp the end for visual purposes:
      // const effectiveEnd = end > viewEndDate ? viewEndDate : end;

      const offsetDays = differenceInDays(effectiveStart, viewStartDate);
      const durationDays = differenceInDays(end, effectiveStart) + 1;

      return {
          left: `${offsetDays * PIXELS_PER_DAY}px`,
          width: `${Math.max(durationDays * PIXELS_PER_DAY, 24)}px`,
      };
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative border-t border-gray-200">
      
      {/* Header Area */}
      <div className="flex flex-none border-b border-gray-200 bg-gray-50 h-12 shadow-sm z-20">
        {/* Top Left Fixed Cell */}
        <div className="w-64 border-r border-gray-200 flex items-center px-4 font-bold text-xs text-gray-500 uppercase flex-none z-30 bg-gray-50">
            {nameField.name}
        </div>
        
        {/* Timeline Header (Syncs with body scroll) */}
        <div className="flex-1 overflow-hidden relative" ref={headerRef}>
             <div className="h-full relative" style={{ width: totalDays * PIXELS_PER_DAY }}>
                {daysArr.map((d, i) => {
                    const isMonthStart = d.getDate() === 1 || i === 0;
                    const isToday = isSameDay(d, today);
                    return (
                        <div 
                            key={i} 
                            className={`absolute top-0 bottom-0 border-r border-gray-200/60 text-xs flex flex-col justify-end pb-2 items-center ${isToday ? 'bg-blue-50/50' : ''}`}
                            style={{ left: i * PIXELS_PER_DAY, width: PIXELS_PER_DAY }}
                        >
                            {isMonthStart && (
                                <span className="absolute top-1 left-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap z-10">
                                    {format(d, 'MMM yyyy')}
                                </span>
                            )}
                            <span className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                {d.getDate()}
                            </span>
                            <span className="text-[9px] text-gray-400 uppercase">{format(d, 'EEEEE')}</span>
                        </div>
                    );
                })}
             </div>
        </div>
      </div>

      {/* Body Area (Handles Scroll) */}
      <div 
        className="flex-1 overflow-auto relative custom-scrollbar"
        ref={bodyRef}
        onScroll={handleScroll}
      >
        <div className="flex min-w-full" style={{ width: 'max-content' }}>
            
            {/* Sticky Sidebar */}
            <div className="w-64 flex-none sticky left-0 z-10 bg-white border-r border-gray-200">
                {visibleTasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="border-b border-gray-100 flex items-center px-4 text-sm text-gray-700 truncate hover:bg-gray-50 transition-colors"
                        style={{ height: ROW_HEIGHT }}
                        title={task[nameField.id]}
                    >
                        {task[nameField.id] || <span className="text-gray-400 italic">Untitled</span>}
                    </div>
                ))}
                {/* Spacer for empty space clickability */}
                <div className="h-full bg-white min-h-[200px]"></div>
            </div>

            {/* Timeline Chart Area */}
            <div className="relative bg-white" style={{ width: totalDays * PIXELS_PER_DAY }}>
                 
                 {/* Grid Background */}
                 <div className="absolute inset-0 pointer-events-none">
                     {daysArr.map((d, i) => {
                         const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                         return (
                            <div 
                                key={`grid-${i}`}
                                className={`absolute top-0 bottom-0 border-r border-dashed border-gray-100 ${isWeekend ? 'bg-gray-50/50' : ''} ${isSameDay(d, today) ? 'bg-blue-50/30' : ''}`}
                                style={{ left: i * PIXELS_PER_DAY, width: PIXELS_PER_DAY }}
                            />
                         );
                     })}
                     {/* Today Line */}
                     {(() => {
                        const todayIndex = differenceInDays(today, viewStartDate);
                        if (todayIndex >= 0 && todayIndex < totalDays) {
                            return (
                                <div 
                                    className="absolute top-0 bottom-0 border-l-2 border-blue-400 z-0"
                                    style={{ left: todayIndex * PIXELS_PER_DAY + (PIXELS_PER_DAY/2) }}
                                >
                                    <div className="bg-blue-400 text-white text-[9px] px-1 py-0.5 rounded-r absolute top-0 left-0 shadow-sm">Today</div>
                                </div>
                            );
                        }
                        return null;
                     })()}
                 </div>

                 {/* Task Bars */}
                 <div className="relative z-0 pt-0">
                    {visibleTasks.map((task, idx) => {
                        const barStyle = getTaskBarStyle(task);
                        if (!barStyle) {
                            return (
                                <div key={`row-empty-${task.id}`} className="border-b border-gray-100/50 w-full" style={{ height: ROW_HEIGHT }}></div>
                            );
                        }
                        
                        // Determine Color
                        let barColor = '#3b82f6';
                        let labelColor = '#1e40af';
                        if (colorField && colorField.options) {
                            const val = task[colorField.id];
                            const firstVal = Array.isArray(val) ? val[0] : val;
                            const opt = colorField.options.find(o => o.id === firstVal);
                            if (opt) {
                                barColor = opt.color;
                                // Simple logic to darken label color
                                labelColor = 'rgba(0,0,0,0.6)';
                            }
                        }

                        return (
                            <div 
                                key={`bar-${task.id}`} 
                                className="w-full border-b border-gray-100/50 relative group"
                                style={{ height: ROW_HEIGHT }}
                            >
                                <div
                                    className="absolute h-8 rounded-md px-3 text-xs text-white font-medium flex items-center shadow-sm overflow-hidden whitespace-nowrap hover:shadow-md hover:brightness-105 transition-all cursor-pointer top-2"
                                    style={{
                                        ...barStyle,
                                        backgroundColor: barColor,
                                    }}
                                >
                                    <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                                        {task[nameField.id]}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                 </div>
                 
                 <div className="h-full min-h-[200px]"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { Task, Bucket } from '../types';

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onTaskClick }) => {
  // Determine date range
  const dates = tasks
    .flatMap(t => [t.startDate, t.dueDate])
    .filter((d): d is string => !!d)
    .map(d => new Date(d).getTime());

  const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
  const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();

  // Buffer
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 5);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayWidth = 40; // px per day

  const getDatePosition = (dateStr?: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const diffTime = d.getTime() - minDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) * dayWidth;
  };

  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111111] overflow-hidden">
      {/* Timeline Header */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-hidden ml-64 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="flex" style={{ width: totalDays * dayWidth }}>
          {daysArray.map((date, i) => (
            <div key={i} className={`flex-shrink-0 border-r border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 flex flex-col justify-end pb-1 text-center ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100 dark:bg-black/20' : ''}`} style={{ width: dayWidth }}>
              <span className="font-bold">{date.getDate()}</span>
              <span className="text-[10px] uppercase">{date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-auto">
        {/* Task List (Left sidebar of Gantt) */}
        <div className="w-64 border-r border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#111111] shadow-sm z-10 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10 p-2 font-semibold text-xs text-gray-500 dark:text-gray-400 h-8">Task Name</div>
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="h-10 border-b border-gray-100 dark:border-white/5 flex items-center px-4 text-sm text-gray-700 dark:text-gray-300 truncate hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            >
              {task.title}
            </div>
          ))}
        </div>

        {/* Gantt Bars Area */}
        <div className="relative overflow-auto" style={{ width: totalDays * dayWidth }}>
          {/* Grid Lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {daysArray.map((d, i) => (
              <div key={i} className={`flex-shrink-0 border-r border-gray-100 dark:border-white/5 h-full ${d.getDay() === 0 || d.getDay() === 6 ? 'bg-gray-50/50 dark:bg-black/10' : ''}`} style={{ width: dayWidth }}></div>
            ))}
          </div>

          <div className="pt-8">
            {tasks.map((task, idx) => {
              const left = getDatePosition(task.startDate);
              const right = getDatePosition(task.dueDate);
              const width = Math.max(dayWidth, right - left);

              return (
                <div key={task.id} className="h-10 flex items-center relative group">
                  <div
                    onClick={() => onTaskClick(task)}
                    className={`absolute h-6 rounded-md shadow-sm border border-opacity-20 flex items-center px-2 text-xs text-white truncate transition-all hover:brightness-95 cursor-pointer
                        ${task.bucketId === 'b1' ? 'bg-blue-500 border-blue-700 dark:bg-blue-600 dark:border-blue-400' :
                        task.bucketId === 'b2' ? 'bg-purple-500 border-purple-700 dark:bg-purple-600 dark:border-purple-400' :
                          task.bucketId === 'b3' ? 'bg-teal-500 border-teal-700 dark:bg-teal-600 dark:border-teal-400' : 'bg-gray-500 border-gray-700 dark:bg-gray-600 dark:border-gray-400'}
                      `}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    title={`${task.title} (${task.startDate} - ${task.dueDate})`}
                  >
                    {task.title}
                  </div>
                  {/* Hover Connector Lines (Visual Polish) */}
                  <div className="absolute w-full border-b border-gray-100 dark:border-white/5 top-10 pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
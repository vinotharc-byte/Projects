import React, { useState, useRef, useMemo } from 'react';
import { Task, Project, Status, Priority } from '../types';
import { formatDate, Badge, Button } from './UI';

interface MyTasksViewProps {
  projects: Project[];
  currentUser: string;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

interface ColumnDef {
  id: string;
  label: string;
  width: number;
}

// Helper to get the Monday of the current week based on a reference date
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

// Helper for Week Number
const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const MyTasksView: React.FC<MyTasksViewProps> = ({ projects, currentUser, onUpdateTask }) => {
  // Aggregate tasks
  const myTasks = projects.flatMap(p =>
    p.tasks
      .filter(t => t.assignee === currentUser)
      .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
  );

  // -- State --
  // Date Navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  // Columns Configuration
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: 'projectName', label: 'Project Name', width: 180 },
    { id: 'title', label: 'Task Name', width: 280 },
    { id: 'dueDate', label: 'Due Date', width: 100 },
    { id: 'priority', label: 'Priority', width: 90 },
    { id: 'status', label: 'Status', width: 110 },
  ]);

  // -- Helpers --
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const changeWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (offset * 7));
    setCurrentWeekStart(newStart);
  };

  const jumpToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const getDailyEstimate = (task: Task, date: Date) => {
    if (!task.startDate || !task.dueDate) return 0;
    const start = new Date(task.startDate);
    const end = new Date(task.dueDate);
    // Normalize times to midnight for comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const current = new Date(date);
    current.setHours(0, 0, 0, 0);

    // Check date range
    if (current < start || current > end) return 0;

    // Check weekends
    const day = current.getDay();
    if (day === 0 || day === 6) return 0;

    // Calculate based on allocation (default 100%)
    // Standard day = 8 hours
    const alloc = task.allocation ?? 100;
    return (8 * alloc) / 100;
  };

  // Calculate Weekly Totals for the "Total" row
  const weeklyColumnTotals = useMemo(() => {
    return weekDays.map(day => {
      const dateStr = day.toISOString().split('T')[0];
      return myTasks.reduce((acc, task) => {
        const est = getDailyEstimate(task, day);
        const act = task.timesheet?.[dateStr] || 0;
        return { est: acc.est + est, act: acc.act + act };
      }, { est: 0, act: 0 });
    });
  }, [myTasks, weekDays]); // Re-calc when tasks or week changes

  // Calculate Grand Total for the week (bottom right corner of the calculation block)
  const weeklyGrandTotal = weeklyColumnTotals.reduce((acc, day) => ({
    est: acc.est + day.est,
    act: acc.act + day.act
  }), { est: 0, act: 0 });

  const handleHourChange = (task: Task, dateStr: string, value: string) => {
    const numValue = parseFloat(value);
    const newTimesheet = { ...(task.timesheet || {}) };

    if (isNaN(numValue) || value === '') {
      delete newTimesheet[dateStr];
    } else {
      newTimesheet[dateStr] = numValue;
    }

    // Recalculate total actual effort based on ALL timesheet entries (not just this week)
    const totalHours = Object.values(newTimesheet).reduce((sum, val) => sum + (val || 0), 0);

    onUpdateTask(task.id, {
      timesheet: newTimesheet,
      actualEffort: totalHours
    });
  };

  // -- Resizing Logic --
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef<{ startX: number; startWidth: number; columnIndex: number } | null>(null);

  const startResize = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizingRef.current = {
      startX: e.clientX,
      startWidth: columns[index].width,
      columnIndex: index,
    };
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };

  const handleResize = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { startX, startWidth, columnIndex } = resizingRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);

    setColumns(prev => prev.map((col, i) =>
      i === columnIndex ? { ...col, width: newWidth } : col
    ));
  };

  const stopResize = () => {
    setIsResizing(false);
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  };

  // -- Reordering Logic --
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === index) return;

    const newColumns = [...columns];
    const draggedCol = newColumns[draggedColIndex];
    newColumns.splice(draggedColIndex, 1);
    newColumns.splice(index, 0, draggedCol);

    setColumns(newColumns);
    setDraggedColIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedColIndex(null);
  };

  // -- Cell Renderer --
  const renderCell = (colId: string, task: any) => {
    switch (colId) {
      case 'projectName':
        return <span className="font-semibold text-gray-700 dark:text-gray-300 truncate block" title={task.projectName}>{task.projectName}</span>;
      case 'title':
        return <span className="text-gray-900 dark:text-gray-100 truncate block font-medium" title={task.title}>{task.title}</span>;
      case 'dueDate':
        return (
          <span className={`font-mono text-xs ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== Status.COMPLETED ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
            {formatDate(task.dueDate)}
          </span>
        );
      case 'priority':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${task.priority === Priority.URGENT ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
            task.priority === Priority.HIGH ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50' :
              task.priority === Priority.MEDIUM ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5'
            }`}>
            {task.priority}
          </span>
        );
      case 'status':
        return (
          <select
            className="w-full text-xs border border-transparent hover:border-gray-300 dark:hover:border-white/20 rounded p-1 bg-transparent hover:bg-white dark:hover:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 outline-none cursor-pointer focus:ring-1 focus:ring-planner-600 transition-colors"
            value={task.status}
            onChange={(e) => onUpdateTask(task.id, { status: e.target.value as Status })}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.values(Status).map(s => <option key={s} value={s} className="bg-white dark:bg-[#1a1a1a]">{s}</option>)}
          </select>
        );
      default: return null;
    }
  };

  // Fixed widths for day columns and total column
  const dayColWidth = 80;
  const totalColWidth = 90;

  // Calculate total table width
  const totalTableWidth = columns.reduce((acc, c) => acc + c.width, 0) + (7 * dayColWidth) + totalColWidth;

  return (
    <div className="h-full bg-white dark:bg-[#111111] flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="px-8 py-5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1a1a1a] shrink-0 z-20 shadow-sm relative">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your assignments and log hours for the week.</p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 dark:bg-[#222] p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white dark:hover:bg-white/5 hover:shadow-md rounded-md text-gray-600 dark:text-gray-300 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="px-6 text-center min-w-[180px]">
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Week {getWeekNumber(currentWeekStart)}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white dark:hover:bg-white/5 hover:shadow-md rounded-md text-gray-600 dark:text-gray-300 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800"></div>
          <button onClick={jumpToToday} className="text-sm font-medium text-planner-700 dark:text-planner-400 bg-planner-50 dark:bg-planner-900/20 hover:bg-planner-100 dark:hover:bg-planner-900/30 px-5 py-2 rounded-lg border border-planner-200 dark:border-planner-800 transition-all hover:shadow-sm">
            Today
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#111111] relative scroll-smooth">
        <table
          className="text-left text-sm border-collapse table-fixed"
          style={{ minWidth: totalTableWidth, width: '100%' }}
        >
          <thead className="bg-white dark:bg-[#1a1a1a] sticky top-0 z-30 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <tr>
              {/* Draggable Metadata Headers */}
              {columns.map((col, index) => (
                <th
                  key={col.id}
                  className={`relative px-4 py-3 border-b border-r border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${draggedColIndex === index ? 'opacity-50' : ''}`}
                  style={{ width: col.width }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center justify-between cursor-grab active:cursor-grabbing">
                    <span className="truncate">{col.label}</span>
                  </div>
                  <div
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 z-10 group"
                    onMouseDown={(e) => startResize(e, index)}
                  >
                    <div className="h-full w-px bg-gray-200 dark:bg-gray-800 mx-auto group-hover:bg-blue-400" />
                  </div>
                </th>
              ))}

              {/* Fixed Day Headers */}
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <th key={i} className={`px-2 py-3 border-b border-gray-200 dark:border-white/10 border-r border-gray-100 dark:border-white/5 text-center ${isToday ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'bg-gray-50/40 dark:bg-white/5'}`} style={{ width: dayColWidth }}>
                    <div className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {day.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className={`text-base font-bold ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                      {day.getDate()}
                    </div>
                  </th>
                );
              })}
              <th
                className="px-4 py-3 border-b border-l border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#222] text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase"
                style={{ width: totalColWidth }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {/* 1. GRAND TOTAL ROW (Sticky underneath header) */}
            <tr className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-gray-200 dark:border-white/10 sticky top-[45px] z-20 shadow-md">
              {/* Spanning Metadata Columns */}
              <td colSpan={columns.length} className="px-6 py-3 border-r border-gray-200 dark:border-white/10 align-middle text-right pr-8">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Weekly Totals</span>
              </td>

              {/* Day Totals */}
              {weeklyColumnTotals.map((totals, i) => (
                <td key={`total-day-${i}`} className="p-2 border-r border-gray-200 dark:border-white/10 text-center align-middle">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className={`text-[12px] font-black ${totals.est > 8 ? 'text-red-600 dark:text-red-400' : (totals.est > 0 ? 'text-gray-900 dark:text-white' : 'text-transparent select-none')}`}>
                      {totals.est > 0 ? `${totals.est.toFixed(1)}h` : '-'}
                    </div>
                    <div className={`text-[13px] font-black ${totals.act > 8 ? 'text-red-600 dark:text-red-400' : (totals.act > totals.est && totals.est > 0 ? 'text-red-500/80 dark:text-red-400/80' : 'text-planner-600 dark:text-planner-400')}`}>
                      {totals.act > 0 ? `${totals.act.toFixed(1)}h` : '0'}
                    </div>
                  </div>
                </td>
              ))}

              {/* Weekly Grand Total */}
              <td className="p-2 text-center align-middle bg-gray-200/50 dark:bg-white/5 border-l border-gray-200 dark:border-white/10">
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                    {weeklyGrandTotal.est > 0 ? `${weeklyGrandTotal.est.toFixed(1)}h` : '-'}
                  </div>
                  <div className="text-lg font-black text-gray-800 dark:text-gray-100">
                    {weeklyGrandTotal.act > 0 ? `${weeklyGrandTotal.act.toFixed(1)}h` : '0'}
                  </div>
                </div>
              </td>
            </tr>

            {/* 2. TASK ROWS */}
            {myTasks.map((task, rowIndex) => {
              // Calculate Weekly Row Total for this specific task
              let weeklyTaskEst = 0;
              let weeklyTaskAct = 0;
              weekDays.forEach(day => {
                const dateStr = day.toISOString().split('T')[0];
                weeklyTaskEst += getDailyEstimate(task, day);
                weeklyTaskAct += (task.timesheet?.[dateStr] || 0);
              });

              return (
                <tr key={task.id} className={`${rowIndex % 2 === 0 ? 'bg-white dark:bg-[#111111]' : 'bg-gray-50/30 dark:bg-[#1a1a1a]/40'} hover:bg-blue-50/20 dark:hover:bg-blue-900/10 group transition-colors`}>
                  {/* Metadata Columns */}
                  {columns.map(col => (
                    <td key={col.id} className="px-4 py-3 border-r border-gray-100 dark:border-white/5 truncate align-middle text-gray-700 dark:text-gray-300">
                      {renderCell(col.id, task)}
                    </td>
                  ))}

                  {/* Day Columns */}
                  {weekDays.map((day, i) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const actualHours = task.timesheet?.[dateStr] ?? '';
                    const estHours = getDailyEstimate(task, day);
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                      <td key={i} className={`p-1 border-r border-gray-100 dark:border-white/5 text-center align-middle ${isToday ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                          {/* Top: Estimated */}
                          <div
                            className={`text-[12px] leading-none font-black ${estHours > 8 ? 'text-red-500' : (estHours > 0 ? 'text-gray-900 dark:text-white' : 'text-transparent select-none')}`}
                            title={estHours > 0 ? `Planned: ${estHours}h` : ''}
                          >
                            {estHours > 0 ? `${estHours}h` : '-'}
                          </div>
                          {/* Bottom: Actuals Input */}
                          <div className="relative flex justify-center w-full px-2">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              className={`w-full h-8 text-center border rounded transition-all text-sm outline-none 
                                                  ${actualHours
                                  ? 'border-gray-300 dark:border-white/20 bg-white dark:bg-[#1a1a1a] font-bold text-gray-900 dark:text-gray-100 shadow-sm'
                                  : 'border-transparent bg-transparent hover:bg-white dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-500 dark:text-gray-400 focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-planner-500 focus:shadow-sm'
                                }`}
                              placeholder="-"
                              value={actualHours}
                              onChange={(e) => handleHourChange(task, dateStr, e.target.value)}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Weekly Row Total Column */}
                  <td className="px-1 py-3 text-center align-middle bg-gray-50 dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-white/10">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className={`text-[12px] leading-none font-black ${weeklyTaskEst > 0 ? 'text-gray-900 dark:text-white' : 'text-transparent'}`}>
                        {weeklyTaskEst > 0 ? `${weeklyTaskEst.toFixed(1)}h` : '-'}
                      </div>
                      <div className="text-[13px] font-black text-planner-600 dark:text-planner-400">
                        {weeklyTaskAct > 0 ? `${weeklyTaskAct.toFixed(1)}h` : '0'}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {myTasks.length === 0 && (
              <tr>
                <td colSpan={columns.length + 8} className="px-6 py-20 text-center text-gray-400 dark:text-gray-600 italic">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No tasks assigned</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">You have no tasks assigned for this week.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
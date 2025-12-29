import React, { useState, useRef, useMemo } from 'react';
import { Bucket, Task, Priority, Status } from '../types';
import { Avatar, formatDate } from './UI';

interface GridViewProps {
  tasks: Task[];
  buckets: Bucket[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (task: Partial<Task>) => void;
}

interface ColumnDef {
  id: string;
  label: string;
  width: number;
}

export const GridView: React.FC<GridViewProps> = ({ tasks, buckets, onUpdateTask, onTaskClick, onAddTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // -- Column Configuration State --
  // Hardcoded order as requested: #, Task Name, Milestone, Predecessor, Start, End, Alloc. (%), Assigned To, Effort (h), Progress
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: 'index', label: '#', width: 50 },
    { id: 'title', label: 'Task Name', width: 320 },
    { id: 'isMilestone', label: 'Milestone', width: 80 },
    { id: 'predecessors', label: 'Predecessor', width: 120 },
    { id: 'startDate', label: 'Start', width: 110 },
    { id: 'dueDate', label: 'End', width: 110 },
    { id: 'allocation', label: 'Alloc. (%)', width: 90 },
    { id: 'assignee', label: 'Assigned To', width: 160 },
    { id: 'effort', label: 'Effort (h)', width: 90 },
    { id: 'status', label: 'Progress', width: 100 },
  ]);

  // -- Hierarchy Logic --
  // Flatten the task list into a tree structure
  const sortedTasks = useMemo(() => {
    const taskMap = new Map<string, Task>();
    const childrenMap = new Map<string, Task[]>();
    const roots: Task[] = [];

    // 1. Build maps
    tasks.forEach(t => {
      taskMap.set(t.id, t);
      if (t.parentId) {
        if (!childrenMap.has(t.parentId)) childrenMap.set(t.parentId, []);
        childrenMap.get(t.parentId)!.push(t);
      } else {
        roots.push(t);
      }
    });

    // 2. Recursive Flatten
    const result: { task: Task; level: number }[] = [];
    const traverse = (node: Task, level: number) => {
      result.push({ task: node, level });
      const children = childrenMap.get(node.id);
      if (children) {
        children.forEach(child => traverse(child, level + 1));
      }
    };

    roots.forEach(root => traverse(root, 0));
    return result;
  }, [tasks]);


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
    const newWidth = Math.max(50, startWidth + diff); // Min width 50px

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

  // -- Reordering Logic (Drag and Drop) --
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

  // -- Effort Calculation Logic --
  const calculateEffort = (start?: string, end?: string, allocation: number = 100): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    if (startDate > endDate) return 0;

    let businessDays = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    const totalHours = businessDays * 8 * (allocation / 100);
    return parseFloat(totalHours.toFixed(1));
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case Status.COMPLETED: return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case Status.IN_PROGRESS: return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case Status.NOT_STARTED: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const handleQuickAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({ title: newTaskTitle });
    setNewTaskTitle('');
  };

  // -- Predecessor Handling (Row Index <-> Task ID) --
  const getPredecessorString = (task: Task) => {
    if (!task.predecessors || task.predecessors.length === 0) return '';
    // Map IDs back to row indexes in the sorted list (1-based)
    return task.predecessors.map(id => {
      const index = sortedTasks.findIndex(item => item.task.id === id);
      return index !== -1 ? (index + 1).toString() : '?';
    }).join(', ');
  };

  const handlePredecessorChange = (task: Task, value: string) => {
    // Parse "1, 3" -> indexes -> IDs
    const rowIndexes = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const newPredecessorIds = rowIndexes
      .map(idx => sortedTasks[idx - 1]?.task.id)
      .filter(id => id && id !== task.id); // Valid ID and not self-reference

    onUpdateTask(task.id, { predecessors: newPredecessorIds });
  };

  // -- Cell Rendering --
  const renderCell = (colId: string, task: Task, level: number, rowIndex: number, bucket?: Bucket) => {
    const calculatedEffort = task.effort || calculateEffort(task.startDate, task.dueDate, task.allocation || 100);

    switch (colId) {
      case 'index':
        return <span className="text-gray-400 dark:text-gray-500 text-xs">{rowIndex + 1}</span>;
      case 'isMilestone':
        return (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={!!task.isMilestone}
              onChange={(e) => onUpdateTask(task.id, { isMilestone: e.target.checked })}
              className="w-4 h-4 text-planner-600 dark:text-planner-500 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-planner-600 focus:ring-offset-0 cursor-pointer"
            />
          </div>
        );
      case 'title':
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {/* Indentation Line / Icon */}
            {level > 0 && <span className="text-gray-300 dark:text-gray-600 mr-1">└</span>}

            <div
              onClick={() => onUpdateTask(task.id, { status: task.status === Status.COMPLETED ? Status.NOT_STARTED : Status.COMPLETED })}
              className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors ${task.status === Status.COMPLETED ? 'bg-green-600 border-green-600 text-white' : 'border-gray-400 dark:border-gray-600 hover:border-planner-600 dark:hover:border-planner-500'
                }`}
            >
              {task.status === Status.COMPLETED && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <div className="flex-1 flex items-center justify-between overflow-hidden">
              <input
                className={`bg-transparent w-full outline-none font-medium truncate transition-colors ${task.status === Status.COMPLETED ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}
                value={task.title}
                onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
              />
              <button onClick={() => onTaskClick(task)} className="text-gray-400 dark:text-gray-500 hover:text-planner-600 dark:hover:text-planner-400 opacity-0 group-hover:opacity-100 px-2 text-xs font-semibold transition-opacity">
                OPEN
              </button>
            </div>
          </div>
        );
      case 'assignee':
        return task.assignee ? (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTaskClick(task)}>
            <Avatar name={task.assignee} className="w-6 h-6 text-[10px]" />
            <span className="text-gray-700 dark:text-gray-300 text-sm truncate">{task.assignee}</span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm italic px-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer" onClick={() => onTaskClick(task)}>Unassigned</span>
        );
      case 'status':
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(task.status)} cursor-pointer`} onClick={() => onTaskClick(task)}>
            {task.status === Status.COMPLETED ? '100%' : task.status === Status.IN_PROGRESS ? '50%' : '0%'}
          </span>
        );
      case 'startDate':
        return (
          <input
            type="date"
            className="bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none w-full font-mono focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-800 rounded px-1 transition-all"
            value={task.startDate || ''}
            onChange={(e) => onUpdateTask(task.id, { startDate: e.target.value })}
          />
        );
      case 'dueDate':
        return (
          <input
            type="date"
            className="bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none w-full font-mono focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-800 rounded px-1 transition-all"
            value={task.dueDate || ''}
            onChange={(e) => onUpdateTask(task.id, { dueDate: e.target.value })}
          />
        );
      case 'allocation':
        return (
          <div className="flex items-center justify-end">
            <input
              type="number"
              min="0"
              max="100"
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 font-mono text-right w-16 outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-800 rounded px-1 transition-all"
              value={task.allocation !== undefined ? task.allocation : 100}
              onChange={(e) => onUpdateTask(task.id, { allocation: Number(e.target.value) })}
            />
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">%</span>
          </div>
        );
      case 'effort':
        return (
          <input
            type="number"
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 font-mono text-right w-full outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-800 rounded px-1 transition-all"
            value={task.effort || calculatedEffort}
            onChange={(e) => onUpdateTask(task.id, { effort: Number(e.target.value) })}
          />
        );
      case 'predecessors':
        return (
          <input
            className="bg-transparent text-sm text-gray-500 dark:text-gray-400 outline-none w-full placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-800 rounded px-1 transition-all"
            placeholder="Row IDs"
            defaultValue={getPredecessorString(task)}
            onBlur={(e) => handlePredecessorChange(task, e.target.value)}
            key={getPredecessorString(task)} // Key forces re-render when external changes happen
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-auto bg-white dark:bg-[#111111] flex flex-col">
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: columns.reduce((acc, col) => acc + col.width, 0) }}>
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="bg-white dark:bg-[#111111] sticky top-0 z-10 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col.id}
                    className={`relative font-semibold text-gray-600 dark:text-gray-400 py-2 px-3 border-b border-gray-200 dark:border-gray-800 select-none bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${draggedColIndex === index ? 'opacity-50' : ''}`}
                    style={{ width: col.width }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-between w-full truncate cursor-grab active:cursor-grabbing">
                      <span className="truncate">{col.label}</span>
                    </div>
                    {/* Resize Handle */}
                    <div
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-600 z-20 group"
                      onMouseDown={(e) => startResize(e, index)}
                    >
                      <div className="h-full w-px bg-gray-300 dark:bg-gray-700 mx-auto group-hover:bg-blue-400 dark:group-hover:bg-blue-600" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedTasks.map((item, rowIndex) => {
                const { task, level } = item;
                const bucket = buckets.find(b => b.id === task.bucketId);
                return (
                  <tr key={task.id} className="hover:bg-ms-offwhite dark:hover:bg-gray-900 group transition-colors">
                    {columns.map((col) => (
                      <td key={`${task.id}-${col.id}`} className="py-2 px-3 border-b border-gray-50 dark:border-gray-900/50 truncate" style={{ width: col.width }}>
                        {renderCell(col.id, task, level, rowIndex, bucket)}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Add New Task Row */}
              <tr>
                <td className="py-2 px-3 border-b border-gray-50 dark:border-gray-900 text-center text-gray-300 dark:text-gray-700" style={{ width: columns[0].width }}>+</td>
                <td className="py-2 px-3 border-b border-gray-50 dark:border-gray-900 border-r border-gray-100 dark:border-gray-800" colSpan={columns.length - 1}>
                  <input
                    type="text"
                    className="w-full text-sm outline-none placeholder-planner-600 dark:placeholder-planner-400 font-medium text-planner-700 dark:text-planner-500 bg-transparent"
                    placeholder="+ Add new task"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                    onBlur={handleQuickAdd}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-500 dark:text-gray-400 flex justify-between shadow-inner">
        <span>{tasks.length} tasks</span>
        <span className="font-mono">
          Total Effort: <span className="font-bold text-gray-700 dark:text-gray-300">{tasks.reduce((acc, t) => {
            const effort = t.effort || calculateEffort(t.startDate, t.dueDate, t.allocation || 100);
            return acc + effort;
          }, 0).toFixed(1)}</span> hours
        </span>
      </div>
    </div>
  );
};
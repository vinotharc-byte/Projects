import React, { useState } from 'react';
import { Task, Status, Priority, Bucket } from '../types';
import { Avatar, Button, formatDate } from './UI';

interface PeopleViewProps {
  tasks: Task[];
  buckets: Bucket[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (task: Partial<Task>) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({ tasks, onUpdateTask, onTaskClick, onAddTask }) => {
  const [addingToPerson, setAddingToPerson] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Get unique assignees
  const assignees = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))) as string[];
  assignees.sort();
  // Add 'Unassigned' as the first group
  const allGroups = ['Unassigned', ...assignees];

  const getTasksForPerson = (person: string) => {
    if (person === 'Unassigned') {
      return tasks.filter(t => !t.assignee);
    }
    return tasks.filter(t => t.assignee === person);
  };

  const calculateWorkload = (person: string) => {
    const personTasks = getTasksForPerson(person);
    const totalEffort = personTasks.reduce((acc, t) => acc + (t.effort || 0), 0);
    return totalEffort;
  };

  const handleAddTask = (person: string) => {
    if (!newTaskTitle.trim()) return;
    const assignee = person === 'Unassigned' ? undefined : person;
    onAddTask({ title: newTaskTitle, assignee });
    setNewTaskTitle('');
    setAddingToPerson(null);
  };

  return (
    <div className="flex h-full overflow-x-auto p-6 space-x-4 items-start horizontal-scroll bg-ms-offwhite dark:bg-[#000000]">
      {allGroups.map(person => {
        const personTasks = getTasksForPerson(person);
        const workload = calculateWorkload(person);

        return (
          <div key={person} className="min-w-[320px] w-[320px] flex flex-col max-h-full">
            {/* Person Header */}
            <div className="bg-white dark:bg-[#1a1a1a] p-3 rounded-t-lg border-b border-gray-100 dark:border-white/10 flex items-center gap-3 shadow-sm z-10">
              {person === 'Unassigned' ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
              ) : (
                <Avatar name={person} className="w-10 h-10 text-sm" />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate">{person}</h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                  <span>{personTasks.length} tasks</span>
                  <span>•</span>
                  <span>{workload}h effort</span>
                </div>
              </div>
              {workload > 40 && (
                <div className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded" title="Overallocated (>40h)">
                  Overload
                </div>
              )}
            </div>

            {/* Tasks List */}
            <div className="bg-gray-50/50 dark:bg-white/5 flex-1 overflow-y-auto p-2 space-y-2 rounded-b-lg border border-gray-200 dark:border-white/10 min-h-[150px]">

              {/* Add Task Input */}
              {addingToPerson === person ? (
                <div className="bg-white dark:bg-[#1a1a1a] p-2 rounded shadow-sm border border-blue-200 dark:border-blue-900/50 mb-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter a task name"
                    className="w-full text-sm outline-none mb-2 bg-transparent text-gray-900 dark:text-gray-100"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(person)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAddTask(person)} className="text-xs py-1">Add</Button>
                    <Button variant="ghost" onClick={() => setAddingToPerson(null)} className="text-xs py-1 text-gray-600 dark:text-gray-400">Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingToPerson(person)}
                  className="w-full py-2 border border-dashed border-gray-300 dark:border-white/10 rounded text-gray-500 dark:text-gray-400 text-sm hover:bg-white dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-gray-600 transition-colors mb-2"
                >
                  + Add task
                </button>
              )}

              {personTasks.length === 0 && !addingToPerson && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm italic">
                  No tasks assigned
                </div>
              )}

              {personTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="bg-white dark:bg-[#1a1a1a] p-3 rounded border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                        task.priority === 'High' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                      }`}>
                      {task.priority}
                    </span>
                    {task.effort ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{task.effort}h</span>
                    ) : null}
                  </div>

                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 leading-snug">{task.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 border-t border-gray-50 dark:border-white/5 pt-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={task.status === Status.COMPLETED}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onUpdateTask(task.id, { status: task.status === Status.COMPLETED ? Status.NOT_STARTED : Status.COMPLETED })}
                        className="rounded border-gray-300 dark:border-gray-700 text-planner-600 focus:ring-planner-600 bg-white dark:bg-[#111111]"
                      />
                      <span className={task.status === Status.COMPLETED ? 'line-through text-gray-400 dark:text-gray-600' : ''}>
                        {task.status}
                      </span>
                    </div>
                    {task.dueDate && (
                      <span className={new Date(task.dueDate) < new Date() && task.status !== Status.COMPLETED ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
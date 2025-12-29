import React, { useState, useEffect } from 'react';
import { Task, Bucket, Priority, Status, ChecklistItem } from '../types';
import { Button, Avatar, Badge } from './UI';

interface TaskDetailModalProps {
  task: Task;
  buckets: Bucket[];
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, buckets, onClose, onUpdate, onDelete }) => {
  const [description, setDescription] = useState(task.description);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Auto-save description on blur
  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      onUpdate(task.id, { description });
    }
  };

  const toggleChecklist = (itemId: string, isChecked: boolean) => {
    const newChecklist = (task.checklist || []).map(item =>
      item.id === itemId ? { ...item, isChecked } : item
    );
    onUpdate(task.id, { checklist: newChecklist });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem,
      isChecked: false
    };
    onUpdate(task.id, { checklist: [...(task.checklist || []), newItem] });
    setNewChecklistItem('');
  };

  const removeChecklistItem = (itemId: string) => {
    onUpdate(task.id, { checklist: (task.checklist || []).filter(i => i.id !== itemId) });
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50 flex justify-end">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-start">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="uppercase tracking-wider font-semibold">Task Details</span>
              <span>•</span>
              <select
                className="bg-white dark:bg-[#1a1a1a] border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                value={task.bucketId}
                onChange={(e) => onUpdate(task.id, { bucketId: e.target.value })}
              >
                {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <input
              type="text"
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100 w-full outline-none hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#1a1a1a] border border-transparent focus:border-planner-600 rounded -ml-2 px-2 py-1 transition-colors"
              value={task.title}
              onChange={(e) => onUpdate(task.id, { title: e.target.value })}
            />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Quick Actions / Metadata */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Assigned To</label>
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 rounded cursor-pointer group border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20">
                  <Avatar name={task.assignee} className="w-8 h-8" />
                  <input
                    className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none flex-1 group-hover:bg-white dark:group-hover:bg-[#1a1a1a]"
                    placeholder="Add assignee"
                    value={task.assignee || ''}
                    onChange={(e) => onUpdate(task.id, { assignee: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Bucket</label>
                <select
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-white/5 outline-none text-gray-900 dark:text-gray-100"
                  value={task.bucketId}
                  onChange={(e) => onUpdate(task.id, { bucketId: e.target.value })}
                >
                  {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Progress</label>
                <select
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-white/5 outline-none text-gray-900 dark:text-gray-100"
                  value={task.status}
                  onChange={(e) => onUpdate(task.id, { status: e.target.value as Status })}
                >
                  {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Priority</label>
                  <select
                    className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-white/5 outline-none text-gray-900 dark:text-gray-100"
                    value={task.priority}
                    onChange={(e) => onUpdate(task.id, { priority: e.target.value as Priority })}
                  >
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!task.isMilestone}
                      onChange={(e) => onUpdate(task.id, { isMilestone: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-700 text-planner-600 focus:ring-planner-600 w-4 h-4 cursor-pointer bg-white dark:bg-[#1a1a1a]"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestone</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 outline-none focus:ring-1 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  value={task.startDate || ''}
                  onChange={(e) => onUpdate(task.id, { startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 outline-none focus:ring-1 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  value={task.dueDate || ''}
                  onChange={(e) => onUpdate(task.id, { dueDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Effort (h)</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 outline-none focus:ring-1 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                    value={task.effort || 0}
                    onChange={(e) => onUpdate(task.id, { effort: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Alloc (%)</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-gray-200 dark:border-white/10 rounded p-2 outline-none focus:ring-1 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                    value={task.allocation || 100}
                    onChange={(e) => onUpdate(task.id, { allocation: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Description</label>
            <textarea
              className="w-full min-h-[120px] p-3 text-sm border border-gray-200 dark:border-white/10 rounded focus:ring-2 focus:ring-planner-600 focus:border-transparent outline-none bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 transition-colors"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
            />
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Checklist</label>
            <div className="space-y-2 mb-3">
              {task.checklist?.map(item => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={(e) => toggleChecklist(item.id, e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700 text-planner-600 focus:ring-planner-600 w-4 h-4 bg-white dark:bg-[#1a1a1a]"
                  />
                  <span className={`flex-1 text-sm ${item.isChecked ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>
                    {item.text}
                  </span>
                  <button onClick={() => removeChecklistItem(item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 px-2">✕</button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 text-sm border border-gray-200 dark:border-white/10 rounded p-2 outline-none focus:ring-1 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                placeholder="Add an item"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              />
              <Button onClick={addChecklistItem} variant="secondary" className="py-1.5">Add</Button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#111111] flex justify-between items-center">
          <Button variant="ghost" onClick={() => onDelete(task.id)} className="text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400">
            Delete Task
          </Button>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Last updated just now
          </div>
        </div>
      </div>
    </div>
  );
};
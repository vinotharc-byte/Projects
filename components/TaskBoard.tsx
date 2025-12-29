import React, { useState } from 'react';
import { Bucket, Task, Priority, Status } from '../types';
import { Button, Badge, Avatar, formatDate } from './UI';

interface TaskBoardProps {
  buckets: Bucket[];
  tasks: Task[];
  onMoveTask: (taskId: string, newBucketId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: Status) => void;
  onAddTask: (bucketId: string, title: string) => void;
  onAddBucket: (name: string) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
}

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  switch (priority) {
    case Priority.URGENT: return <span className="text-red-500 font-bold" title="Urgent">!!</span>;
    case Priority.HIGH: return <span className="text-orange-500 font-bold" title="High">!</span>;
    case Priority.LOW: return <span className="text-blue-400 font-bold" title="Low">↓</span>;
    default: return null;
  }
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  buckets,
  tasks,
  onMoveTask,
  onUpdateTaskStatus,
  onAddTask,
  onAddBucket,
  onDeleteTask,
  onTaskClick
}) => {
  const [newBucketName, setNewBucketName] = useState('');
  const [addingTaskToBucket, setAddingTaskToBucket] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (bucketId: string) => {
    if (newTaskTitle.trim()) {
      onAddTask(bucketId, newTaskTitle);
      setNewTaskTitle('');
      setAddingTaskToBucket(null);
    }
  };

  const handleAddBucket = () => {
    if (newBucketName.trim()) {
      onAddBucket(newBucketName);
      setNewBucketName('');
    }
  };

  return (
    <div className="flex h-full overflow-x-auto p-6 space-x-4 items-start horizontal-scroll bg-ms-offwhite dark:bg-[#000000]">
      {buckets.map(bucket => {
        const bucketTasks = tasks.filter(t => t.bucketId === bucket.id);

        return (
          <div key={bucket.id} className="min-w-[300px] w-[300px] flex flex-col max-h-full">
            {/* Bucket Header */}
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 truncate">{bucket.name}</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{bucketTasks.length}</span>
            </div>

            {/* Add Task Input */}
            <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-t-md p-2">
              {addingTaskToBucket === bucket.id ? (
                <div className="bg-white dark:bg-[#222] p-2 rounded shadow-sm border border-blue-200 dark:border-blue-900/50">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter a task name"
                    className="w-full text-sm outline-none mb-2 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(bucket.id)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAddTask(bucket.id)} className="text-xs py-1">Add</Button>
                    <Button variant="ghost" onClick={() => setAddingTaskToBucket(null)} className="text-xs py-1 text-gray-600 dark:text-gray-400">Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTaskToBucket(bucket.id)}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm w-full p-2 rounded transition-all duration-200 text-sm font-medium"
                >
                  <span className="text-xl leading-none mr-2 text-planner-600">+</span> Add task
                </button>
              )}
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-1 min-h-[100px]">
              {bucketTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="bg-white dark:bg-[#1a1a1a] p-3 rounded-md shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md dark:hover:border-white/20 transition-all group relative cursor-pointer"
                >

                  {/* Task Header / Status Check */}
                  <div className="flex items-start gap-3">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTaskStatus(task.id, task.status === Status.COMPLETED ? Status.NOT_STARTED : Status.COMPLETED);
                      }}
                      className={`mt-1 w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center transition-colors ${task.status === Status.COMPLETED
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-400 hover:border-blue-500'
                        }`}
                    >
                      {task.status === Status.COMPLETED && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>

                    <div className="flex-1">
                      <h4 className={`text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 ${task.status === Status.COMPLETED ? 'line-through text-gray-400 dark:text-gray-600' : ''}`}>
                        {task.title}
                      </h4>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {task.labels.map((label, idx) => (
                          <span key={idx} className="w-8 h-1.5 rounded-full bg-pink-400 block" title={label}></span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <PriorityIcon priority={task.priority} />
                          {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
                          {task.checklist && task.checklist.length > 0 && (
                            <span className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500" title="Checklist items">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              {task.checklist.filter(i => i.isChecked).length}/{task.checklist.length}
                            </span>
                          )}
                        </div>
                        <Avatar name={task.assignee || "Unassigned"} className="w-6 h-6 text-[10px]" />
                      </div>
                    </div>
                  </div>

                  {/* Context Menu (Simulated for Prototype) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="text-xs border border-gray-200 dark:border-white/10 rounded p-1 bg-white dark:bg-[#222] text-gray-600 dark:text-gray-400 outline-none focus:ring-1 focus:ring-blue-500"
                      value={bucket.id}
                      onChange={(e) => onMoveTask(task.id, e.target.value)}
                    >
                      <option value={bucket.id} disabled>Move to...</option>
                      {buckets.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add New Bucket */}
      <div className="min-w-[300px] w-[300px] p-2">
        <div className="bg-white dark:bg-[#1a1a1a] bg-opacity-50 dark:bg-opacity-20 p-2 rounded border border-dashed border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
          <input
            type="text"
            placeholder="Add new bucket"
            className="bg-transparent w-full text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none placeholder-gray-500 dark:placeholder-gray-600"
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBucket()}
          />
        </div>
      </div>
    </div>
  );
};
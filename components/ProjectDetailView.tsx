import React, { useState, useEffect, useRef } from 'react';
import { Project, Task, Status, Priority, Person, Team, ScopeChange, Comment, Risk, RiskLevel, RiskStatus, ActionItem } from '../types';
import { Button, Avatar, Badge, formatDate, Modal } from './UI';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface ProjectDetailViewProps {
   project: Project;
   people: Person[];
   teams: Team[];
   onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
   onDeleteProject?: (projectId: string) => void;
   onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
   onCreateTask: (task: Partial<Task>) => void;
   onDeleteTask: (taskId: string) => void;
   onShare?: () => void;
}

const COLORS = ['#e5e7eb', '#3b82f6', '#10b981']; // Gray (Not Started), Blue (In Progress), Green (Completed)

const ROLES = [
   { key: 'R', label: 'Responsible', description: 'Those who do the work to achieve the task.', color: 'bg-red-100 text-red-800 border-red-200' },
   { key: 'A', label: 'Accountable', description: 'The one ultimately answerable for the correct and thorough completion of the deliverable or task.', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
   { key: 'C', label: 'Consulted', description: 'Those whose opinions are sought, typically subject matter experts.', color: 'bg-blue-100 text-blue-800 border-blue-200' },
   { key: 'I', label: 'Informed', description: 'Those who are kept up-to-date on progress, often only on completion of the task.', color: 'bg-gray-100 text-gray-800 border-gray-200' }
] as const;

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, people, teams, onUpdateProject, onDeleteProject, onUpdateTask, onCreateTask, onDeleteTask, onShare }) => {
   // Modal State
   const [isEditingDetails, setIsEditingDetails] = useState(false);
   const [isRaciModalOpen, setIsRaciModalOpen] = useState(false);
   const [isDiscussionsModalOpen, setIsDiscussionsModalOpen] = useState(false);
   const [discussionSearchQuery, setDiscussionSearchQuery] = useState('');
   const [discussionFilterMode, setDiscussionFilterMode] = useState<'all' | 'myActions' | 'allActions'>('all');
   const [editFormData, setEditFormData] = useState<Partial<Project>>({});

   // Init Form Data when opening modal
   useEffect(() => {
      if (isEditingDetails) {
         setEditFormData({
            name: project.name,
            description: project.description,
            manager: project.manager,
            sponsor: project.sponsor,
            requestor: project.requestor,
            status: project.status,
            startDate: project.startDate,
            dueDate: project.dueDate,
            expectedStartDate: project.expectedStartDate,
            expectedEndDate: project.expectedEndDate,
            scope: project.scope,
            scopeChanges: project.scopeChanges || []
         });
      }
   }, [isEditingDetails, project]);

   // State for the cell user selector popover
   const [activeCell, setActiveCell] = useState<{ role: string, teamId: string } | null>(null);
   const popoverRef = useRef<HTMLDivElement>(null);

   // Risk Management State - Removed


   // Discussions State
   const [newComment, setNewComment] = useState('');
   const [replyText, setReplyText] = useState('');
   const [replyingTo, setReplyingTo] = useState<string | null>(null); // ID of the thread being replied to
   const [showMentionList, setShowMentionList] = useState(false);

   // Click outside listener to close popover
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setActiveCell(null);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, []);

   const handleSaveDetails = () => {
      onUpdateProject(project.id, editFormData);
      setIsEditingDetails(false);
   };

   const handleUpdateScopeChangeInModal = (id: string, field: keyof ScopeChange, value: string) => {
      const updatedChanges = (editFormData.scopeChanges || []).map(sc =>
         sc.id === id ? { ...sc, [field]: value } : sc
      );
      setEditFormData({ ...editFormData, scopeChanges: updatedChanges });
   };

   const handleRemoveScopeChangeInModal = (id: string) => {
      const updatedChanges = (editFormData.scopeChanges || []).filter(sc => sc.id !== id);
      setEditFormData({ ...editFormData, scopeChanges: updatedChanges });
   };

   const handleAddScopeChangeInModal = () => {
      const newChange: ScopeChange = {
         id: Math.random().toString(36).substr(2, 9),
         date: new Date().toISOString().split('T')[0],
         title: '',
         description: '',
         impact: ''
      };
      setEditFormData({
         ...editFormData,
         scopeChanges: [newChange, ...(editFormData.scopeChanges || [])]
      });
   };

   // --- Metrics Calculation ---
   const totalTasks = project.tasks.length;
   const completedTasks = project.tasks.filter(t => t.status === Status.COMPLETED).length;
   const inProgressTasks = project.tasks.filter(t => t.status === Status.IN_PROGRESS).length;
   const notStartedTasks = totalTasks - completedTasks - inProgressTasks;

   const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

   const pieData = [
      { name: 'Not Started', value: notStartedTasks },
      { name: 'In Progress', value: inProgressTasks },
      { name: 'Completed', value: completedTasks },
   ];

   const memberNames = Array.from(new Set([
      project.manager,
      ...project.tasks.map(t => t.assignee).filter(Boolean) as string[]
   ])).sort();

   const getUsersForCell = (role: string, teamId: string) => {
      return memberNames.filter(name => project.raci?.[name]?.[teamId] === role);
   };

   const toggleRaci = (personName: string, teamName: string, role: 'R' | 'A' | 'C' | 'I') => {
      const newRaci = { ...(project.raci || {}) };
      if (!newRaci[personName]) newRaci[personName] = {};

      const currentRole = newRaci[personName][teamName];

      // Toggle logic
      if (currentRole === role) {
         newRaci[personName][teamName] = '' as any;
      } else {
         newRaci[personName][teamName] = role as any;
      }

      onUpdateProject(project.id, { raci: newRaci });
   };

   // Risk Management Logic - Handled inline in grid now


   // --- Discussions Logic ---
   const handleUpdateComment = (commentId: string, updates: Partial<Comment>) => {
      const updatedDiscussions = (project.discussions || []).map(c =>
         c.id === commentId ? { ...c, ...updates } : c
      );
      onUpdateProject(project.id, { discussions: updatedDiscussions });
   };

   const toggleActionItem = (commentId: string) => {
      const comment = project.discussions?.find(c => c.id === commentId);
      if (!comment) return;

      const newState = !comment.isActionItem;
      handleUpdateComment(commentId, {
         isActionItem: newState,
         actionStatus: newState ? 'Open' : undefined
      });
   };

   const markActionSolved = (commentId: string) => {
      handleUpdateComment(commentId, { actionStatus: 'Solved' });
   };

   const deleteDiscussion = (commentId: string, e?: React.MouseEvent) => {
      if (e) {
         e.stopPropagation();
         e.preventDefault();
      }
      console.log('Delete requested for:', commentId);
      if (typeof window !== 'undefined' && confirm('Are you sure you want to delete this thread?')) {
         const updatedDiscussions = (project.discussions || []).filter(c => c.id !== commentId);
         onUpdateProject(project.id, { discussions: updatedDiscussions });
      }
   };

   const handlePostComment = () => {
      if (!newComment.trim()) return;
      const comment: Comment = {
         id: Math.random().toString(36).substr(2, 9),
         author: 'Demo User',
         text: newComment,
         timestamp: new Date().toISOString(),
         isActionItem: false,
         replies: []
      };
      onUpdateProject(project.id, { discussions: [...(project.discussions || []), comment] });
      setNewComment('');
   };

   const handleCommentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNewComment(val);
      if (val.endsWith('@') || (val.includes('@') && !val.includes(' '))) {
         setShowMentionList(true);
      } else {
         setShowMentionList(false);
      }
   };

   const insertMention = (name: string) => {
      setNewComment(prev => prev.replace(/@\w*$/, `@${name} `));
      setShowMentionList(false);
   };

   // --- Timeline Component ---
   const ProjectTimeline = () => {
      if (!project.startDate || !project.dueDate) return null;

      const start = new Date(project.startDate);
      const end = new Date(project.dueDate);
      const startTime = start.getTime();
      const endTime = end.getTime();
      const totalDuration = endTime - startTime;
      const today = new Date().getTime();

      if (totalDuration <= 0) return null;

      const getPos = (d: number) => Math.max(0, Math.min(100, ((d - startTime) / totalDuration) * 100));
      const todayPos = getPos(today);

      const milestones = project.tasks
         .filter(t => t.isMilestone && t.dueDate)
         .map(t => ({
            ...t,
            pos: getPos(new Date(t.dueDate!).getTime())
         }));

      const getTicks = () => {
         const ticks = [];
         const current = new Date(start);
         current.setDate(1);
         if (start.getDate() > 1) {
            current.setMonth(current.getMonth() + 1);
         }
         while (current <= end) {
            ticks.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
         }
         return ticks;
      };

      let ticks = getTicks();
      if (ticks.length > 24) {
         ticks = ticks.filter((_, i) => i % 3 === 0);
      }

      return (
         <div className="w-full h-[200px] mt-4 mb-4 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 pb-8 relative select-none shadow-xl dark:shadow-2xl transition-colors duration-300">

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
               <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-transparent">
                     <span className="text-lg">📅</span>
                  </div>
                  Project Timeline
               </h3>
               <div className="text-xs font-medium text-gray-500 font-mono tracking-tight">
                  {Math.ceil(totalDuration / (1000 * 60 * 60 * 24))} Days Total
               </div>
            </div>

            <div className="relative h-12 mx-8">
               {/* Main Track Line (Subtle) */}
               <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-gray-200 dark:bg-[#1a1a1a] rounded-full transform -translate-y-1/2"></div>

               {/* Elastped Time Gradient (Subtle Glow) */}
               {todayPos > 0 && (
                  <div
                     className="absolute top-1/2 left-0 h-[3px] bg-gradient-to-r from-transparent via-purple-500/50 to-purple-600/80 dark:via-purple-900/50 dark:to-purple-500/50 transform -translate-y-1/2 blur-[2px]"
                     style={{ width: `${Math.min(todayPos, 100)}%` }}
                  ></div>
               )}

               {/* Start Point */}
               <div className="absolute top-1/2 left-0 z-10 flex flex-col items-start transform -translate-y-1/2">
                  {/* Marker on track - Centered on line start */}
                  <div className="w-1 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mb-0 transform -translate-x-1/2 relative z-20"></div>

                  {/* Start Pill - Left Aligned to Start */}
                  <div className="absolute top-full mt-3 bg-white dark:bg-black border border-gray-200 dark:border-white/5 border-t-white/50 dark:border-t-white/10 rounded-2xl px-4 py-1.5 flex flex-col items-start min-w-[100px] shadow-lg dark:shadow-2xl z-20">
                     <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5 leading-tight">Start</span>
                     <span className="text-sm font-bold text-gray-900 dark:text-gray-200 leading-tight">{formatDate(project.startDate)}</span>
                  </div>
               </div>

               {/* End Point */}
               <div className="absolute top-1/2 right-0 z-10 flex flex-col items-end transform -translate-y-1/2">
                  {/* Marker on track - Centered on line end */}
                  <div className="w-1 h-3 rounded-full bg-gray-400 dark:bg-gray-600 mb-0 transform translate-x-1/2 relative z-20"></div>

                  {/* End Pill - Right Aligned to End */}
                  <div className="absolute top-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-white/5 border-t-white/50 dark:border-t-white/10 rounded-2xl px-4 py-1.5 flex flex-col items-end min-w-[100px] shadow-lg dark:shadow-2xl z-20">
                     <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5 leading-tight">Due</span>
                     <span className="text-sm font-bold text-gray-900 dark:text-gray-200 leading-tight">{formatDate(project.dueDate)}</span>
                  </div>
               </div>

               {/* Ticks (Months) */}
               {ticks.map((date, idx) => {
                  const pos = getPos(date.getTime());
                  if (pos < 12 || pos > 88) return null;
                  return (
                     <div key={idx} className="absolute top-1/2 w-0.5 h-1.5 bg-gray-300 dark:bg-white/20 transform -translate-y-1/2 rounded-full" style={{ left: `${pos}%` }}>
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 tracking-wide font-mono">
                           {date.toLocaleDateString('en-GB', { month: 'short' })}
                        </div>
                     </div>
                  );
               })}

               {/* Today Marker */}
               {todayPos >= 0 && todayPos <= 100 && (
                  <div className="absolute top-0 bottom-0 w-px z-20 pointer-events-none" style={{ left: `${todayPos}%` }}>
                     {/* Vertical Line Gradient (Laser) - Connecting Pill to Track */}
                     <div className="absolute -top-3 bottom-1/2 left-0 w-[1px] bg-gradient-to-t from-pink-500 via-pink-500/50 to-transparent"></div>

                     {/* The Glowing Dot on Track (Solid) */}
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,1)] z-10"></div>

                     {/* Today Pill (Floating Above) */}
                     <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className="bg-pink-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-lg shadow-pink-500/20 whitespace-nowrap tracking-wider flex items-center gap-1">
                           <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                           TODAY
                        </div>
                     </div>
                  </div>
               )}

               {/* Milestones (Subtle Gems) */}
               {milestones.map(m => (
                  <div key={m.id} className="absolute top-1/2 z-30 transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.pos}%` }}>
                     <div className="relative group cursor-pointer">
                        <div className="w-2 h-2 bg-amber-400 dark:bg-[#fbbf24] rotate-45 shadow-[0_0_6px_rgba(251,191,36,0.3)] opacity-80 group-hover:scale-150 transition-all duration-300"></div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-black/90 text-gray-900 dark:text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-200 dark:border-white/10 shadow-xl z-50">
                           {m.title}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );



   };

   return (
      <div className="flex-1 overflow-y-auto bg-ms-offwhite dark:bg-[#000000] relative">
         <div className="max-w-6xl mx-auto p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

               <div className="lg:col-span-9 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-0 shadow-sm overflow-hidden flex flex-col md:flex-row">
                  {/* Left Side: Project Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{project.name}</h1>
                           <Badge color={
                              project.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                 project.status === 'Planning' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    project.status === 'On Hold' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                       'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                           }>
                              {project.status}
                           </Badge>
                        </div>
                        <p className="text-gray-500 dark:text-gray-500 text-xs mb-3 line-clamp-1 italic">{project.description}</p>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                              <div>
                                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">Project Requestor</div>
                                 <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <Avatar name={project.requestor} className="w-6 h-6 text-[10px]" />
                                    {project.requestor || '—'}
                                 </div>
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">Expected Timeline</div>
                                 <div className="text-sm text-gray-700 dark:text-gray-300 font-mono font-medium">
                                    {formatDate(project.expectedStartDate || project.startDate)} — {formatDate(project.expectedEndDate || project.dueDate)}
                                 </div>
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">Project Lead</div>
                                 <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <Avatar name={project.manager} className="w-6 h-6 text-[10px]" />
                                    {project.manager}
                                 </div>
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">Scheduled Timeline</div>
                                 <div className="text-sm text-gray-700 dark:text-gray-300 font-mono font-medium">
                                    {formatDate(project.startDate)} — {formatDate(project.dueDate)}
                                 </div>
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">Project Sponsor</div>
                                 <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-bold">
                                    <Avatar name={project.sponsor || ''} className="w-6 h-6 text-[10px]" />
                                    {project.sponsor || '—'}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Side: Execution Progress + Discussion Stats */}
                  <div className="w-full md:w-80 p-4 flex flex-col justify-between shrink-0 bg-gray-50/30 dark:bg-white/5">
                     {/* Pie Chart Section */}
                     <div className="flex flex-col items-center justify-center flex-1">
                        <div className="w-32 h-32 relative mb-2">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={pieData}
                                    innerRadius={45}
                                    outerRadius={58}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                 >
                                    {COLORS.map((color, index) => <Cell key={index} fill={color} />)}
                                 </Pie>
                                 <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px', fontSize: '10px' }}
                                    itemStyle={{ color: '#fff' }}
                                 />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-bold dark:text-white leading-none">{progressPercent}%</span>
                              <span className="text-[8px] uppercase font-bold text-gray-400 tracking-tighter">Complete</span>
                           </div>
                        </div>

                        {/* Status Legend */}
                        <div className="w-full space-y-2 mb-3">
                           <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                 <span className="text-gray-600 dark:text-gray-400 font-medium">Completed</span>
                              </div>
                              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{project.tasks.filter(t => t.status === Status.COMPLETED).reduce((acc, t) => acc + (t.effort || 0), 0)}h</span>
                           </div>
                           <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                                 <span className="text-gray-600 dark:text-gray-400 font-medium">In Progress</span>
                              </div>
                              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{project.tasks.filter(t => t.status === Status.IN_PROGRESS).reduce((acc, t) => acc + (t.effort || 0), 0)}h</span>
                           </div>
                           <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-[#e5e7eb]"></div>
                                 <span className="text-gray-600 dark:text-gray-400 font-medium">Not Started</span>
                              </div>
                              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{project.tasks.filter(t => t.status === Status.NOT_STARTED).reduce((acc, t) => acc + (t.effort || 0), 0)}h</span>
                           </div>
                           <div className="pt-2 mt-2 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-bold">
                              <span className="bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase text-gray-600 dark:text-gray-400">Total Efforts</span>
                              <span className="font-mono text-planner-600">{project.tasks.reduce((acc, t) => acc + (t.effort || 0), 0)}h</span>
                           </div>
                        </div>
                     </div>

                     {/* Discussion Stats Section (New) */}
                     <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Collaboration Stats</div>
                        <div className="flex items-center justify-around">
                           <div className="flex flex-col items-center">
                              <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">Total</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{project.discussions?.filter(d => d.isActionItem).length || 0}</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-[8px] uppercase font-bold text-emerald-500 tracking-widest mb-0.5">Solved</span>
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{project.discussions?.filter(d => d.isActionItem && d.actionStatus === 'Solved').length || 0}</span>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-[8px] uppercase font-bold text-amber-500 tracking-widest mb-0.5">Open</span>
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none">{project.discussions?.filter(d => d.isActionItem && d.actionStatus !== 'Solved').length || 0}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-3 flex flex-col gap-2">
                  <button onClick={() => setIsEditingDetails(true)} className="flex-1 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left">
                     <div className="p-2.5 bg-planner-50 dark:bg-planner-900/20 rounded-xl text-planner-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                     </div>
                     <div>
                        <div className="text-[9px] font-bold text-planner-600 uppercase tracking-wider">Configure</div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">Edit Details</div>
                     </div>
                  </button>
                  <button onClick={() => setIsRaciModalOpen(true)} className="flex-1 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left">
                     <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 group-hover:scale-110 transition-transform text-lg">📊</div>
                     <div>
                        <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Stakeholders</div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">RACI Matrix</div>
                     </div>
                  </button>
                  <button onClick={() => setIsDiscussionsModalOpen(true)} className="flex-1 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left">
                     <div className="p-2.5 bg-purple-50 dark:bg-[#464EB8]/20 rounded-xl text-[#464EB8] group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                     </div>
                     <div>
                        <div className="text-[9px] font-bold text-[#464EB8] uppercase tracking-wider">Collaboration</div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">Discussions</div>
                     </div>
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-12 space-y-8">
                  <ProjectTimeline />
                  <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[500px]">
                     <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/30 dark:bg-white/5 shrink-0">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><span className="text-planner-600">🛡️</span> Risk Register</h3>
                        <Button onClick={() => {
                           const blankRisk: Risk = {
                              id: Math.random().toString(36).substr(2, 9),
                              creationDate: new Date().toISOString().split('T')[0],
                              description: '',
                              cause: '',
                              effects: '',
                              category1: '',
                              category2: 'Scope / Design',
                              mitigationType: 'Avoid',
                              mitigationMeasure: '',
                              responsibility: '',
                              targetDate: '',
                              status: 'Open',
                              comments: ''
                           };
                           const updatedRisks = [...(project.risks || []), blankRisk];
                           onUpdateProject(project.id, { risks: updatedRisks });
                        }} className="text-[10px] py-1 h-7 font-bold uppercase tracking-wider" variant="secondary">+ Add Risk Row</Button>
                     </div>

                     <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-xs border-collapse">
                           <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-gray-100 dark:border-white/10 sticky top-0 z-10">
                              <tr>
                                 <th className="px-3 py-2 min-w-[100px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Creation Date</th>
                                 <th className="px-3 py-2 min-w-[200px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Risk Description</th>
                                 <th className="px-3 py-2 min-w-[150px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Reason / Cause</th>
                                 <th className="px-3 py-2 min-w-[150px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Effects of Risks</th>
                                 <th className="px-3 py-2 min-w-[120px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Risk Category 1</th>
                                 <th className="px-3 py-2 min-w-[150px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Risk Category 2</th>
                                 <th className="px-3 py-2 min-w-[150px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Mitigation Type</th>
                                 <th className="px-3 py-2 min-w-[200px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Mitigation Measure</th>
                                 <th className="px-3 py-2 min-w-[120px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Responsibility</th>
                                 <th className="px-3 py-2 min-w-[100px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Target Date</th>
                                 <th className="px-3 py-2 min-w-[100px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Completion Date</th>
                                 <th className="px-3 py-2 min-w-[100px] bg-gray-50 dark:bg-[#111] border-r border-gray-100 dark:border-white/5">Current Status</th>
                                 <th className="px-3 py-2 min-w-[200px] bg-gray-50 dark:bg-[#111]">Comments</th>
                                 <th className="px-2 py-2 w-[40px] bg-gray-50 dark:bg-[#111]"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {project.risks?.map((risk, index) => (
                                 <tr key={risk.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5">
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input type="date" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.creationDate || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], creationDate: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.description} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], description: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.cause || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], cause: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.effects || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], effects: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.category1 || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], category1: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <select className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.category2 || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], category2: e.target.value as any };
                                          onUpdateProject(project.id, { risks: updated });
                                       }}>
                                          <option value="Scope / Design">Scope / Design</option>
                                          <option value="Functions / Timeline">Functions / Timeline</option>
                                          <option value="Resource">Resource</option>
                                       </select>
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <select className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.mitigationType || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], mitigationType: e.target.value as any };
                                          onUpdateProject(project.id, { risks: updated });
                                       }}>
                                          <option value="Avoid">Avoid</option>
                                          <option value="Reduce">Reduce</option>
                                          <option value="Transfer">Transfer</option>
                                          <option value="Acceptance">Acceptance</option>
                                          <option value="Sharing">Sharing</option>
                                          <option value="Monitor">Monitor</option>
                                          <option value="Contingency Planning">Contingency Planning</option>
                                       </select>
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.mitigationMeasure || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], mitigationMeasure: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.responsibility || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], responsibility: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input type="date" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.targetDate || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], targetDate: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <input type="date" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.completionDate || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], completionDate: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-0 border-r border-gray-100 dark:border-white/5">
                                       <select className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.status || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], status: e.target.value as any };
                                          onUpdateProject(project.id, { risks: updated });
                                       }}>
                                          <option value="Open">Open</option>
                                          <option value="Mitigated">Mitigated</option>
                                          <option value="Closed">Closed</option>
                                       </select>
                                    </td>
                                    <td className="p-0">
                                       <input className="w-full h-full p-2 bg-transparent outline-none focus:bg-white dark:focus:bg-black text-gray-900 dark:text-gray-100" value={risk.comments || ''} onChange={(e) => {
                                          const updated = [...(project.risks || [])];
                                          updated[index] = { ...updated[index], comments: e.target.value };
                                          onUpdateProject(project.id, { risks: updated });
                                       }} />
                                    </td>
                                    <td className="p-2 text-center">
                                       <button onClick={() => {
                                          const updated = (project.risks || []).filter(r => r.id !== risk.id);
                                          onUpdateProject(project.id, { risks: updated });
                                       }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              {(!project.risks || project.risks.length === 0) && (
                                 <tr>
                                    <td colSpan={14} className="px-6 py-8 text-center text-sm text-gray-400 italic">No risks recorded yet. Click "+ Add Risk Row" to begin.</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>

            <Modal isOpen={isRaciModalOpen} onClose={() => setIsRaciModalOpen(false)} title={`RACI Matrix — ${project.name}`} maxWidth="max-w-6xl">
               <div className="overflow-hidden border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm border-collapse">
                        <thead>
                           <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                              <th className="px-6 py-4 w-48 font-bold text-gray-400 dark:text-gray-500 uppercase text-[10px] tracking-widest sticky left-0 bg-gray-50 dark:bg-[#111] z-10">Role / Function</th>
                              {teams.map(team => <th key={team.id} className="px-6 py-4 min-w-[160px] font-bold text-gray-800 dark:text-gray-100 uppercase text-[10px] tracking-widest text-center border-l border-gray-200/50 dark:border-white/5">{team.name}</th>)}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                           {ROLES.map(role => (
                              <tr key={role.key} className="group hover:bg-gray-50 dark:hover:bg-white/5">
                                 <td className="px-6 py-4 sticky left-0 bg-white dark:bg-[#111] z-10 border-r border-gray-200 dark:border-white/10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]" title={role.description}>
                                    <div className="flex flex-row items-center gap-3">
                                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${role.key === 'R' ? 'bg-red-500 text-white' : role.key === 'A' ? 'bg-amber-500 text-white' : role.key === 'C' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>{role.key}</span>
                                       <span className="font-bold text-gray-900 dark:text-gray-100 uppercase text-[10px] tracking-tight">{role.label}</span>
                                    </div>
                                 </td>
                                 {teams.map(team => {
                                    const assignedUsers = getUsersForCell(role.key, team.name);
                                    return (
                                       <td key={team.id} className="px-4 py-3 border-l border-gray-100 dark:border-white/5 align-middle">
                                          <div className="flex flex-wrap gap-2 justify-center">
                                             {assignedUsers.length > 0 ? assignedUsers.map(name => (
                                                <div key={name} className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 pl-1 pr-2 py-0.5 rounded-full border border-gray-200/50 hover:border-planner-600 transition-colors cursor-pointer group/user" onClick={() => toggleRaci(name, team.name, role.key as any)}>
                                                   <Avatar name={name} className="w-5 h-5 text-[8px]" />
                                                   <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                                </div>
                                             )) : <div className="text-[10px] text-gray-300 italic">—</div>}
                                          </div>
                                          <div className="mt-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button className="text-[9px] font-bold text-planner-600 uppercase tracking-widest hover:underline" onClick={() => setActiveCell({ role: role.key, teamId: team.name })}>+ Assign</button>
                                          </div>
                                          {activeCell?.role === role.key && activeCell?.teamId === team.name && (
                                             <div ref={popoverRef} className="absolute mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl z-50 p-2">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase p-2 border-b border-gray-100 mb-1">Assign to {role.key}</div>
                                                <div className="max-h-40 overflow-y-auto">
                                                   {people.map(p => {
                                                      const isAssigned = project.raci?.[p.name]?.[team.name] === role.key;
                                                      return (
                                                         <button key={p.id} onClick={() => toggleRaci(p.name, team.name, role.key as any)} className={`w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-xs ${isAssigned ? 'text-planner-600 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            <div className="flex items-center gap-2"><Avatar name={p.name} className="w-5 h-5 text-[8px]" />{p.name}</div>
                                                            {isAssigned && <span>✓</span>}
                                                         </button>
                                                      );
                                                   })}
                                                </div>
                                             </div>
                                          )}
                                       </td>
                                    );
                                 })}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
               <div className="mt-8 flex justify-end">
                  <Button onClick={() => setIsRaciModalOpen(false)}>Close Matrix</Button>
               </div>
            </Modal>

            <Modal
               isOpen={isDiscussionsModalOpen}
               onClose={() => setIsDiscussionsModalOpen(false)}
               title="Project Discussions"
               maxWidth="max-w-[95vw]"
               noPadding={true}
               noScroll={true}
               headerContent={
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-4">
                     {/* Search Input */}
                     <div className="flex-1 w-full relative max-w-xl">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                           type="text"
                           placeholder="Search conversations..."
                           className="w-full pl-10 pr-4 py-1.5 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                           value={discussionSearchQuery}
                           onChange={(e) => setDiscussionSearchQuery(e.target.value)}
                        />
                     </div>

                     {/* Filters */}
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setDiscussionFilterMode('all')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${discussionFilterMode === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                           All
                        </button>
                        <button
                           onClick={() => setDiscussionFilterMode('myActions')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${discussionFilterMode === 'myActions' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                           My Actions
                        </button>
                        <button
                           onClick={() => setDiscussionFilterMode('allActions')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${discussionFilterMode === 'allActions' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                           All Actions
                        </button>
                     </div>

                     {/* Stats */}
                     <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-white/10 hidden md:flex">
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total</span>
                           <span className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{project.discussions?.filter(d => d.isActionItem).length || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Solved</span>
                           <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{project.discussions?.filter(d => d.isActionItem && d.actionStatus === 'Solved').length || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Open</span>
                           <span className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none">{project.discussions?.filter(d => d.isActionItem && d.actionStatus !== 'Solved').length || 0}</span>
                        </div>
                     </div>
                  </div>
               }
            >
               <div className="flex flex-col h-[85vh] bg-white dark:bg-[#1a1a1a]">

                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-black/20 space-y-6">
                     {(!project.discussions || project.discussions.length === 0) && (
                        <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 h-full">
                           <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                           </div>
                           <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No conversations yet</h3>
                           <p className="text-sm text-gray-500">Start a new discussion to collaborate with the team.</p>
                        </div>
                     )}

                     {project.discussions?.filter(post => {
                        const query = discussionSearchQuery.toLowerCase();
                        const matchesSearch = post.text.toLowerCase().includes(query) || post.author.toLowerCase().includes(query) || post.replies?.some(r => r.text.toLowerCase().includes(query));

                        if (!matchesSearch) return false;

                        if (discussionFilterMode === 'myActions') {
                           // Mock "Me" check - normally would be context user
                           const isAssigned = post.responsibility === 'Me' || post.responsibility === 'Vinoth'; // Adjust based on user context
                           const isMentioned = post.text.includes('@Me') || post.replies?.some(r => r.text.includes('@Me'));
                           return isAssigned || isMentioned;
                        }
                        if (discussionFilterMode === 'allActions') {
                           return post.isActionItem;
                        }
                        return true;
                     }).map(post => (
                        <div key={post.id} className={`group flex gap-4 ${post.isActionItem ? (post.actionStatus === 'Solved' ? 'mx-0 bg-emerald-50/50 dark:bg-emerald-900/5 -mx-4 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10' : 'mx-0 bg-amber-50/30 dark:bg-amber-900/10 -mx-4 p-4 rounded-xl border border-amber-100/50 dark:border-amber-500/10') : ''}`}>
                           <div className="flex-shrink-0">
                              <Avatar name={post.author} className="w-10 h-10 shadow-sm" />
                           </div>
                           <div className="flex-1 min-w-0">
                              {/* Header Row: Author + Action Controls */}
                              <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
                                 <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{post.author}</span>
                                    <span className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</span>
                                    {post.isActionItem && (
                                       <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                          Action Item
                                       </span>
                                    )}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-[#1a1a1a] shadow-sm rounded-lg border border-gray-100 dark:border-white/5 p-1 ml-2">
                                       <button onClick={() => toggleActionItem(post.id)} className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 ${post.isActionItem ? 'text-amber-500' : 'text-gray-400'}`} title={post.isActionItem ? "Remove Action Item" : "Mark as Action Item"}>
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                       </button>
                                       <button onClick={(e) => deleteDiscussion(post.id, e)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors" title="Delete Thread">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                    </div>
                                 </div>

                                 {/* Inline Action Controls */}
                                 {post.isActionItem && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                       <div className="flex flex-col">
                                          <label className="text-[8px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-0.5">Responsibility</label>
                                          <select
                                             className="bg-white/50 dark:bg-black/20 border border-amber-200 dark:border-amber-500/20 rounded py-0.5 px-1 text-[10px] font-medium focus:ring-1 focus:ring-amber-500 outline-none w-32"
                                             value={post.responsibility || ''}
                                             onChange={(e) => handleUpdateComment(post.id, { responsibility: e.target.value })}
                                          >
                                             <option value="">Unassigned</option>
                                             {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                          </select>
                                       </div>
                                       <div className="flex flex-col">
                                          <label className="text-[8px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-0.5">Target Date</label>
                                          <input
                                             type="date"
                                             className="bg-white/50 dark:bg-black/20 border border-amber-200 dark:border-amber-500/20 rounded py-0.5 px-1 text-[10px] font-mono focus:ring-1 focus:ring-amber-500 outline-none w-28"
                                             value={post.targetDate || ''}
                                             onChange={(e) => handleUpdateComment(post.id, { targetDate: e.target.value })}
                                          />
                                       </div>
                                       <button onClick={() => markActionSolved(post.id)} className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${post.actionStatus === 'Solved' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}>
                                          {post.actionStatus === 'Solved' ? (
                                             <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                Solved
                                             </>
                                          ) : (
                                             <>Mark Solved</>
                                          )}
                                       </button>
                                    </div>
                                 )}
                              </div>

                              <div className="bg-white dark:bg-[#1f1f1f] rounded-lg p-4 shadow-sm border border-gray-100 dark:border-white/5 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                 {post.text}
                              </div>



                              {/* Replies */}
                              {post.replies && post.replies.length > 0 && (
                                 <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-white/10 ml-2">
                                    {post.replies.map(reply => (
                                       <div key={reply.id} className="flex gap-3">
                                          <Avatar name={reply.author} className="w-8 h-8 rounded-md" />
                                          <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{reply.author}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(reply.timestamp).toLocaleString()}</span>
                                             </div>
                                             <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1f1f1f] p-3 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm inline-block">
                                                {reply.text}
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* Reply Button / Input */}
                              <div className="mt-2 ml-2 pl-4 border-l-2 border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                                 {replyingTo === post.id ? (
                                    <div className="mt-2 flex gap-3 animate-in fade-in slide-in-from-top-1">
                                       <Avatar name="Me" className="w-8 h-8 rounded-md" />
                                       <div className="flex-1 space-y-2">
                                          <textarea
                                             className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/20 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                             placeholder="Reply to this thread..."
                                             rows={2}
                                             value={replyText}
                                             onChange={(e) => setReplyText(e.target.value)}
                                             autoFocus
                                          />
                                          <div className="flex justify-start gap-2">
                                             <Button onClick={() => {
                                                if (!replyText.trim()) return;
                                                const reply = { id: Math.random().toString(36).substr(2, 9), author: 'Demo User', text: replyText, timestamp: new Date().toISOString() };
                                                handleUpdateComment(post.id, { replies: [...(post.replies || []), reply] });
                                                setReplyText('');
                                                setReplyingTo(null);
                                             }} className="bg-indigo-600 hover:bg-indigo-700 text-white">Reply</Button>
                                             <Button variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                                          </div>
                                       </div>
                                    </div>
                                 ) : (
                                    <button onClick={() => setReplyingTo(post.id)} className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 mt-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                       Reply
                                    </button>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* New Conversation Input */}
                  <div className="p-6 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-white/10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-10">
                     <div className="flex gap-4">
                        <div className="pt-1">
                           <Avatar name="Me" className="w-10 h-10 rounded-lg" />
                        </div>
                        <div className="flex-1 relative">
                           {showMentionList && (
                              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                 {people.map(p => (
                                    <button key={p.id} onClick={() => insertMention(p.name)} className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm flex items-center gap-2">
                                       <Avatar name={p.name} className="w-5 h-5 text-[9px]" />
                                       {p.name}
                                    </button>
                                 ))}
                              </div>
                           )}
                           <div className="relative">
                              <textarea
                                 className="w-full bg-[#f8f9fa] dark:bg-[#111] border border-gray-300 dark:border-white/10 rounded-xl p-4 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-inner"
                                 placeholder="Start a new conversation. Type @ to mention someone."
                                 rows={2}
                                 value={newComment}
                                 onChange={handleCommentInput}
                              />
                              <div className="absolute right-2 bottom-2">
                                 <button
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim()}
                                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 text-white rounded-lg transition-colors shadow-md"
                                 >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                 </button>
                              </div>
                           </div>
                           <div className="mt-2 flex gap-2">
                              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors" title="Format">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                              </button>
                              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors" title="Attach">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              </button>
                              <div className="border-r border-gray-300 dark:border-white/10 mx-1 h-6 self-center"></div>
                              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors" title="Emoji">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </Modal>

            <Modal isOpen={isEditingDetails} onClose={() => setIsEditingDetails(false)} title="Edit Project Details" maxWidth="max-w-4xl">
               <div className="space-y-6 pr-2">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Project Name</label>
                        <input className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-planner-600 outline-none shadow-inner" value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                     </div>
                     <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Description</label>
                        <textarea className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-planner-600 outline-none shadow-inner" rows={2} value={editFormData.description || ''} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Project Lead</label>
                        <select className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 outline-none" value={editFormData.manager || ''} onChange={(e) => setEditFormData({ ...editFormData, manager: e.target.value })}>
                           {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Project Sponsor</label>
                        <select className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 outline-none" value={editFormData.sponsor || ''} onChange={(e) => setEditFormData({ ...editFormData, sponsor: e.target.value })}>
                           <option value="">Select Sponsor</option>
                           {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Status</label>
                        <select className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 outline-none" value={editFormData.status || ''} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}>
                           <option value="Planning">Planning</option><option value="Active">Active</option><option value="On Hold">On Hold</option><option value="Completed">Completed</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Exp. Start Date</label>
                           <input type="date" className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono" value={editFormData.expectedStartDate || ''} onChange={(e) => setEditFormData({ ...editFormData, expectedStartDate: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Exp. End Date</label>
                           <input type="date" className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono" value={editFormData.expectedEndDate || ''} onChange={(e) => setEditFormData({ ...editFormData, expectedEndDate: e.target.value })} />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Sch. Start Date</label>
                           <input type="date" className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono" value={editFormData.startDate || ''} onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Sch. Due Date</label>
                           <input type="date" className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono" value={editFormData.dueDate || ''} onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })} />
                        </div>
                     </div>
                     <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-widest">Scope Statement</label>
                        <textarea className="w-full bg-white dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-planner-600 outline-none shadow-inner min-h-[100px]" rows={4} placeholder="Define the project scope..." value={editFormData.scope || ''} onChange={(e) => setEditFormData({ ...editFormData, scope: e.target.value })} />
                     </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                     <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scope Change Log</label>
                        <Button variant="ghost" onClick={handleAddScopeChangeInModal} className="text-[10px] h-7 px-3 uppercase font-bold tracking-widest">+ Add Record</Button>
                     </div>
                     <div className="space-y-4">
                        {editFormData.scopeChanges?.map(sc => (
                           <div key={sc.id} className="p-4 bg-gray-50/30 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/10 relative">
                              <div className="grid grid-cols-12 gap-4">
                                 <div className="col-span-3">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Date</label>
                                    <input type="date" className="w-full bg-white dark:bg-[#000] border border-gray-100 dark:border-white/10 rounded-lg p-2 text-xs" value={sc.date} onChange={(e) => handleUpdateScopeChangeInModal(sc.id, 'date', e.target.value)} />
                                 </div>
                                 <div className="col-span-6">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Title</label>
                                    <input className="w-full bg-white dark:bg-[#000] border border-gray-100 dark:border-white/10 rounded-lg p-2 text-xs font-bold" value={sc.title} onChange={(e) => handleUpdateScopeChangeInModal(sc.id, 'title', e.target.value)} />
                                 </div>
                                 <div className="col-span-3 text-right">
                                    <button onClick={() => handleRemoveScopeChangeInModal(sc.id)} className="text-[10px] text-red-500 uppercase font-bold hover:underline">Remove</button>
                                 </div>
                                 <div className="col-span-8">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Impact / Notes</label>
                                    <textarea className="w-full bg-white dark:bg-[#000] border border-gray-100 dark:border-white/10 rounded-lg p-2 text-xs" rows={2} value={sc.description} onChange={(e) => handleUpdateScopeChangeInModal(sc.id, 'description', e.target.value)} />
                                 </div>
                                 <div className="col-span-4">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Impact Measure</label>
                                    <input className="w-full bg-white dark:bg-[#000] border border-gray-100 dark:border-white/10 rounded-lg p-2 text-xs text-amber-600 font-bold" value={sc.impact} onChange={(e) => handleUpdateScopeChangeInModal(sc.id, 'impact', e.target.value)} />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="pt-8 flex justify-between items-center gap-3">
                     {onDeleteProject && (
                        <button
                           onClick={() => {
                              if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                                 onDeleteProject(project.id);
                              }
                           }}
                           className="px-4 h-12 uppercase font-bold tracking-widest text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                           Delete Project
                        </button>
                     )}
                     <div className="flex gap-3 ml-auto">
                        <Button variant="ghost" onClick={() => setIsEditingDetails(false)} className="px-8 h-12 uppercase font-bold tracking-widest text-[11px]">Cancel</Button>
                        <Button onClick={handleSaveDetails} className="px-8 h-12 uppercase font-bold tracking-widest text-[11px] shadow-lg shadow-planner-600/20">Save Changes</Button>
                     </div>
                  </div>
               </div>
            </Modal>
         </div >
      </div >
   );
};

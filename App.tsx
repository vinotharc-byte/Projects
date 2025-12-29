import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, Task, Person, Status, ViewMode, Priority } from './types';
import { Button, Avatar, Badge, formatDate } from './components/UI';
import { GridView } from './components/GridView';
import { TaskBoard } from './components/TaskBoard';
import { TimelineView } from './components/TimelineView';
import { ChartsView } from './components/ChartsView';
import { ProjectTemplatesView } from './components/ProjectTemplatesView';
import { ProjectMasterView } from './components/ProjectMasterView';
import { PeopleView } from './components/PeopleView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ShareModal } from './components/ShareModal';
import { MyDayView } from './components/MyDayView';
import { MyDayView2 } from './components/MyDayView2';
import { MyTasksView } from './components/MyTasksView';
import { ResourceHeatmapView } from './components/ResourceHeatmapView';
import { SettingsView } from './components/SettingsView';
import { ProjectRequestForm } from './components/ProjectRequestForm'; // Added import
import { generateProjectPlan } from './services/geminiService';

// -- Helper: Date strings --
const dateStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// -- Sample Data: People --
const INITIAL_PEOPLE: Person[] = [
  { id: 'p1', name: 'Robert Chen', role: 'Lead Mechanical Engineer', team: 'Mechanical', manager: 'Sarah Johnson', joinDate: '2022-03-15', email: 'robert@projects.com', status: 'Active' },
  { id: 'p2', name: 'Sarah Johnson', role: 'Operations Director', team: 'Management', manager: 'CEO', joinDate: '2020-01-10', email: 'sarah@projects.com', status: 'Active' },
  { id: 'p3', name: 'Emily White', role: 'HVAC Specialist', team: 'Mechanical', manager: 'Sarah Johnson', joinDate: '2021-06-20', email: 'emily@projects.com', status: 'Active' },
  { id: 'p4', name: 'Maria Rodriguez', role: 'Design Engineer', team: 'Design', manager: 'David Kim', joinDate: '2022-11-01', email: 'maria@projects.com', status: 'Active' },
  { id: 'p5', name: 'David Kim', role: 'Project Manager', team: 'Management', manager: 'Sarah Johnson', joinDate: '2019-05-15', email: 'david@projects.com', status: 'Active' },
  { id: 'p6', name: 'James Wilson', role: 'Site Supervisor', team: 'Field Ops', manager: 'David Kim', joinDate: '2023-01-10', email: 'james@projects.com', status: 'Active' },
  { id: 'p7', name: 'Lisa Zhang', role: 'CAD Technician', team: 'Design', manager: 'Maria Rodriguez', joinDate: '2023-05-20', email: 'lisa@projects.com', status: 'Active' },
];

const INITIAL_TEAMS = [
  { id: 't1', name: 'Mechanical' },
  { id: 't2', name: 'Design' },
  { id: 't3', name: 'Field Ops' },
  { id: 't4', name: 'Management' }
];

// -- Helper for Task Generation --
const generateDemoTasks = (projectId: string, startOffset: number): Task[] => {
  const tasks: Task[] = [];
  const disciplines = ['Design Review', 'Procurement', 'Structural Work', 'Electrical Integration', 'Testing', 'Final Handover'];
  const assignees = ['Robert Chen', 'Emily White', 'Maria Rodriguez', 'James Wilson', 'Lisa Zhang'];

  // Create a parent task for the whole phase
  const parentId = `${projectId}_parent`;
  tasks.push({
    id: parentId,
    title: 'Phase 1: Mobilization & Planning',
    description: 'Initial site setup and resource planning.',
    bucketId: 'b1',
    priority: Priority.HIGH,
    status: Status.IN_PROGRESS,
    labels: ['Planning'],
    assignee: 'David Kim',
    startDate: dateStr(startOffset),
    dueDate: dateStr(startOffset + 20),
    effort: 80,
    allocation: 100
  });

  // Generate 20 tasks to ensure density and coverage
  for (let i = 1; i <= 20; i++) {
    const isSubtask = i > 4 && i < 15;
    const taskStatus = i < 5 ? Status.COMPLETED : i < 12 ? Status.IN_PROGRESS : Status.NOT_STARTED;

    // Cluster tasks around the current date (dateStr(0))
    // we use (i * 3) - 15 to spread them out around -15 to +45 relative to startOffset
    const start = startOffset + (i * 3) - 15;
    const duration = 5 + (i % 7);

    tasks.push({
      id: `${projectId}_t${i}`,
      parentId: isSubtask ? parentId : undefined,
      title: `${disciplines[i % disciplines.length]} - Step ${i}`,
      description: `Detailed execution of ${disciplines[i % disciplines.length].toLowerCase()} for the demo project.`,
      bucketId: i < 6 ? 'b3' : i < 14 ? 'b2' : 'b1',
      priority: i % 5 === 0 ? Priority.URGENT : i % 3 === 0 ? Priority.HIGH : Priority.MEDIUM,
      status: taskStatus,
      labels: [disciplines[i % disciplines.length].split(' ')[0]],
      assignee: assignees[i % assignees.length],
      startDate: dateStr(start),
      dueDate: dateStr(start + duration),
      effort: duration * (6 + (i % 5)), // Target 6h-10h per day
      allocation: 80 + (i % 3) * 10,
      predecessors: i > 1 ? [`${projectId}_t${i - 1}`] : []
    });
  }
  return tasks;
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Industrial Boiler Installation',
    manager: 'David Kim',
    status: 'Active',
    startDate: dateStr(-10),
    dueDate: dateStr(40),
    description: 'Replacing aging boiler units at Downtown Medical Center.',
    buckets: [{ id: 'b1', name: 'Backlog' }, { id: 'b2', name: 'In Progress' }, { id: 'b3', name: 'Done' }],
    tasks: generateDemoTasks('p1', -10)
  },
  {
    id: 'p2',
    name: 'HVAC Retrofit - Tech Park',
    manager: 'Sarah Johnson',
    status: 'Active',
    startDate: dateStr(0),
    dueDate: dateStr(60),
    description: 'High-efficiency HVAC upgrade for building phase 2.',
    buckets: [{ id: 'b1', name: 'Backlog' }, { id: 'b2', name: 'In Progress' }, { id: 'b3', name: 'Done' }],
    tasks: generateDemoTasks('p2', 0)
  },
  {
    id: 'p3',
    name: 'Hydraulic Press Maintenance',
    manager: 'Robert Chen',
    status: 'Planning',
    startDate: dateStr(15),
    dueDate: dateStr(45),
    description: 'Annual deep maintenance and part replacement for the factory floor.',
    buckets: [{ id: 'b1', name: 'Planning' }, { id: 'b2', name: 'Active' }, { id: 'b3', name: 'Verified' }],
    tasks: generateDemoTasks('p3', 15)
  },
  {
    id: 'p4',
    name: 'Ventilation Design - SubCity',
    manager: 'Maria Rodriguez',
    status: 'Active',
    startDate: dateStr(-5),
    dueDate: dateStr(70),
    description: 'Underground tunnel ventilation system modeling and design.',
    buckets: [{ id: 'b1', name: 'Design' }, { id: 'b2', name: 'Review' }, { id: 'b3', name: 'Approval' }],
    tasks: generateDemoTasks('p4', -5)
  },
  {
    id: 'p5',
    name: 'Cooling Tower Overhaul',
    manager: 'David Kim',
    status: 'On Hold',
    startDate: dateStr(30),
    dueDate: dateStr(90),
    description: 'Critical cooling infrastructure upgrade for Global Data Center.',
    buckets: [{ id: 'b1', name: 'Backlog' }, { id: 'b2', name: 'Executing' }, { id: 'b3', name: 'Done' }],
    tasks: generateDemoTasks('p5', 30)
  },
  {
    id: 'p6',
    name: 'Precision Gearbox Assembly',
    manager: 'Lisa Zhang',
    status: 'Planning',
    startDate: dateStr(10),
    dueDate: dateStr(50),
    description: 'Manufacturing of custom high-torque gearboxes for robotics.',
    buckets: [{ id: 'b1', name: 'Queued' }, { id: 'b2', name: 'Assembly' }, { id: 'b3', name: 'QA' }],
    tasks: generateDemoTasks('p6', 10)
  },
  {
    id: 'p7',
    name: 'Commercial Ducting Layout',
    manager: 'James Wilson',
    status: 'Active',
    startDate: dateStr(5),
    dueDate: dateStr(45),
    description: 'Ductwork fabrication and installation for new commercial tower.',
    buckets: [{ id: 'b1', name: 'Todo' }, { id: 'b2', name: 'In Flow' }, { id: 'b3', name: 'Finished' }],
    tasks: generateDemoTasks('p7', 5)
  },
  {
    id: 'p8',
    name: 'Chiller Plant Optimization',
    manager: 'Emily White',
    status: 'Active',
    startDate: dateStr(-20),
    dueDate: dateStr(30),
    description: 'Software and mechanical tuning of the central chiller plant.',
    buckets: [{ id: 'b1', name: 'Analyzing' }, { id: 'b2', name: 'Tuning' }, { id: 'b3', name: 'Optimized' }],
    tasks: generateDemoTasks('p8', -20)
  },
  {
    id: 'p9',
    name: 'Factory Robotics Calibration',
    manager: 'Robert Chen',
    status: 'Active',
    startDate: dateStr(2),
    dueDate: dateStr(35),
    description: 'Fine-tuning mechanical arms for 0.1mm precision.',
    buckets: [{ id: 'b1', name: 'Setup' }, { id: 'b2', name: 'Calibrating' }, { id: 'b3', name: 'Validated' }],
    tasks: generateDemoTasks('p9', 2)
  },
  {
    id: 'p10',
    name: 'Solar Thermal Integration',
    manager: 'Maria Rodriguez',
    status: 'Planning',
    startDate: dateStr(40),
    dueDate: dateStr(100),
    description: 'Integrating solar heating into existing university dorms.',
    buckets: [{ id: 'b1', name: 'Planning' }, { id: 'b2', name: 'Piping' }, { id: 'b3', name: 'Online' }],
    tasks: generateDemoTasks('p10', 40)
  }
];

// -- Helpers: Business Days --
const getBusinessDays = (start: Date, finish: Date) => {
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  let count = 0;
  while (cur <= finish) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const addBusinessDays = (start: Date, days: number) => {
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  let added = 0;
  const needed = Math.max(0, days - 1);
  while (added < needed) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0 && cur.getDay() !== 6) added++;
  }
  return cur;
};

const getNextBusinessDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

// -- Cascade Logic --
const calculateTaskDates = (task: Task, allTasks: Task[]) => {
  if (!task.predecessors || task.predecessors.length === 0) return task;

  let maxEndDate: Date | null = null;
  task.predecessors.forEach(pId => {
    const p = allTasks.find(t => t.id === pId);
    if (p && p.dueDate) {
      const pEnd = new Date(p.dueDate);
      if (!maxEndDate || pEnd > maxEndDate) maxEndDate = pEnd;
    }
  });

  if (maxEndDate) {
    const newStart = getNextBusinessDay(maxEndDate);
    const currentStart = task.startDate ? new Date(task.startDate) : new Date();
    const currentEnd = task.dueDate ? new Date(task.dueDate) : new Date();
    const duration = Math.max(1, getBusinessDays(currentStart, currentEnd));
    const newEnd = addBusinessDays(newStart, duration);

    return {
      ...task,
      startDate: newStart.toISOString().split('T')[0],
      dueDate: newEnd.toISOString().split('T')[0]
    };
  }
  return task;
};

const cascadeUpdates = (tasks: Task[], startTaskId: string, visited = new Set<string>()): Task[] => {
  if (visited.has(startTaskId)) return tasks;
  visited.add(startTaskId);

  // 1. Find the direct dependents of this task
  const dependents = tasks.filter(t => t.predecessors?.includes(startTaskId));

  let currentTasks = [...tasks];

  dependents.forEach(dep => {
    // 2. Recalculate this dependent based on its predecessors
    const updatedDep = calculateTaskDates(dep, currentTasks);

    // 3. Update in list
    currentTasks = currentTasks.map(t => t.id === updatedDep.id ? updatedDep : t);

    // 4. Recurse down the chain
    currentTasks = cascadeUpdates(currentTasks, updatedDep.id, visited);
  });

  return currentTasks;
};

// -- App Component --
export default function App() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [teams, setTeams] = useState(INITIAL_TEAMS);

  // -- State with Persistence --
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => localStorage.getItem('planner_activeProjectId') || null);
  const [viewSection, setViewSection] = useState<'projects' | 'myday' | 'myday2' | 'mytasks' | 'settings' | 'templates' | 'project-request'>(() => (localStorage.getItem('planner_viewSection') as any) || 'projects');
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem('planner_view') as any) || 'grid');
  const [currentUser, setCurrentUser] = useState('Robert Chen'); // Hardcoded logged in user

  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  // -- Persistence Effects --
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('planner_activeProjectId', activeProjectId);
    } else {
      localStorage.removeItem('planner_activeProjectId');
    }
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('planner_viewSection', viewSection);
  }, [viewSection]);

  useEffect(() => {
    localStorage.setItem('planner_view', view);
  }, [view]);

  // -- Theme Management --
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      let resolvedTheme = t;
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // -- Lifecycle: Sync Selected Task --
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // -- Sync selectedTask with latest project data --
  useEffect(() => {
    if (selectedTask) {
      for (const p of projects) {
        const foundTask: Task | undefined = p.tasks.find(t => t.id === selectedTask.id);
        if (foundTask && foundTask !== selectedTask) {
          setSelectedTask(foundTask);
          break;
        }
      }
    }
  }, [projects, selectedTask]);

  // -- Navigation Handlers --
  const navigateToHome = () => {
    setViewSection('projects');
    setActiveProjectId(null);
  };

  const navigateToMyDay = () => setViewSection('myday');
  const navigateToMyDay2 = () => setViewSection('myday2');
  const navigateToMyTasks = () => setViewSection('mytasks');
  const navigateToSettings = () => setViewSection('settings');

  const openProject = (id: string) => {
    setViewSection('projects');
    setActiveProjectId(id);
    setView('grid');
  };

  const openProjectOverview = (id: string) => {
    setViewSection('projects');
    setActiveProjectId(id);
    setView('overview');
  }

  // -- People Master Handlers --
  const handleAddPerson = (person: Partial<Person>) => {
    const newPerson: Person = {
      id: Math.random().toString(36).substr(2, 9),
      name: person.name || 'New Employee',
      role: person.role || 'Unassigned',
      team: person.team || 'Unassigned',
      manager: person.manager || '',
      joinDate: person.joinDate || dateStr(0),
      email: person.email || '',
      status: 'Active',
      ...person
    } as Person;
    setPeople(prev => [...prev, newPerson]);
  };

  const handleUpdatePerson = (id: string, updates: Partial<Person>) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeletePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  // -- Team Master Handlers --
  const handleAddTeam = (name: string) => {
    setTeams(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name }]);
  };

  const handleUpdateTeam = (id: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
  };

  // -- Project Master Handlers --
  const handleCreateProject = (projectData: Partial<Project>) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: projectData.name || 'New Project',
      manager: projectData.manager || 'Unassigned',
      status: projectData.status || 'Planning',
      startDate: projectData.startDate || dateStr(0),
      dueDate: projectData.dueDate || dateStr(30),
      buckets: [{ id: 'b1', name: 'To Do' }, { id: 'b2', name: 'In Progress' }, { id: 'b3', name: 'Done' }],
      tasks: [],
      ...projectData
    };
    setProjects(prev => [...prev, newProject]);
  };

  const handleUpdateProjectAttributes = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  // -- Task Interaction Handlers --
  const updateActiveProjectTasks = (updater: (prev: Task[]) => Task[]) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: updater(p.tasks) } : p));
  };

  const updateActiveProjectBuckets = (updater: (prev: { id: string, name: string }[]) => { id: string, name: string }[]) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, buckets: updater(p.buckets) } : p));
  };

  const handleGlobalUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setProjects(prevProjects => prevProjects.map(project => {
      const tIdx = project.tasks.findIndex(t => t.id === taskId);
      if (tIdx === -1) return project;

      let updatedTasks = [...project.tasks];
      updatedTasks[tIdx] = { ...updatedTasks[tIdx], ...updates };

      // If dates or predecessors changed, cascade
      if (updates.startDate !== undefined || updates.dueDate !== undefined || updates.predecessors !== undefined) {
        updatedTasks = cascadeUpdates(updatedTasks, taskId);
      }

      return { ...project, tasks: updatedTasks };
    }));
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    handleGlobalUpdateTask(taskId, updates);
  };

  const handleMoveTask = (taskId: string, bucketId: string) => {
    handleGlobalUpdateTask(taskId, { bucketId });
  };

  const handleUpdateTaskStatus = (taskId: string, status: Status) => {
    handleGlobalUpdateTask(taskId, { status });
  };

  const handleAddTask = (newTask: Partial<Task>) => {
    if (!activeProject) return;
    updateActiveProjectTasks(prev => {
      let t = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'New Task',
        description: '',
        bucketId: activeProject.buckets[0].id,
        priority: Priority.MEDIUM,
        status: Status.NOT_STARTED,
        labels: [],
        startDate: dateStr(0),
        dueDate: dateStr(1),
        effort: 8,
        allocation: 100,
        ...newTask
      } as Task;

      if (t.predecessors && t.predecessors.length > 0) {
        t = calculateTaskDates(t, prev);
        if (t.startDate && t.dueDate) {
          const days = getBusinessDays(new Date(t.startDate), new Date(t.dueDate));
          const alloc = t.allocation || 100;
          t.effort = parseFloat((days * 8 * (alloc / 100)).toFixed(1));
        }
      }
      return [t, ...prev];
    });
  };

  const handleDeleteTask = (taskId: string) => {
    updateActiveProjectTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  const handleAddBucket = (name: string) => {
    updateActiveProjectBuckets(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name }]);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const plan = await generateProjectPlan(aiPrompt);
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: aiPrompt.length > 30 ? aiPrompt.substring(0, 30) + '...' : aiPrompt,
        manager: 'AI Generated',
        status: 'Planning',
        startDate: dateStr(0),
        dueDate: dateStr(30),
        buckets: plan.buckets,
        tasks: plan.tasks,
        description: `Auto-generated plan based on: ${aiPrompt}`
      };
      setProjects(prev => [...prev, newProject]);
      openProject(newProject.id);
      setShowAiModal(false);
      setView('grid');
    } catch (e) {
      alert("Failed to generate plan. Please check your API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111111]">

      {/* Top Navigation Bar */}
      <header className="h-12 bg-[#0f766e] dark:bg-[#064e4b] text-white flex items-center justify-between px-3 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div
            onClick={navigateToHome}
            className="w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-white/10 rounded transition-colors"
            title="Go to Project Master"
          >
            <div className="grid grid-cols-3 gap-0.5 w-4 h-4">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white rounded-[0.5px]"></div>)}
            </div>
          </div>
          <span className="font-semibold text-base tracking-tight ml-1 cursor-pointer" onClick={navigateToHome}>Projects</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <input type="text" placeholder="Search" className="bg-white/20 text-white placeholder-white/70 text-sm rounded px-3 py-1.5 border-none focus:ring-1 focus:ring-white outline-none w-64 transition-all" />
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full"
            title="Copy Link to Share"
            onClick={() => setShowShareModal(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>

          {/* Theme Switcher */}
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full"
            title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
            ) : theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            )}
          </button>

          <div className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <Avatar name={currentUser} className="w-8 h-8 bg-teal-800 text-white border-white/20 ring-0" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Navigation Rail */}
        <aside className={`bg-gray-50 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-14' : 'w-64'} hidden md:flex`}>
          <div className="h-12 flex items-center px-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <div className="space-y-1 px-2">
              {[
                { id: 'projects', label: 'My Projects', icon: <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
                { id: 'project-request', label: 'Project Request', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                { id: 'myday', label: 'My Day', icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                { id: 'mytasks', label: 'My Tasks', icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
                { id: 'templates', label: 'Project Templates', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setViewSection(item.id as any);
                    setActiveProjectId(null); // Clear active project when switching sections
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${viewSection === item.id
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <svg className={`w-5 h-5 ${viewSection === item.id ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>

            <div className={`mt-6 px-4 mb-2 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                Pinned Projects
              </div>
            </div>

            <div className="space-y-1 px-2 mb-4">
              {projects.slice(0, 3).map(p => (
                <div
                  key={p.id}
                  onClick={() => openProject(p.id)}
                  className={`flex items-center px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-800 rounded cursor-pointer ${activeProjectId === p.id ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' : 'bg-white dark:bg-[#222] hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="w-6 text-center text-sm font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/40 rounded shrink-0">{p.name.substring(0, 2).toUpperCase()}</span>
                  {!sidebarCollapsed && <div className="ml-3 overflow-hidden">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{p.status}</div>
                  </div>}
                </div>
              ))}
            </div>

            <div className="mt-auto px-2">
              <div onClick={navigateToSettings} className={`flex items-center px-3 py-2 rounded transition-colors cursor-pointer group ${viewSection === 'settings' ? 'bg-gray-200 dark:bg-gray-800 text-teal-800 dark:text-teal-400 font-medium' : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <span className="w-6 text-center text-lg grayscale group-hover:grayscale-0">⚙️</span>
                {!sidebarCollapsed && <span className="ml-3 text-sm">Settings</span>}
              </div>
            </div>
          </div>

        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-ms-offwhite dark:bg-[#0a0a0a] overflow-hidden flex flex-col relative">
          {!activeProject ? (
            <div className="flex-1 flex flex-col min-h-0">
              {viewSection === 'projects' && (
                <ProjectMasterView
                  projects={projects}
                  onOpenProject={openProject}
                  onOpenProjectOverview={openProjectOverview}
                  onCreateProject={handleCreateProject}
                  onUpdateProject={handleUpdateProjectAttributes}
                  onDeleteProject={handleDeleteProject}
                />
              )}
              {viewSection === 'myday' && <MyDayView2 projects={projects} currentUser={currentUser} people={people} onTaskClick={setSelectedTask} onUpdateTask={handleGlobalUpdateTask} />}
              {viewSection === 'mytasks' && <MyTasksView projects={projects} currentUser={currentUser} onUpdateTask={handleGlobalUpdateTask} />}
              {viewSection === 'settings' && <SettingsView teams={teams} onAddTeam={handleAddTeam} onDeleteTeam={handleDeleteTeam} onUpdateTeam={handleUpdateTeam} people={people} onAddPerson={handleAddPerson} onUpdatePerson={handleUpdatePerson} onDeletePerson={handleDeletePerson} />}
              {viewSection === 'templates' && (
                <ProjectTemplatesView
                  projects={projects}
                  onOpenProject={openProject}
                  onOpenProjectOverview={openProjectOverview}
                  onCreateTemplate={handleCreateProject}
                  onUpdateProject={handleUpdateProjectAttributes}
                  onDeleteProject={handleDeleteProject}
                />
              )}
              {viewSection === 'project-request' && (
                <ProjectRequestForm
                  onSubmit={(project) => {
                    handleCreateProject(project);
                    setViewSection('projects');
                  }}
                />
              )}
            </div>
          ) : (
            // Specific Project View
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-[#111111]">
              <div className="px-6 pt-5 pb-0 shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{activeProject.name}</h1>
                      <button className="text-gray-400 hover:text-yellow-400 transition-colors">★</button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${activeProject.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {activeProject.status}
                      </span>
                      <span>Managed by {activeProject.manager}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                      <Avatar name={activeProject.manager} className="border-2 border-white dark:border-gray-900 w-8 h-8" />
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">+</div>
                    </div>
                    <button onClick={() => setShowShareModal(true)} className="text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-3 py-1.5 rounded text-sm font-semibold transition-colors">Share</button>
                  </div>
                </div>

                <div className="flex items-center border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'grid', label: 'Grid' },
                    { id: 'board', label: 'Board' },
                    { id: 'timeline', label: 'Timeline' },
                    { id: 'charts', label: 'Charts' },
                    { id: 'people', label: 'People' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setView(tab.id as ViewMode)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-all mr-2 whitespace-nowrap ${view === tab.id
                        ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-0 relative flex flex-col">
                {/* Specific view rendering (internal project tabs) */}
                <div className="flex-1 flex flex-col min-h-0">
                  {view === 'overview' && (
                    <ProjectDetailView
                      project={activeProject}
                      onUpdateProject={handleUpdateProjectAttributes}
                      onDeleteProject={handleDeleteProject}
                      onUpdateTask={handleGlobalUpdateTask}
                      onCreateTask={(t) => handleAddTask(t)}
                      onDeleteTask={handleDeleteTask}
                      people={people}
                      teams={teams}
                      onShare={() => setShowShareModal(true)}
                    />
                  )}
                  {view === 'grid' && <GridView tasks={activeProject.tasks} buckets={activeProject.buckets} onUpdateTask={handleUpdateTask} onTaskClick={setSelectedTask} onAddTask={handleAddTask} />}
                  {view === 'board' && <TaskBoard buckets={activeProject.buckets} tasks={activeProject.tasks} onMoveTask={handleMoveTask} onUpdateTaskStatus={handleUpdateTaskStatus} onAddTask={(bucketId, title) => handleAddTask({ bucketId, title })} onAddBucket={handleAddBucket} onDeleteTask={handleDeleteTask} onTaskClick={setSelectedTask} />}
                  {view === 'timeline' && <TimelineView tasks={activeProject.tasks} onTaskClick={setSelectedTask} />}
                  {view === 'charts' && <ChartsView tasks={activeProject.tasks} />}
                  {view === 'people' && <PeopleView tasks={activeProject.tasks} buckets={activeProject.buckets} onUpdateTask={handleUpdateTask} onTaskClick={setSelectedTask} onAddTask={handleAddTask} />}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          buckets={activeProject ? activeProject.buckets : [{ id: selectedTask.bucketId, name: 'Current Bucket' }]}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleGlobalUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center text-xl border border-gray-100 dark:border-gray-700">✨</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Copilot Assistant</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini AI</p>
                  </div>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1.5 border border-gray-100 dark:border-gray-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Describe your goal, and I'll generate a complete project structure for you.
              </p>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-4 min-h-[140px] resize-none bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-all shadow-inner"
                placeholder="e.g., Create a launch plan for a new marketing campaign..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowAiModal(false)}>Close</Button>
                <Button
                  disabled={isGenerating || !aiPrompt.trim()}
                  onClick={handleAiGenerate}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 border-none text-white shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Create Project'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
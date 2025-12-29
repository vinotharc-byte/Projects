import React, { useState, useMemo, useRef } from 'react';
import { Project, Task, Status } from '../types';
import { Button, Avatar, Badge, formatDate } from './UI';

interface ProjectMasterViewProps {
    projects: Project[];
    onOpenProject: (projectId: string) => void;
    onOpenProjectOverview: (projectId: string) => void;
    onCreateProject: (project: Partial<Project>) => void;
    onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
    onDeleteProject: (projectId: string) => void;
}

interface ColumnDef {
    id: string;
    label: string;
    width: number;
    sortable: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
    key: string;
    direction: SortDirection;
}

export const ProjectMasterView: React.FC<ProjectMasterViewProps> = ({
    projects,
    onOpenProject,
    onOpenProjectOverview,
    onCreateProject,
    onUpdateProject,
    onDeleteProject
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // -- Column State --
    const [columns, setColumns] = useState<ColumnDef[]>([
        { id: 'name', label: 'Project Name', width: 300, sortable: true },
        { id: 'business', label: 'Business', width: 120, sortable: true },
        { id: 'manager', label: 'Manager', width: 150, sortable: true },
        { id: 'status', label: 'Status', width: 110, sortable: true },
        { id: 'timeline', label: 'Timeline', width: 160, sortable: true },
        { id: 'currentUpdate', label: 'Current Update', width: 250, sortable: false },
        { id: 'previousUpdates', label: 'Previous Updates', width: 250, sortable: false },
        { id: 'progress', label: 'Progress', width: 140, sortable: true },
        { id: 'effort', label: 'Effort', width: 100, sortable: true },
        { id: 'actions', label: 'Actions', width: 90, sortable: false },
    ]);

    // -- Filter State --
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        manager: ''
    });

    // -- Sort State --
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

    // -- Resizing Logic --
    const [isResizing, setIsResizing] = useState(false);
    const resizingRef = useRef<{ startX: number; startWidth: number; columnIndex: number; isDragging: boolean } | null>(null);

    // We need valid reference to columns state inside the event listener
    const columnsRef = useRef(columns);
    columnsRef.current = columns;

    const handleResize = (e: MouseEvent) => {
        if (!resizingRef.current || !resizingRef.current.isDragging) return;

        const { startX, startWidth, columnIndex } = resizingRef.current;

        // Calculate new width
        const diff = e.clientX - startX;
        const newWidth = Math.max(80, startWidth + diff);

        //console.log('Resize:', { columnIndex, diff, newWidth });

        // Update state
        setColumns(prev => prev.map((col, i) =>
            i === columnIndex ? { ...col, width: newWidth } : col
        ));

        // Prevent default selection text
        e.preventDefault();
    };

    const stopResize = () => {
        //console.log('Stop Resize');
        setIsResizing(false);
        if (resizingRef.current) {
            resizingRef.current.isDragging = false;
            resizingRef.current = null;
        }
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    const startResize = (e: React.MouseEvent, index: number) => {
        console.log('Start Resize', index);
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        resizingRef.current = {
            startX: e.clientX,
            startWidth: columns[index].width,
            columnIndex: index,
            isDragging: true
        };

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Prevent text selection
    };

    // -- Helper: Calculate Stats --
    const getProjectStats = (tasks: Task[]) => {
        const totalEffort = tasks.reduce((acc, t) => acc + (t.effort || 0), 0);
        const completed = tasks.filter(t => t.status === Status.COMPLETED).length;
        const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        return { totalEffort, progress, count: tasks.length };
    };

    // -- Process Data (Filter & Sort) --
    const processedProjects = useMemo(() => {
        // Exclude Templates from the main list
        let result = projects.filter(p => !p.isTemplate);

        // 1. Filter
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }
        if (filters.status) {
            result = result.filter(p => p.status === filters.status);
        }
        if (filters.manager) {
            result = result.filter(p => p.manager === filters.manager);
        }

        // 2. Sort
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                // Handle calculated fields
                if (sortConfig.key === 'progress') {
                    valA = getProjectStats(a.tasks).progress;
                    valB = getProjectStats(b.tasks).progress;
                } else if (sortConfig.key === 'effort') {
                    valA = getProjectStats(a.tasks).totalEffort;
                    valB = getProjectStats(b.tasks).totalEffort;
                } else if (sortConfig.key === 'timeline') {
                    valA = new Date(a.startDate).getTime();
                    valB = new Date(b.startDate).getTime();
                } else {
                    // @ts-ignore
                    valA = a[sortConfig.key];
                    // @ts-ignore
                    valB = b[sortConfig.key];
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [projects, filters, sortConfig]);

    // -- Templates Logic --
    const availableTemplates = useMemo(() => projects.filter(p => p.isTemplate), [projects]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // -- Handlers --
    const handleSort = (columnId: string) => {
        setSortConfig(prev => {
            if (prev.key === columnId) {
                return { key: columnId, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key: columnId, direction: 'asc' };
        });
    };

    const handleCreate = () => {
        if (!newProjectName.trim()) return;

        const newProject: Partial<Project> = {
            name: newProjectName,
            manager: 'Unassigned',
            status: 'Planning',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
        };

        if (selectedTemplateId) {
            const template = projects.find(p => p.id === selectedTemplateId);
            if (template) {
                // Clone buckets and tasks
                // We need to re-generate IDs for everything to avoid collisions
                // This is a simplified deep copy for visual attributes. 
                // Ideally, a true robust clone would handle ID mapping more carefully.
                // For now, we assume onCreateProject handles ID generation for the *project* itself,
                // but we need to pass the *content* we want to clone.
                // However, onCreateProject (in App.tsx) primarily just creates a basic project. 

                // We should construct the full object here with new IDs.
                const idMap = new Map<string, string>(); // Old -> New

                newProject.buckets = template.buckets?.map(b => {
                    const newId = crypto.randomUUID();
                    idMap.set(b.id, newId);
                    return { ...b, id: newId };
                }) || [];

                newProject.tasks = template.tasks?.map(t => {
                    const newId = crypto.randomUUID();
                    return {
                        ...t,
                        id: newId,
                        bucketId: idMap.get(t.bucketId) || t.bucketId, // Map to new bucket ID
                        assignee: undefined, // Clear assignee
                        status: Status.NOT_STARTED, // Reset status
                        percentComplete: 0
                    };
                }) || [];

                newProject.description = template.description;
            }
        }

        onCreateProject(newProject);
        setNewProjectName('');
        setSelectedTemplateId('');
        setIsCreating(false);
    };

    // -- Renderers --
    const renderCell = (colId: string, project: Project, isEditing: boolean, stats: any) => {
        switch (colId) {
            case 'name':
                return isEditing ? (
                    <input
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        value={project.name}
                        onChange={(e) => onUpdateProject(project.id, { name: e.target.value })}
                    />
                ) : (
                    <div className="flex items-start gap-3 text-gray-900 dark:text-gray-100">
                        <button
                            onClick={() => onOpenProjectOverview(project.id)}
                            className="text-gray-400 hover:text-planner-600 dark:hover:text-planner-400 transition-colors mt-0.5"
                            title="Project Overview & Tracking"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </button>
                        <div className="overflow-hidden">
                            <button
                                onClick={() => onOpenProject(project.id)}
                                className="font-bold text-planner-700 dark:text-planner-400 hover:underline text-base block text-left truncate w-full"
                            >
                                {project.name}
                            </button>
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{project.description || 'No description'}</div>
                        </div>
                    </div>
                );
            case 'business':
                return isEditing ? (
                    <select
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full"
                        value={project.businessUnit || ''}
                        onChange={(e) => onUpdateProject(project.id, { businessUnit: e.target.value })}
                    >
                        <option value="">Select Unit</option>
                        {['Marketing', 'IT', 'Operations', 'Sales', 'HR', 'Finance', 'Engineering', 'Product'].map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate block px-1">
                        {project.businessUnit || '-'}
                    </span>
                );
            case 'currentUpdate':
                return isEditing ? (
                    <textarea
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none resize-none focus:ring-1 focus:ring-planner-600"
                        rows={3}
                        value={project.currentUpdate || ''}
                        onChange={(e) => onUpdateProject(project.id, { currentUpdate: e.target.value })}
                        placeholder="Latest status..."
                    />
                ) : (
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap px-1" title={project.currentUpdate}>
                        {project.currentUpdate || '-'}
                    </div>
                );
            case 'previousUpdates':
                return isEditing ? (
                    <textarea
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none resize-none focus:ring-1 focus:ring-planner-600"
                        rows={3}
                        value={project.previousUpdates || ''}
                        onChange={(e) => onUpdateProject(project.id, { previousUpdates: e.target.value })}
                        placeholder="History..."
                    />
                ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-3 whitespace-pre-wrap px-1 italic" title={project.previousUpdates}>
                        {project.previousUpdates || '-'}
                    </div>
                );
            case 'manager':
                return isEditing ? (
                    <input
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        value={project.manager}
                        onChange={(e) => onUpdateProject(project.id, { manager: e.target.value })}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <Avatar name={project.manager} className="w-6 h-6 text-[10px]" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{project.manager}</span>
                    </div>
                );
            case 'status':
                return isEditing ? (
                    <select
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full"
                        value={project.status}
                        onChange={(e) => onUpdateProject(project.id, { status: e.target.value as any })}
                    >
                        {['Planning', 'Active', 'On Hold', 'Completed'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                ) : (
                    <Badge color={
                        project.status === 'Active' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400' :
                            project.status === 'Planning' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400' :
                                project.status === 'Completed' ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400'
                    }>
                        {project.status}
                    </Badge>
                );
            case 'timeline':
                return isEditing ? (
                    <div className="flex flex-col gap-1">
                        <input type="date" className="text-xs border rounded p-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" value={project.startDate} onChange={(e) => onUpdateProject(project.id, { startDate: e.target.value })} />
                        <input type="date" className="text-xs border rounded p-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" value={project.dueDate} onChange={(e) => onUpdateProject(project.id, { dueDate: e.target.value })} />
                    </div>
                ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-col">
                        <span className="font-medium">{formatDate(project.startDate)}</span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs">to {formatDate(project.dueDate)}</span>
                    </div>
                );
            case 'progress':
                return (
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats.count} Tasks</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{stats.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-planner-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${stats.progress}%` }}></div>
                        </div>
                    </div>
                );
            case 'effort':
                return <span className="font-mono text-sm text-gray-700 dark:text-gray-300 font-semibold">{stats.totalEffort.toFixed(1)}h</span>;
            case 'actions':
                return (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {isEditing ? (
                            <button onClick={() => setEditingId(null)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                        ) : (
                            <button onClick={() => setEditingId(project.id)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded" title="Edit Attributes">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                        <button onClick={() => onDeleteProject(project.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded" title="Delete Project">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    // Extract unique managers for filter
    const uniqueManagers = useMemo(() => Array.from(new Set(projects.map(p => p.manager).filter(Boolean))), [projects]);

    return (
        <div className="h-full bg-ms-offwhite dark:bg-[#0a0a0a] p-8 flex flex-col overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Projects</h1>
                        <p className="text-gray-500 dark:text-gray-400">View and manage your active projects and portfolios.</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-planner-600 dark:bg-planner-700 text-white border-none transition-colors">
                        <span className="text-xl leading-none">+</span> New Project
                    </Button>
                </div>

                {isCreating && (
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 mb-6 animate-in fade-in slide-in-from-top-4 shrink-0 max-w-2xl mx-auto w-full">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">Create New Project</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Name</label>
                                <input
                                    autoFocus
                                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                                    placeholder="Project Name (e.g. Q4 Marketing Campaign)"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                // onKeyDown moved to button to prevent accidental submits while typing
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Template (Optional)</label>
                                <select
                                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                >
                                    <option value="">No Template (Start from Scratch)</option>
                                    {availableTemplates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={!newProjectName.trim()}>Create Project</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Toolbar */}
                <div className="flex flex-wrap items-center gap-4 mb-4 shrink-0 bg-white dark:bg-[#1e1e1e] p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-planner-600 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                            placeholder="Search projects..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <select
                        className="py-2 pl-3 pr-8 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-planner-600 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">All Statuses</option>
                        {['Planning', 'Active', 'On Hold', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        className="py-2 pl-3 pr-8 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-planner-600 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                        value={filters.manager}
                        onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
                    >
                        <option value="">All Managers</option>
                        {uniqueManagers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {(filters.search || filters.status || filters.manager) && (
                        <button
                            onClick={() => setFilters({ search: '', status: '', manager: '' })}
                            className="text-sm text-red-500 hover:text-red-700 font-medium px-2"
                        >
                            Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {processedProjects.length} Projects
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex-1 overflow-auto flex flex-col">
                    <div className="inline-block min-w-full align-middle">
                        <table className="text-left text-sm border-collapse table-fixed" style={{ width: columns.reduce((acc, c) => acc + c.width, 0) }}>
                            <thead className="bg-white dark:bg-[#1e1e1e] sticky top-0 z-10 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                                <tr>
                                    {columns.map((col, index) => (
                                        <th
                                            key={col.id}
                                            className={`relative px-6 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${col.sortable ? 'cursor-pointer' : ''}`}
                                            style={{ width: col.width }}
                                            onClick={() => col.sortable && handleSort(col.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{col.label}</span>
                                                {col.sortable && sortConfig.key === col.id && (
                                                    <span className="text-planner-600 dark:text-planner-400 ml-1">
                                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Resize Handle */}
                                            <div
                                                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-600 z-10 group"
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => startResize(e, index)}
                                            >
                                                <div className="h-full w-px bg-gray-300 dark:bg-gray-700 mx-auto group-hover:bg-blue-400 dark:group-hover:bg-blue-600" />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {processedProjects.map(project => {
                                    const stats = getProjectStats(project.tasks);
                                    const isEditing = editingId === project.id;

                                    return (
                                        <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                            {columns.map(col => (
                                                <td key={col.id} className="px-6 py-4 border-r border-transparent hover:border-gray-100 dark:hover:border-gray-800 align-top">
                                                    {renderCell(col.id, project, isEditing, stats)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                                {processedProjects.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                                            No projects match your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
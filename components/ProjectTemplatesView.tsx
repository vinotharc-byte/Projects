import React, { useState, useMemo, useRef } from 'react';
import { Project, Task, Status } from '../types';
import { Button, Avatar, Badge, formatDate } from './UI';

interface ProjectTemplatesViewProps {
    projects: Project[];
    onOpenProject: (projectId: string) => void;
    onOpenProjectOverview: (projectId: string) => void;
    onCreateTemplate: (project: Partial<Project>) => void;
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

export const ProjectTemplatesView: React.FC<ProjectTemplatesViewProps> = ({
    projects,
    onOpenProject,
    onOpenProjectOverview,
    onCreateTemplate,
    onUpdateProject,
    onDeleteProject
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // -- Column State --
    const [columns, setColumns] = useState<ColumnDef[]>([
        { id: 'name', label: 'Template Name', width: 300, sortable: true },
        { id: 'tasks', label: 'Tasks', width: 100, sortable: true },
        { id: 'duration', label: 'Typical Duration', width: 150, sortable: true }, // Calculated
        { id: 'description', label: 'Description', width: 300, sortable: true },
        { id: 'actions', label: 'Actions', width: 100, sortable: false },
    ]);

    // -- Filter State --
    const [filters, setFilters] = useState({
        search: '',
    });

    // -- Sort State --
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

    // -- Helper: Calculate Stats --
    const getProjectStats = (tasks: Task[]) => {
        const totalEffort = tasks.reduce((acc, t) => acc + (t.effort || 0), 0);
        return { totalEffort, count: tasks.length };
    };

    // -- Process Data (Filter & Sort) --
    const processedProjects = useMemo(() => {
        // Only show TEMPLATES
        let result = projects.filter(p => p.isTemplate);

        // 1. Filter
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }

        // 2. Sort
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                if (sortConfig.key === 'tasks') {
                    valA = a.tasks.length;
                    valB = b.tasks.length;
                } else if (sortConfig.key === 'duration') {
                    // Rough estimate based on due - start
                    valA = new Date(a.dueDate).getTime() - new Date(a.startDate).getTime();
                    valB = new Date(b.dueDate).getTime() - new Date(b.startDate).getTime();
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
        if (!newTemplateName.trim()) return;
        onCreateTemplate({
            name: newTemplateName,
            manager: 'Template Manager',
            status: 'Planning',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
            isTemplate: true,
            description: 'New Project Template'
        });
        setNewTemplateName('');
        setIsCreating(false);
    };

    // -- Renderers --
    const renderCell = (colId: string, project: Project, isEditing: boolean) => {
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
                            title="Template Overview"
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
                        </div>
                    </div>
                );
            case 'tasks':
                return <span className="text-sm text-gray-700 dark:text-gray-300">{project.tasks.length} tasks</span>;
            case 'duration':
                const days = Math.floor((new Date(project.dueDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
                return <span className="text-sm text-gray-700 dark:text-gray-300">{days} days</span>;
            case 'description':
                return isEditing ? (
                    <input
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        value={project.description || ''}
                        onChange={(e) => onUpdateProject(project.id, { description: e.target.value })}
                    />
                ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate block">{project.description || '—'}</span>
                );

            case 'actions':
                return (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {isEditing ? (
                            <button onClick={() => setEditingId(null)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                        ) : (
                            <button onClick={() => setEditingId(project.id)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded" title="Edit Template Name">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                        <button onClick={() => onDeleteProject(project.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded" title="Delete Template">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="h-full bg-ms-offwhite dark:bg-[#0a0a0a] p-8 flex flex-col overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Project Templates</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage templates to standardize new projects.</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white border-none transition-colors">
                        <span className="text-xl leading-none">+</span> New Template
                    </Button>
                </div>

                {isCreating && (
                    <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mb-6 animate-in fade-in slide-in-from-top-4 shrink-0">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Create New Template</h3>
                        <div className="flex gap-4">
                            <input
                                autoFocus
                                className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                                placeholder="Template Name (e.g. Standard Software Launch)"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleCreate}>Create</Button>
                                <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Toolbar */}
                <div className="flex flex-wrap items-center gap-4 mb-4 shrink-0 bg-white dark:bg-[#1e1e1e] p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all"
                            placeholder="Search templates..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>

                    <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {processedProjects.length} Templates
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
                                                    <span className="text-indigo-600 dark:text-indigo-400 ml-1">
                                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {processedProjects.map(project => {
                                    const isEditing = editingId === project.id;

                                    return (
                                        <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                            {columns.map(col => (
                                                <td key={col.id} className="px-6 py-4 border-r border-transparent hover:border-gray-100 dark:hover:border-gray-800 align-top">
                                                    {renderCell(col.id, project, isEditing)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                                {processedProjects.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                                            No templates found.
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

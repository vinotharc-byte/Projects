import React, { useState, useMemo } from 'react';
import { Project, Task, Priority, Status } from '../types';
import { formatDate, Avatar } from './UI';

interface MyDayViewProps {
    projects: Project[];
    currentUser: string;
    onTaskClick: (task: Task) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export const MyDayView: React.FC<MyDayViewProps> = ({ projects, currentUser, onTaskClick, onUpdateTask }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Aggregate user tasks
    const myTasks = useMemo(() => {
        return projects.flatMap(p =>
            p.tasks
                .filter(t => t.assignee === currentUser)
                .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
        );
    }, [projects, currentUser]);

    // -- Date Helpers --
    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        return new Date(date.setDate(diff));
    };

    const addDays = (d: Date, days: number) => {
        const date = new Date(d);
        date.setDate(date.getDate() + days);
        return date;
    };

    const addMonths = (d: Date, months: number) => {
        const date = new Date(d);
        date.setMonth(date.getMonth() + months);
        return date;
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isToday = (d: Date) => isSameDay(d, new Date());

    // Check if task is active on a specific date
    const isTaskActiveOnDate = (task: Task, date: Date) => {
        if (!task.startDate || !task.dueDate) return false;
        const check = new Date(date);
        check.setHours(0, 0, 0, 0);

        const start = new Date(task.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(task.dueDate);
        end.setHours(0, 0, 0, 0);

        return check >= start && check <= end;
    };

    // -- Navigation Handlers --
    const handlePrev = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, -1));
        else if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7));
        else setCurrentDate(addDays(currentDate, -1));
    };

    const handleNext = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleDateClick = (date: Date) => {
        setCurrentDate(date);
        setViewMode('day');
    };

    // -- Render Content --

    const renderHeader = () => {
        let title = "";
        if (viewMode === 'month') title = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        else if (viewMode === 'week') {
            const start = getStartOfWeek(currentDate);
            const end = addDays(start, 6);
            title = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            title = currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }

        return (
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight min-w-[200px]">{title}</h2>
                    <div className="flex items-center bg-gray-100 dark:bg-black/20 rounded-lg p-1 border border-gray-200 dark:border-white/10">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md text-gray-600 dark:text-gray-400 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={handleToday} className="px-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-planner-600 dark:hover:text-planner-400">Today</button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md text-gray-600 dark:text-gray-400 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                    {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${viewMode === mode ? 'bg-white dark:bg-[#222] text-planner-700 dark:text-planner-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderMonth = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startDate = getStartOfWeek(monthStart);
        const days = [];

        // 6 weeks * 7 days = 42 days grid
        for (let i = 0; i < 42; i++) {
            days.push(addDays(startDate, i));
        }

        return (
            <div className="flex-1 flex flex-col bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-gray-50 dark:bg-black/40 border-b border-gray-200 dark:border-white/10">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-gray-100 dark:divide-white/5">
                    {days.map((day, idx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const dayTasks = myTasks.filter(t => isTaskActiveOnDate(t, day));
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDateClick(day)}
                                className={`min-h-[100px] p-2 relative hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group ${!isCurrentMonth ? 'bg-gray-50/30 dark:bg-black/20' : 'bg-white dark:bg-[#111111]'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-planner-600 text-white' : isCurrentMonth ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}>
                                        {day.getDate()}
                                    </span>
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                    {dayTasks.slice(0, 4).map(task => (
                                        <div
                                            key={task.id}
                                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                            className={`text-[10px] px-1.5 py-0.5 rounded truncate border shadow-sm ${task.priority === Priority.URGENT ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                                                    task.status === Status.COMPLETED ? 'bg-gray-100 dark:bg-black/40 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-white/10 line-through' :
                                                        'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                                                }`}
                                            title={task.title}
                                        >
                                            {task.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 4 && (
                                        <div className="text-[10px] text-gray-400 pl-1">+ {dayTasks.length - 4} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeek = () => {
        const start = getStartOfWeek(currentDate);
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

        return (
            <div className="flex-1 flex flex-col bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-lg shadow-sm overflow-hidden h-full">
                <div className="grid grid-cols-7 h-full divide-x divide-gray-200 dark:divide-white/10">
                    {days.map((day, idx) => {
                        const dayTasks = myTasks.filter(t => isTaskActiveOnDate(t, day));
                        const isTodayDate = isToday(day);

                        return (
                            <div key={idx} className="flex flex-col hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                {/* Header */}
                                <div
                                    className={`p-3 text-center border-b border-gray-200 dark:border-white/10 cursor-pointer ${isTodayDate ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-black/40'}`}
                                    onClick={() => handleDateClick(day)}
                                >
                                    <div className={`text-xs font-bold uppercase mb-1 ${isTodayDate ? 'text-planner-600 dark:text-planner-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {day.toLocaleDateString(undefined, { weekday: 'short' })}
                                    </div>
                                    <div className={`text-xl font-bold ${isTodayDate ? 'text-planner-700 dark:text-planner-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>

                                {/* Tasks List */}
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                    {dayTasks.length === 0 && (
                                        <div className="text-center mt-10 text-xs text-gray-300 italic">No tasks</div>
                                    )}
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => onTaskClick(task)}
                                            className={`p-2 rounded border shadow-sm cursor-pointer hover:shadow-md transition-all ${task.priority === Priority.URGENT ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' :
                                                    task.status === Status.COMPLETED ? 'bg-gray-100 dark:bg-black/40 border-gray-200 dark:border-white/10 opacity-60' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10'
                                                }`}
                                        >
                                            <div className={`text-xs font-semibold mb-1 truncate ${task.status === Status.COMPLETED ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {task.title}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${task.priority === Priority.URGENT ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                {task.effort && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{task.effort}h</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDay = () => {
        const dayTasks = myTasks.filter(t => isTaskActiveOnDate(t, currentDate));
        dayTasks.sort((a, b) => {
            if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
            if (a.priority !== Priority.URGENT && b.priority === Priority.URGENT) return 1;
            return 0;
        });

        return (
            <div className="flex-1 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-lg shadow-sm flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
                <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {currentDate.toLocaleDateString(undefined, { weekday: 'long' })}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {dayTasks.length} tasks scheduled
                        </p>
                    </div>
                    {dayTasks.length > 0 && (
                        <div className="flex -space-x-2">
                            {dayTasks.slice(0, 5).map(t => <Avatar key={t.id} name={t.assignee} className="w-8 h-8 border-2 border-white dark:border-gray-900" />)}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {dayTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-3xl">☕</div>
                            <p className="font-medium">No tasks for today. Enjoy your coffee!</p>
                        </div>
                    )}

                    {dayTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:border-planner-300 dark:hover:border-planner-500/50 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-[#1a1a1a] group"
                        >
                            <div className="flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={task.status === Status.COMPLETED}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => onUpdateTask(task.id, { status: task.status === Status.COMPLETED ? Status.NOT_STARTED : Status.COMPLETED })}
                                    className="w-5 h-5 text-planner-600 rounded focus:ring-planner-600 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-base font-semibold truncate ${task.status === Status.COMPLETED ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {task.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span className="bg-gray-100 dark:bg-black/20 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{task.projectName}</span>
                                    <span>•</span>
                                    <span>Due {formatDate(task.dueDate)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${task.priority === Priority.URGENT ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                                        task.priority === Priority.HIGH ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {task.priority}
                                </span>
                                {task.effort && (
                                    <span className="text-xs text-gray-400 font-mono">{task.effort}h est.</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full bg-ms-offwhite dark:bg-[#000000] p-8 flex flex-col overflow-hidden">
            {renderHeader()}
            {viewMode === 'month' && renderMonth()}
            {viewMode === 'week' && renderWeek()}
            {viewMode === 'day' && renderDay()}
        </div>
    );
};

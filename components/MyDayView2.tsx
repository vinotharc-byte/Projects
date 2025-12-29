import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Task, Person } from '../types';
import { Avatar, formatDate } from './UI';
import { MyDayView } from './MyDayView';

interface MyDayView2Props {
    projects: Project[];
    currentUser: string;
    people: Person[];
    onTaskClick: (task: Task) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'year';

export const MyDayView2: React.FC<MyDayView2Props> = ({ projects, currentUser, people, onTaskClick, onUpdateTask }) => {
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
    const [isCalendarView, setIsCalendarView] = useState(false);
    const [startDate, setStartDate] = useState(new Date()); // Viewport start date
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // -- Configuration --
    const config = useMemo(() => {
        switch (zoomLevel) {
            case 'day': return { pxPerUnit: 200, unit: 'day', daysPerUnit: 1, labelFormat: (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
            case 'week': return { pxPerUnit: 100, unit: 'day', daysPerUnit: 1, labelFormat: (d: Date) => d.getDate().toString() }; // Compressed days
            case 'month': return { pxPerUnit: 60, unit: 'day', daysPerUnit: 1, labelFormat: (d: Date) => d.getDate() === 1 ? d.toLocaleDateString('en-US', { month: 'short' }) : '' };
            case 'year': return { pxPerUnit: 20, unit: 'day', daysPerUnit: 1, labelFormat: (d: Date) => d.getDate() === 1 && d.getMonth() % 3 === 0 ? 'Q' + (Math.floor(d.getMonth() / 3) + 1) : '' };
            default: return { pxPerUnit: 100, unit: 'day', daysPerUnit: 1, labelFormat: (d: Date) => '' };
        }
    }, [zoomLevel]);

    // -- Data Processing --
    // 1. Filter Tasks for Current User & Normalize Dates
    const userTasks = useMemo(() => {
        return projects.flatMap(p =>
            p.tasks
                .filter(t => t.assignee === currentUser && t.startDate && t.dueDate)
                .map(t => ({
                    ...t,
                    projectName: p.name,
                    start: new Date(t.startDate!),
                    end: new Date(t.dueDate!)
                }))
        ).filter(t => !isNaN(t.start.getTime()) && !isNaN(t.end.getTime()));
    }, [projects, currentUser]);

    // 2. Packing Algorithm (Stacking)
    const lanes = useMemo(() => {
        // Sort tasks by start date
        const sorted = [...userTasks].sort((a, b) => a.start.getTime() - b.start.getTime());
        const lanes: (typeof sorted)[] = [];

        sorted.forEach(task => {
            let placed = false;
            // Try to fit in existing lanes
            for (let i = 0; i < lanes.length; i++) {
                const lane = lanes[i];
                // Check overlap with last task in this lane
                // Since sorted by start, we mostly care if the last task ends before this one starts
                // However, simpler robust check: check against all in lane (though last is usually sufficient if sorted)
                const hasOverlap = lane.some(t => {
                    return (task.start < t.end && task.end > t.start);
                });

                if (!hasOverlap) {
                    lane.push(task);
                    placed = true;
                    break;
                }
            }
            // If couldn't place in any existing lane, create new one
            if (!placed) {
                lanes.push([task]);
            }
        });
        return lanes;
    }, [userTasks]);

    // -- Timeline Generation --
    // Generate dates for the timeline header
    const timelineDates = useMemo(() => {
        const dates = [];
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Normalize to start of day
        start.setDate(start.getDate() - 3); // Buffer
        const daysToShow = zoomLevel === 'day' ? 14 : zoomLevel === 'week' ? 30 : zoomLevel === 'month' ? 90 : 365;

        for (let i = 0; i < daysToShow; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [startDate, zoomLevel]);

    const timelineStart = timelineDates[0];

    const getPosition = (date: Date) => {
        if (!timelineStart) return 0;
        // We need to compare specific point in time or just days?
        // For tasks, they are date-based (YYYY-MM-DD). 
        // Let's assume task.start is 00:00 Local of that day for simpler timeline mapping if we normalize inputs.
        // But userTasks currently does new Date(string).

        const diffTime = date.getTime() - timelineStart.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays * config.pxPerUnit;
    };

    const getDailyAllocation = (date: Date) => {
        // Normalize check date to 00:00
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const total = userTasks.reduce((sum, t) => {
            // Compare using normalized dates or simply time values if we trust they are 00:00
            // But t.start comes from YYYY-MM-DD which is usually UTC. 
            // Let's perform a safer YYYY-MM-DD string comparison for exact day matching
            // Or normalize t.start/t.end to local 00:00

            // Better approach:
            // Check if checkDate is between Start and End (inclusive)
            // We can use the YYYY-MM-DD strings we already have on 't' (t.startDate, t.dueDate) if available, 
            // or derive from t.start/t.end

            const tStart = new Date(t.start);
            tStart.setHours(0, 0, 0, 0);
            const tEnd = new Date(t.end);
            tEnd.setHours(0, 0, 0, 0);

            if (checkDate.getTime() >= tStart.getTime() && checkDate.getTime() <= tEnd.getTime()) {
                return sum + Number(t.allocation || 0); // Safely cast to number
            }
            return sum;
        }, 0);

        return total;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.shiftKey) {
            if (bodyRef.current) {
                bodyRef.current.scrollLeft += e.deltaY;
            }
        } else {
            // Optional: Vertical scroll for lanes if needed, 
            // OR if we want wheel to always scroll horizontal on the timeline area:
            // bodyRef.current.scrollLeft += e.deltaY;

            // Original behavior: Navigate date
            /*
            const newDate = new Date(startDate);
            newDate.setDate(newDate.getDate() + (e.deltaY > 0 ? 1 : -1));
            setStartDate(newDate);
            */
        }
    };

    // Drag Scrolling Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (bodyRef.current?.offsetLeft || 0));
        setScrollLeft(bodyRef.current?.scrollLeft || 0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !bodyRef.current) return;
        e.preventDefault();
        const x = e.pageX - bodyRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll-fast
        bodyRef.current.scrollLeft = scrollLeft - walk;
    };

    // Keyboard
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' && bodyRef.current) {
            bodyRef.current.scrollLeft += 100;
        }
        if (e.key === 'ArrowLeft' && bodyRef.current) {
            bodyRef.current.scrollLeft -= 100;
        }
    };

    // Sync Header Scroll
    const handleBodyScroll = () => {
        if (bodyRef.current && headerRef.current) {
            headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#111111]">
            {/* Top Toolbar */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-6">
                    {/* Back / Navigation Controls */}
                    <div className="flex items-center text-gray-500 dark:text-gray-400 space-x-4">
                        <button className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5">
                            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => setStartDate(new Date())} className="text-xs font-semibold px-2 text-gray-700 dark:text-gray-200 hover:text-planner-600 dark:hover:text-planner-400 transition-colors">Today</button>
                            <button onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Zoom Slider */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">View:</span>
                        <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-full p-1 relative shadow-inner">
                            {/* Selected Indicator */}
                            <div
                                className="absolute bg-white dark:bg-gray-600 shadow-sm rounded-full h-6 transition-all duration-300 ease-out z-0"
                                style={{
                                    width: '2rem',
                                    left: zoomLevel === 'day' ? '4px' : zoomLevel === 'week' ? '36px' : zoomLevel === 'month' ? '68px' : '100px'
                                }}
                            ></div>

                            {/* Buttons */}
                            <button onClick={() => setZoomLevel('day')} className={`w-8 h-6 text-[10px] font-bold z-10 relative transition-colors ${zoomLevel === 'day' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>D</button>
                            <button onClick={() => setZoomLevel('week')} className={`w-8 h-6 text-[10px] font-bold z-10 relative transition-colors ${zoomLevel === 'week' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>W</button>
                            <button onClick={() => setZoomLevel('month')} className={`w-8 h-6 text-[10px] font-bold z-10 relative transition-colors ${zoomLevel === 'month' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>M</button>
                            <button onClick={() => setZoomLevel('year')} className={`w-8 h-6 text-[10px] font-bold z-10 relative transition-colors ${zoomLevel === 'year' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Y</button>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

                    <button
                        onClick={() => setIsCalendarView(!isCalendarView)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCalendarView
                            ? 'bg-planner-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {isCalendarView ? 'Gantt View' : 'Calendar View'}
                    </button>
                </div>

                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                    {timelineStart?.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex flex-1 overflow-hidden">
                {isCalendarView ? (
                    <div className="flex-1 overflow-auto">
                        <MyDayView
                            projects={projects}
                            currentUser={currentUser}
                            onTaskClick={onTaskClick}
                            onUpdateTask={onUpdateTask}
                        />
                    </div>
                ) : (
                    /* Right Timeline Area */
                    <div
                        className="flex-1 overflow-hidden relative flex flex-col"
                    >
                        {/* Timeline Header (Synced Scroll) */}
                        <div
                            className="h-14 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 flex overflow-hidden select-none relative"
                            ref={headerRef}
                        >
                            <div className="flex">
                                {timelineDates.map((date, i) => {
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const allocation = getDailyAllocation(date);
                                    const isOverAllocated = allocation > 100;

                                    return (
                                        <div
                                            key={i}
                                            className={`shrink-0 border-r border-gray-100 dark:border-gray-800/50 flex flex-col items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 h-full relative transition-colors ${isToday ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                                            style={{ width: config.pxPerUnit }}
                                        >
                                            <div className="mb-0.5">{config.labelFormat(date)}</div>

                                            {/* Daily Allocation Total */}
                                            {config.pxPerUnit > 30 && (
                                                <div className={`text-[10px] ${isOverAllocated ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {allocation > 0 ? `${allocation}%` : '-'}
                                                </div>
                                            )}

                                            {isToday && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 dark:bg-red-400"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Timeline Grid & Tasks (Scrollable) */}
                        <div
                            className="flex-1 overflow-auto relative bg-gray-50/30 dark:bg-black/10 outline-none cursor-grab active:cursor-grabbing no-scrollbar-on-drag"
                            ref={bodyRef}
                            onScroll={handleBodyScroll}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onKeyDown={handleKeyDown}
                            tabIndex={0} // Make focusable for keyboard events
                        >
                            <div className="relative min-h-full" style={{ width: timelineDates.length * config.pxPerUnit }}>

                                {/* Background Grid Lines */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {timelineDates.map((d, i) => (
                                        <div
                                            key={i}
                                            className={`shrink-0 border-r border-gray-200/50 dark:border-gray-800/30 h-full ${d.getDay() === 0 || d.getDay() === 6 ? 'bg-gray-100/30 dark:bg-gray-800/20' : ''}`}
                                            style={{ width: config.pxPerUnit }}
                                        />
                                    ))}
                                </div>

                                {/* Current Time Marker */}
                                {(() => {
                                    const now = new Date();
                                    const pos = getPosition(now);
                                    if (pos > 0) {
                                        return <div className="absolute top-0 bottom-0 w-px bg-red-500 dark:bg-red-400 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ left: pos }}></div>;
                                    }
                                    return null;
                                })()}

                                {/* Task Swimlanes */}
                                <div className="pt-4 pb-20 relative px-0 pointer-events-none"> {/* Disable pointer events on container so drag works on empty space */}
                                    <div className="relative" style={{ height: lanes.length * 40 }}> {/* 40px per lane */}
                                        {lanes.map((lane, laneIdx) => (
                                            <div key={laneIdx} className="absolute w-full h-8" style={{ top: laneIdx * 38 }}>
                                                {lane.map(task => {
                                                    const left = getPosition(task.start);
                                                    const right = getPosition(task.end);
                                                    const width = Math.max(4, right - left);
                                                    const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 3600 * 24));

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} // Stop propagation so click doesn't trigger drag
                                                            className="absolute h-7 rounded bg-[#3b82f6] dark:bg-[#2563eb] border border-[#2563eb] dark:border-[#1d4ed8] shadow-sm cursor-pointer hover:bg-[#2563eb] dark:hover:bg-[#1d4ed8] hover:shadow-md transition-all group z-10 flex items-center px-2 overflow-hidden pointer-events-auto"
                                                            style={{
                                                                left: left,
                                                                width: width,
                                                            }}
                                                        >
                                                            <span className="text-[11px] font-medium text-white truncate whitespace-nowrap drop-shadow-sm flex items-center gap-1">
                                                                <span className="opacity-75">{task.projectName} |</span>
                                                                <span>{task.title}</span>
                                                                {task.allocation !== undefined && (
                                                                    <span className="opacity-90 bg-blue-700/50 dark:bg-blue-900/50 px-1 rounded ml-1 text-[10px]">
                                                                        {task.allocation}%
                                                                    </span>
                                                                )}
                                                            </span>

                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 dark:bg-[#222] text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 p-4 border border-white/10 dark:border-white/5 backdrop-blur-md">
                                                                <div className="font-bold text-sm mb-1 text-white">{task.title}</div>
                                                                <div className="text-gray-400 dark:text-gray-500 mb-3 pb-2 border-b border-white/10">{task.projectName}</div>
                                                                <div className="grid grid-cols-2 gap-3 text-[10px]">
                                                                    <div>
                                                                        <span className="uppercase font-bold text-gray-500 dark:text-gray-600 block mb-0.5">Start</span>
                                                                        <div className="font-mono text-gray-300">{formatDate(task.startDate)}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="uppercase font-bold text-gray-500 dark:text-gray-600 block mb-0.5">End</span>
                                                                        <div className="font-mono text-gray-300">{formatDate(task.dueDate)}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="uppercase font-bold text-gray-500 dark:text-gray-600 block mb-0.5">Alloc.</span>
                                                                        <div className="text-gray-300 font-semibold">{task.allocation || 0}%</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="uppercase font-bold text-gray-500 dark:text-gray-600 block mb-0.5">Status</span>
                                                                        <div className="text-gray-300">{task.status}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-[#222]"></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
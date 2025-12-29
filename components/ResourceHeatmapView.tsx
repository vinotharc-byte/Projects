import React, { useState, useMemo } from 'react';
import { Person, Project, Task } from '../types';
import { Avatar, Button } from './UI';

interface ResourceHeatmapProps {
  people: Person[];
  projects: Project[];
}

type ViewLevel = 'year' | 'quarter' | 'month';

export const ResourceHeatmapView: React.FC<ResourceHeatmapProps> = ({ people, projects }) => {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('year');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(0); // 0-3
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0-11

  // -- 1. Data Processing: Calculate Daily Allocation for Everyone --
  const dailyAllocations = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};

    // Initialize map for all people
    people.forEach(p => {
      map[p.name] = {};
    });

    // Helper to add allocation
    const addLoad = (assignee: string, dateStr: string, load: number) => {
      if (!map[assignee]) map[assignee] = {};
      map[assignee][dateStr] = (map[assignee][dateStr] || 0) + load;
    };

    // Iterate all tasks
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (!task.assignee || !task.startDate || !task.dueDate) return;

        const start = new Date(task.startDate);
        const end = new Date(task.dueDate);
        const load = (task.allocation || 100) / 100;

        // Loop through dates
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          addLoad(task.assignee, dateStr, load);
        }
      });
    });

    return map;
  }, [projects, people]);

  // -- 2. Helper: Get Average Load for a Date Range --
  const getAverageLoad = (personName: string, startDate: Date, endDate: Date) => {
    const dates: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    if (dates.length === 0) return 0;

    const totalLoad = dates.reduce((acc, dateStr) => {
      return acc + (dailyAllocations[personName]?.[dateStr] || 0);
    }, 0);

    return totalLoad / dates.length;
  };

  // -- 3. Cell Color Logic --
  const getCellClass = (value: number) => {
    if (value === 0) return 'bg-gray-50 text-gray-300';
    if (value <= 0.5) return 'bg-green-100 text-green-800';
    if (value <= 0.8) return 'bg-blue-100 text-blue-800';
    if (value <= 1.0) return 'bg-blue-600 text-white font-medium'; // Optimal
    if (value <= 1.2) return 'bg-orange-400 text-white font-medium'; // Slight overload
    return 'bg-red-600 text-white font-bold'; // Heavy overload
  };

  // -- 4. Column Generation based on View Level --

  const renderColumns = () => {
    let columns: { label: string, start: Date, end: Date, onClick?: () => void }[] = [];

    if (viewLevel === 'year') {
      // Show 4 Quarters
      for (let q = 0; q < 4; q++) {
        const start = new Date(currentYear, q * 3, 1);
        const end = new Date(currentYear, (q * 3) + 3, 0); // Last day of quarter
        columns.push({
          label: `Q${q + 1}`,
          start,
          end,
          onClick: () => {
            setSelectedQuarter(q);
            setViewLevel('quarter');
          }
        });
      }
    } else if (viewLevel === 'quarter') {
      // Show 3 Months in selected Quarter
      for (let m = 0; m < 3; m++) {
        const monthIndex = (selectedQuarter * 3) + m;
        const start = new Date(currentYear, monthIndex, 1);
        const end = new Date(currentYear, monthIndex + 1, 0);
        columns.push({
          label: start.toLocaleString('default', { month: 'long' }),
          start,
          end,
          onClick: () => {
            setSelectedMonth(monthIndex);
            setViewLevel('month');
          }
        });
      }
    } else if (viewLevel === 'month') {
      // Show Days in selected Month
      const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(currentYear, selectedMonth, d);
        columns.push({
          label: `${d}`,
          start: date,
          end: date,
          onClick: undefined // Lowest level
        });
      }
    }

    return columns;
  };

  const columns = renderColumns();

  // -- Navigation Helpers --
  const goUp = () => {
    if (viewLevel === 'month') setViewLevel('quarter');
    else if (viewLevel === 'quarter') setViewLevel('year');
  };

  const getBreadcrumb = () => {
    if (viewLevel === 'year') return `${currentYear}`;
    if (viewLevel === 'quarter') return `${currentYear} > Q${selectedQuarter + 1}`;
    const monthName = new Date(currentYear, selectedMonth).toLocaleString('default', { month: 'long' });
    return `${currentYear} > Q${selectedQuarter + 1} > ${monthName}`;
  };

  return (
    <div className="h-full bg-ms-offwhite dark:bg-[#000000] flex flex-col overflow-hidden">
      {/* Header / Toolbar */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10 px-6 py-4 flex justify-between items-center shadow-sm z-20">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Resource Allocation Heatmap</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Drill down: {getBreadcrumb()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewLevel !== 'year' && (
            <Button variant="secondary" onClick={goUp} className="flex items-center gap-1 text-xs">
              ← Back
            </Button>
          )}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded p-1">
            <button onClick={() => setCurrentYear(y => y - 1)} className="px-2 hover:bg-white dark:hover:bg-white/10 rounded text-gray-600 dark:text-gray-400">‹</button>
            <span className="px-2 text-sm font-semibold text-gray-700 dark:text-gray-200">{currentYear}</span>
            <button onClick={() => setCurrentYear(y => y + 1)} className="px-2 hover:bg-white dark:hover:bg-white/10 rounded text-gray-600 dark:text-gray-400">›</button>
          </div>
        </div>
      </div>

      {/* The Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow border border-gray-200 dark:border-white/10 inline-block min-w-full">
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-white/10 border-r border-gray-100 dark:border-white/5 p-3 text-left w-64 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Resource</span>
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={col.onClick}
                    className={`sticky top-0 z-20 bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-white/10 border-r border-gray-100 dark:border-white/5 p-2 text-center min-w-[60px] ${col.onClick ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    <div className="text-xs font-semibold">{col.label}</div>
                    {viewLevel === 'month' && (
                      <div className="text-[9px] font-normal text-gray-400 dark:text-gray-500">
                        {col.start.toLocaleDateString(undefined, { weekday: 'narrow' })}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map(person => (
                <tr key={person.id} className="group hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1a1a1a] group-hover:bg-gray-50 dark:group-hover:bg-[#222] border-b border-gray-100 dark:border-white/5 border-r border-gray-100 dark:border-white/5 p-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-3">
                      <Avatar name={person.name} className="w-8 h-8" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{person.name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{person.role}</div>
                      </div>
                    </div>
                  </td>
                  {columns.map((col, idx) => {
                    const val = getAverageLoad(person.name, col.start, col.end);
                    return (
                      <td
                        key={idx}
                        className={`border-b border-gray-100 dark:border-white/5 border-r border-gray-100 dark:border-white/5 text-center text-xs transition-colors h-12 ${getCellClass(val)}`}
                        title={`${person.name}: ${(val * 100).toFixed(0)}% avg allocation`}
                      >
                        {val > 0 ? val.toFixed(1) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-4 text-xs text-gray-600 dark:text-gray-400 justify-end">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></span> 0%
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-900/50"></span> 1-50%
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-900/50"></span> 51-80%
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-600"></span> 81-100%
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600"></span> &gt;120%
          </div>
        </div>
      </div>
    </div>
  );
};

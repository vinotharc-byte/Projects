import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, Status, Priority } from '../types';

interface ChartsViewProps {
  tasks: Task[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const PRIORITY_COLORS = {
  [Priority.LOW]: '#10b981',
  [Priority.MEDIUM]: '#3b82f6',
  [Priority.HIGH]: '#f59e0b',
  [Priority.URGENT]: '#ef4444',
};

export const ChartsView: React.FC<ChartsViewProps> = ({ tasks }) => {
  // Process Data for Status
  const statusData = [
    { name: 'Not Started', value: tasks.filter(t => t.status === Status.NOT_STARTED).length },
    { name: 'In Progress', value: tasks.filter(t => t.status === Status.IN_PROGRESS).length },
    { name: 'Completed', value: tasks.filter(t => t.status === Status.COMPLETED).length },
  ].filter(d => d.value > 0);

  // Process Data for Priority
  const priorityData = Object.values(Priority).map(p => ({
    name: p,
    count: tasks.filter(t => t.priority === p).length
  }));

  return (
    <div className="p-6 bg-ms-offwhite dark:bg-[#000000] h-full overflow-y-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Project Status Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-100 dark:border-white/10">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Task Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Chart */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-100 dark:border-white/10">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Tasks by Priority</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as Priority]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-100 dark:border-white/10 flex justify-between items-center">
          <div className="text-center px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tasks.length}</p>
          </div>
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-800"></div>
          <div className="text-center px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">{tasks.filter(t => t.status === Status.COMPLETED).length}</p>
          </div>
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-800"></div>
          <div className="text-center px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Urgent</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">{tasks.filter(t => t.priority === Priority.URGENT).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
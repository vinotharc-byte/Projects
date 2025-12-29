import React, { useState } from 'react';
import { Person } from '../types';
import { Button, Avatar, Badge, formatDate } from './UI';

interface PeopleMasterViewProps {
  people: Person[];
  onAddPerson: (person: Partial<Person>) => void;
  onUpdatePerson: (id: string, updates: Partial<Person>) => void;
  onDeletePerson: (id: string) => void;
}

export const PeopleMasterView: React.FC<PeopleMasterViewProps> = ({
  people,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create Form State
  const [newPerson, setNewPerson] = useState<Partial<Person>>({
    name: '',
    role: '',
    team: '',
    manager: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const handleCreate = () => {
    if (!newPerson.name?.trim()) return;
    onAddPerson({
      ...newPerson,
      email: newPerson.name.toLowerCase().replace(' ', '.') + '@company.com'
    });
    setNewPerson({
      name: '',
      role: '',
      team: '',
      manager: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsCreating(false);
  };

  return (
    <div className="h-full bg-ms-offwhite dark:bg-[#000000] p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">People Directory</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage employees, roles, teams, and employment history.</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <span className="text-xl leading-none">+</span> Add Person
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-md border border-gray-200 dark:border-white/10 mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-white/10">Add New Employee</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Full Name</label>
                <input
                  autoFocus
                  className="w-full border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Sarah Connor"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Role / Job Title</label>
                <input
                  className="w-full border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Senior Designer"
                  value={newPerson.role}
                  onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Team / Dept</label>
                <input
                  className="w-full border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Product Design"
                  value={newPerson.team}
                  onChange={(e) => setNewPerson({ ...newPerson, team: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Reporting Manager</label>
                <input
                  className="w-full border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Jane Doe"
                  value={newPerson.manager}
                  onChange={(e) => setNewPerson({ ...newPerson, manager: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Join Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  value={newPerson.joinDate}
                  onChange={(e) => setNewPerson({ ...newPerson, joinDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  value={newPerson.status}
                  onChange={(e) => setNewPerson({ ...newPerson, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save Employee</Button>
            </div>
          </div>
        )}

        {/* Directory Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role & Team</th>
                <th className="px-6 py-4">Reports To</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {people.map(person => {
                const isEditing = editingId === person.id;

                return (
                  <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full mb-1 bg-white text-gray-900"
                          value={person.name}
                          onChange={(e) => onUpdatePerson(person.id, { name: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Avatar name={person.name} className="w-8 h-8" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{person.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{person.email}</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900" value={person.role} onChange={(e) => onUpdatePerson(person.id, { role: e.target.value })} placeholder="Role" />
                          <input className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900" value={person.team} onChange={(e) => onUpdatePerson(person.id, { team: e.target.value })} placeholder="Team" />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{person.role}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded inline-block mt-1">{person.team}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input className="border border-gray-300 rounded px-2 py-1 text-sm w-full bg-white text-gray-900" value={person.manager} onChange={(e) => onUpdatePerson(person.id, { manager: e.target.value })} />
                      ) : (
                        <div className="flex items-center gap-2">
                          {person.manager && <Avatar name={person.manager} className="w-6 h-6 text-[10px]" />}
                          <span className="text-sm text-gray-700 dark:text-gray-300">{person.manager || '-'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Join:</label>
                          <input type="date" className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-900" value={person.joinDate} onChange={(e) => onUpdatePerson(person.id, { joinDate: e.target.value })} />
                          <label className="text-[10px] text-gray-400">Resign:</label>
                          <input type="date" className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-900" value={person.resignDate || ''} onChange={(e) => onUpdatePerson(person.id, { resignDate: e.target.value })} />
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div><span className="text-gray-400 dark:text-gray-500 w-12 inline-block">Joined:</span> {formatDate(person.joinDate)}</div>
                          {person.resignDate && (
                            <div className="text-red-600"><span className="text-red-400 w-12 inline-block">Left:</span> {formatDate(person.resignDate)}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900"
                          value={person.status}
                          onChange={(e) => onUpdatePerson(person.id, { status: e.target.value as any })}
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Resigned">Resigned</option>
                        </select>
                      ) : (
                        <Badge color={
                          person.status === 'Active' ? 'bg-green-100 text-green-800' :
                            person.status === 'Resigned' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {person.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <button onClick={() => setEditingId(null)} className="text-green-600 hover:bg-green-50 p-1.5 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        ) : (
                          <button onClick={() => setEditingId(person.id)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded" title="Edit Attributes">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        )}
                        <button onClick={() => onDeletePerson(person.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded" title="Delete Person">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {people.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">No people found in directory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
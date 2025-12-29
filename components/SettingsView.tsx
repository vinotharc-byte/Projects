import React, { useState } from 'react';
import { Team, Person } from '../types';
import { Button } from './UI';
import { PeopleMasterView } from './PeopleMasterView';

interface SettingsViewProps {
  teams: Team[];
  onAddTeam: (name: string) => void;
  onDeleteTeam: (id: string) => void;
  onUpdateTeam: (id: string, name: string) => void;
  // People Props
  people: Person[];
  onAddPerson: (person: Partial<Person>) => void;
  onUpdatePerson: (id: string, updates: Partial<Person>) => void;
  onDeletePerson: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teams, onAddTeam, onDeleteTeam, onUpdateTeam,
  people, onAddPerson, onUpdatePerson, onDeletePerson
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'people'>('general');
  const [newTeamName, setNewTeamName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newTeamName.trim()) {
      onAddTeam(newTeamName.trim());
      setNewTeamName('');
    }
  };

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setEditName(team.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdateTeam(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="h-full bg-ms-offwhite dark:bg-[#000000] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-planner-600 text-planner-700 dark:text-planner-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            General & Teams
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'people' ? 'border-planner-600 text-planner-700 dark:text-planner-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            People Directory
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 max-w-4xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Master Teams / Functions</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">These teams will appear as columns in the RACI matrix for all projects.</p>
              </div>
            </div>

            <div className="p-6">
              {/* Add New */}
              <div className="flex gap-4 mb-6">
                <input
                  className="flex-1 border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-planner-600 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                  placeholder="Enter new Function name (e.g. Legal, Security, Compliance)"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd}>Add Function</Button>
              </div>

              {/* List */}
              <div className="border dark:border-white/10 rounded-md divide-y divide-gray-100 dark:divide-white/5">
                {teams.map(team => (
                  <div key={team.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 group">
                    {editingId === team.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus
                          className="border border-gray-300 dark:border-white/10 rounded px-2 py-1 text-sm flex-1 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(team.id)}
                        />
                        <button onClick={() => saveEdit(team.id)} className="text-green-600 dark:text-green-400 text-xs font-semibold px-2">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 dark:text-gray-400 text-xs px-2">Cancel</button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{team.name}</span>
                    )}

                    {!editingId && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(team)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => onDeleteTeam(team.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {teams.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm italic">No functions defined. Add one above.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="-m-8">
            <PeopleMasterView
              people={people}
              onAddPerson={onAddPerson}
              onUpdatePerson={onUpdatePerson}
              onDeletePerson={onDeletePerson}
            />
          </div>
        )}
      </div>
    </div>
  );
};
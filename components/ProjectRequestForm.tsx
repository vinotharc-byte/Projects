import React, { useState } from 'react';
import { Project } from '../types';
import { Button } from './UI';

interface ProjectRequestFormProps {
    onSubmit: (project: Partial<Project>) => void;
}

export const ProjectRequestForm: React.FC<ProjectRequestFormProps> = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        skillset: '',
        description: '',
        businessUnit: '',
        priority: 'Medium',
        expectedStartDate: '',
        expectedEndDate: '',
        requestorEmail: '',
        sendCopy: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Transform form data to Project type partial
        const newProject: Partial<Project> = {
            name: formData.title,
            description: formData.description,
            businessUnit: formData.businessUnit,
            priority: formData.priority as any,
            expectedStartDate: formData.expectedStartDate,
            expectedEndDate: formData.expectedEndDate,
            requestor: formData.requestorEmail,
            skillset: formData.skillset ? [formData.skillset] : [],
            status: 'Planning'
        };

        // Simulate network delay for better UX
        setTimeout(() => {
            onSubmit(newProject);
            setIsSubmitting(false);
            // Reset form? Or redirect? Usually handled by parent.
        }, 500);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full p-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Request</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Submit a new project proposal for review.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none transition-all dark:text-white"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Enter project title"
                            />
                        </div>

                        {/* Skillset */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Skillset <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none appearance-none transition-all dark:text-white"
                                    value={formData.skillset}
                                    onChange={(e) => handleChange('skillset', e.target.value)}
                                >
                                    <option value="" disabled>Select Skillset</option>
                                    <option value="IT">IT</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Finance">Finance</option>
                                    <option value="HR">HR</option>
                                    <option value="Product">Product</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Purpose/Background */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Purpose/Background/Business Problem <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none transition-all resize-none dark:text-white"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Describe the business problem or purpose..."
                            />
                        </div>

                        {/* Business Unit */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Business <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none appearance-none transition-all dark:text-white"
                                    value={formData.businessUnit}
                                    onChange={(e) => handleChange('businessUnit', e.target.value)}
                                >
                                    <option value="" disabled>Select Business Unit</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Logistics">Logistics</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Priority
                                <span className="block text-xs font-normal text-gray-500 mt-0.5">Low - Low Priority</span>
                            </label>
                            <div className="flex gap-6">
                                {['Low', 'Medium', 'High'].map((p) => (
                                    <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.priority === p ? 'border-planner-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-planner-400'}`}>
                                            {formData.priority === p && <div className="w-2.5 h-2.5 rounded-full bg-planner-600" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p}
                                            checked={formData.priority === p}
                                            onChange={(e) => handleChange('priority', e.target.value)}
                                            className="hidden"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Expected Start date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none transition-all dark:text-white"
                                    value={formData.expectedStartDate}
                                    onChange={(e) => handleChange('expectedStartDate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Expected End date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="date"
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none transition-all dark:text-white"
                                    value={formData.expectedEndDate}
                                    onChange={(e) => handleChange('expectedEndDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Requestor Email */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Requestor Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="email"
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-planner-500 focus:border-transparent outline-none transition-all dark:text-white"
                                value={formData.requestorEmail}
                                onChange={(e) => handleChange('requestorEmail', e.target.value)}
                                placeholder="Enter full Valid Email Id"
                            />
                        </div>

                        {/* File Upload Mock */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                File Upload
                            </label>
                            <div className="border-2 border-dashed border-planner-200 dark:border-planner-900/50 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-planner-50/50 dark:bg-planner-900/10 cursor-pointer hover:bg-planner-50 dark:hover:bg-planner-900/20 transition-colors group">
                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-planner-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">Drop your files here</p>
                                <p className="text-sm text-planner-600 font-medium mt-1">Browse</p>
                            </div>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        {/* Checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-planner-600 focus:ring-planner-500"
                                checked={formData.sendCopy}
                                onChange={(e) => handleChange('sendCopy', e.target.checked)}
                            />
                            <span className="text-gray-700 dark:text-gray-300 font-medium select-none">Send me a copy of my responses</span>
                        </label>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="px-8 h-12 bg-planner-600 hover:bg-planner-700 text-white font-bold rounded-lg shadow-lg shadow-planner-600/20 transition-all hover:-translate-y-0.5"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

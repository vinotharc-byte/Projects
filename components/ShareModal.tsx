import React, { useState } from 'react';
import { Button } from './UI';

interface ShareModalProps {
   onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose }) => {
   const [activeTab, setActiveTab] = useState<'link' | 'sharepoint'>('link');
   const [copied, setCopied] = useState(false);

   const handleCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   return (
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
         <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-white/10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
               <h3 className="font-bold text-gray-900 dark:text-gray-100">Share Project</h3>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-white/10">
               <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'link' ? 'text-planner-600 border-planner-600 bg-planner-50/10 dark:bg-planner-900/10' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
               >
                  Link Sharing
               </button>
               <button
                  onClick={() => setActiveTab('sharepoint')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sharepoint' ? 'text-planner-600 border-planner-600 bg-planner-50/10 dark:bg-planner-900/10' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
               >
                  SharePoint Deploy
               </button>
            </div>

            <div className="p-6">
               {activeTab === 'link' && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Anyone with the link</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Can view and edit</p>
                           </div>
                        </div>
                        <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Change</button>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Project Link</label>
                        <div className="flex gap-2">
                           <input
                              readOnly
                              value="https://planner-pro.company.internal/p/next-gen-ev-battery"
                              className="flex-1 text-sm border border-gray-300 dark:border-white/10 rounded px-3 py-2 bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-planner-600"
                           />
                           <Button onClick={handleCopy} variant="secondary" className="min-w-[80px]">
                              {copied ? 'Copied!' : 'Copy'}
                           </Button>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'sharepoint' && (
                  <div className="space-y-5">
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-3">
                        <div className="text-2xl">🏢</div>
                        <div>
                           <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Internal Enterprise Hosting</h4>
                           <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                              You can host this entire application securely on your organization's SharePoint Document Library without needing IT to provision a server.
                           </p>
                        </div>
                     </div>

                     <div className="space-y-4 px-1">
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-planner-100 dark:group-hover:bg-planner-900/30 group-hover:text-planner-700 dark:group-hover:text-planner-300 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0 transition-colors mt-0.5">1</div>
                           <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Build & Export</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                 Click the button below to generate a production-ready build package (ZIP).
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-planner-100 dark:group-hover:bg-planner-900/30 group-hover:text-planner-700 dark:group-hover:text-planner-300 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0 transition-colors mt-0.5">2</div>
                           <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Rename Entry File</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                 Inside the unzipped folder, rename <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-mono text-[10px]">index.html</code> to <code className="bg-yellow-50 dark:bg-yellow-900/20 px-1 py-0.5 rounded border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-400 font-mono text-[10px] font-bold">index.aspx</code>.
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-planner-100 dark:group-hover:bg-planner-900/30 group-hover:text-planner-700 dark:group-hover:text-planner-300 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0 transition-colors mt-0.5">3</div>
                           <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Upload & Launch</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                 Drag the folder into any SharePoint Document Library. Click the <code className="text-[10px] text-gray-700 dark:text-gray-300">.aspx</code> file to launch the app instantly.
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                        <Button className="w-full flex items-center justify-center gap-2 py-2.5 shadow-md hover:shadow-lg transition-all" onClick={() => alert("This is a prototype demo. In a real build environment, this would trigger a download of the 'dist' folder.")}>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           Download Build Package
                        </Button>
                        <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2">
                           Package includes React runtime, Tailwind CSS, and optimized assets.
                        </p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};
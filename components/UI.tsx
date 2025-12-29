import React from 'react';

// Microsoft-style Button
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }> = ({
  className = '',
  variant = 'primary',
  children,
  ...props
}) => {
  const baseStyle = "px-4 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-planner-600";

  const variants = {
    primary: "bg-planner-600 text-white hover:bg-planner-700 shadow-sm",
    secondary: "bg-white dark:bg-[#222] border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] shadow-sm",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Avatar: React.FC<{ name?: string, className?: string }> = ({ name = "User", className = "" }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold border border-white dark:border-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 ${className}`}>
      {initials}
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
    {children}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, maxWidth?: string, headerContent?: React.ReactNode, noPadding?: boolean, noScroll?: boolean }> = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl", headerContent, noPadding = false, noScroll = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className={`bg-white dark:bg-[#1a1a1a] w-full ${maxWidth} rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">{title}</h2>
            {headerContent}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className={`flex-1 ${noScroll ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'} ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  // Format: dd/Mmm/YYYY (e.g., 05/Jan/2025)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
};
import React from 'react';
import { ArrowLeft, Settings, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onBack, 
  onSettings,
  rightAction,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-blue-600 dark:bg-orange-900 text-white shadow-md transition-colors duration-500 pt-safe-top">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Go Back"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm opacity-90 leading-tight">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {rightAction}
          {onSettings && (
            <button 
              onClick={onSettings}
              className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
            >
              <Settings size={24} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-2xl shadow-sm border border-blue-100 dark:border-orange-900/30 p-5 ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const Fab: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 bg-blue-700 dark:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 dark:hover:bg-orange-500 active:scale-90 transition-all z-40"
    >
      <Plus size={28} />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
};
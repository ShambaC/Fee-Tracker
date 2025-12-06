import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ isOpen, message, type = 'success', onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />
  };

  const bgMap = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-100 flex justify-center animate-slide-down">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgMap[type]}`}>
        {iconMap[type]}
        <span className="text-sm font-medium text-slate-800 dark:text-white">{message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={16} className="text-slate-500 dark:text-stone-400" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${
              variant === 'danger' 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              <AlertTriangle 
                size={24} 
                className={variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}
              />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          </div>
          <p className="text-slate-600 dark:text-stone-300 mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors active:scale-[0.98]"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors active:scale-[0.98] ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                  : 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

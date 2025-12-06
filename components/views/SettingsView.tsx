import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, FileDown, FileUp, Download, Upload, Smartphone } from 'lucide-react';
import { AppData } from '../../types';
import { Header, Card } from '../Layout';
import { exportToFile, importFromFile } from '../../services/storage';

const SettingsView: React.FC<{
  data: AppData;
  onImport: (d: AppData) => void;
  onBack: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onExitComplete?: () => void;
  isExiting?: boolean;
}> = ({ data, onImport, onBack, theme, onToggleTheme, onShowToast, onExitComplete, isExiting }) => {
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExiting && containerRef.current) {
      const handleAnimationEnd = () => onExitComplete?.();
      containerRef.current.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => containerRef.current?.removeEventListener('animationend', handleAnimationEnd);
    }
  }, [isExiting, onExitComplete]);

  const handleExportFile = async () => {
    const result = await exportToFile(data);
    if (result.success) {
      if (result.path) {
        onShowToast(`Backup saved to ${result.path}`, 'success');
      } else {
        onShowToast('Backup file downloaded!', 'success');
      }
    } else {
      onShowToast(result.error || 'Failed to export backup', 'error');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parsed = await importFromFile(file);
    if (parsed) {
      onImport(parsed);
      onShowToast('Data imported successfully!', 'success');
      onBack();
    } else {
      setError('Invalid backup file format.');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-blue-50 dark:bg-stone-950 z-30 flex flex-col ${isExiting ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}
    >
      <Header title="Settings" onBack={onBack} />
      <div className="flex-1 overflow-y-scroll hide-scrollbar overscroll-contain">
        <div className="p-4 space-y-6 pb-12">
          <Card className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               {theme === 'dark' ? <Moon className="text-orange-400" /> : <Sun className="text-orange-400" />}
               <span className="font-bold text-slate-800 dark:text-white">Dark Mode</span>
             </div>
             <button 
               onClick={onToggleTheme}
               className={`w-14 h-8 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-orange-600' : 'bg-blue-200'}`}
             >
               <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
             </button>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-slate-800 dark:text-white mb-2">
              <FileDown className="text-slate-600 dark:text-stone-400" />
              <h3 className="font-bold">Export Backup</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-stone-300">Download your data as a JSON file to back up or transfer to another device.</p>
            <button 
              onClick={handleExportFile} 
              className="w-full bg-blue-600 dark:bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 dark:hover:bg-orange-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Backup File
            </button>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-slate-800 dark:text-white mb-2">
              <FileUp className="text-slate-600 dark:text-stone-400" />
              <h3 className="font-bold">Import Backup</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-stone-300">Select a backup file to restore your data. This will replace all current data.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
              id="backup-file-input"
            />
            <label 
              htmlFor="backup-file-input"
              className="w-full bg-blue-100 dark:bg-stone-800 text-blue-800 dark:text-orange-100 py-3 rounded-lg font-bold hover:bg-blue-200 dark:hover:bg-stone-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload size={18} />
              Select Backup File
            </label>
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          </Card>

          <div className="text-center text-xs text-slate-400 dark:text-stone-600 pt-8">
            <p>Yoga Fee Tracker v1.6</p>
            <p className="flex items-center justify-center gap-1">
              <Smartphone size={12} /> Native Storage
            </p>
            <p>Made with ❤️ by ShambaC</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

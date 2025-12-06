import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../Layout';

const AddForm: React.FC<{
  title: string;
  onSave: (val1: string, val2?: string) => void;
  onBack: () => void;
  field1Label: string;
  field2Label?: string;
  field2Default?: string;
  field2Type?: 'text' | 'number';
  onExitComplete?: () => void;
  isExiting?: boolean;
}> = ({ title, onSave, onBack, field1Label, field2Label, field2Default = '', field2Type = 'text', onExitComplete, isExiting }) => {
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState(field2Default);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExiting && containerRef.current) {
      const handleAnimationEnd = () => onExitComplete?.();
      containerRef.current.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => containerRef.current?.removeEventListener('animationend', handleAnimationEnd);
    }
  }, [isExiting, onExitComplete]);

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen absolute top-0 w-full z-40 bg-blue-50 dark:bg-stone-950 ${isExiting ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}
    >
      <Header title={title} onBack={onBack} />
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-stone-300">{field1Label}</label>
          <input 
            autoFocus
            type="text" 
            value={val1}
            onChange={(e) => setVal1(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 p-4 rounded-xl border border-blue-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 text-lg dark:text-white"
          />
        </div>
        {field2Label && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-stone-300">{field2Label}</label>
            <input 
              type={field2Type}
              value={val2}
              onChange={(e) => setVal2(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 p-4 rounded-xl border border-blue-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 text-lg dark:text-white"
            />
          </div>
        )}

        <button 
          onClick={() => { if(val1) onSave(val1, val2) }}
          disabled={!val1}
          className="w-full bg-blue-800 dark:bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-900 disabled:opacity-50 mt-8"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AddForm;

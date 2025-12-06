import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../Layout';
import ColorPicker from '../ColorPicker';

const AddLocationForm: React.FC<{
  onSave: (name: string, color: string) => void;
  onBack: () => void;
  onExitComplete?: () => void;
  isExiting?: boolean;
}> = ({ onSave, onBack, onExitComplete, isExiting }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
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
      <Header title="Add Location" onBack={onBack} />
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-stone-300">Location Name</label>
          <input 
            autoFocus
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 p-4 rounded-xl border border-blue-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 text-lg dark:text-white"
            placeholder="e.g. Community Center"
          />
        </div>
        <ColorPicker 
          selectedColor={selectedColor} 
          onColorChange={setSelectedColor} 
        />

        {name && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-stone-300">Preview</label>
            <div 
              className="bg-white dark:bg-stone-900 rounded-xl p-4 shadow-md flex items-center gap-3 overflow-hidden"
              style={{
                borderLeft: `4px solid ${selectedColor}`,
                background: `linear-gradient(to right, ${selectedColor}10, transparent)`
              }}
            >
              <div 
                className="w-10 h-10 rounded-full shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-orange-50">{name}</h4>
                <p className="text-slate-500 dark:text-stone-400 text-sm">0 Students</p>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => { if(name) onSave(name, selectedColor) }}
          disabled={!name}
          className="w-full bg-blue-800 dark:bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-900 disabled:opacity-50 mt-8"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AddLocationForm;

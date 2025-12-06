import React, { useRef } from 'react';
import { Check, Palette } from 'lucide-react';

const LOCATION_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

const ColorPicker: React.FC<{
  selectedColor: string;
  onColorChange: (color: string) => void;
}> = ({ selectedColor, onColorChange }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 dark:text-stone-300">Location Color</label>
      <div className="flex flex-wrap gap-3 items-center">
        {LOCATION_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
              selectedColor === color 
                ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-orange-400 dark:ring-offset-stone-950 scale-110' 
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: color }}
          >
            {selectedColor === color && <Check size={18} className="text-white drop-shadow-md" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className={`w-10 h-10 rounded-full border-2 border-dashed border-slate-300 dark:border-stone-600 flex items-center justify-center hover:border-slate-400 dark:hover:border-stone-500 transition-all hover:scale-110 ${
            !LOCATION_COLORS.includes(selectedColor) && selectedColor 
              ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-orange-400 dark:ring-offset-stone-950' 
              : ''
          }`}
          style={!LOCATION_COLORS.includes(selectedColor) && selectedColor ? { backgroundColor: selectedColor } : undefined}
        >
          {!LOCATION_COLORS.includes(selectedColor) && selectedColor ? (
            <Check size={18} className="text-white drop-shadow-md" />
          ) : (
            <Palette size={18} className="text-slate-400 dark:text-stone-500" />
          )}
        </button>
        <input
          ref={colorInputRef}
          type="color"
          value={selectedColor || '#3B82F6'}
          onChange={(e) => onColorChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </div>
  );
};

export default ColorPicker;

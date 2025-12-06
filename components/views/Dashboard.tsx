import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppData } from '../../types';
import { Header, Card, Fab } from '../Layout';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Dashboard: React.FC<{
  data: AppData;
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onLocationSelect: (id: string) => void;
  onSettings: () => void;
  onAddLocation: () => void;
  isVisible: boolean;
}> = ({ data, month, year, onMonthChange, onLocationSelect, onSettings, onAddLocation, isVisible }) => {
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalStudents = 0;
    const periodPayments = data.payments.filter(p => p.month === month && p.year === year);
    totalCollected = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    totalStudents = data.students.filter(s => s.isActive).length;

    const locStats = data.locations.map(loc => {
      const locStudents = data.students.filter(s => s.locationId === loc.id && s.isActive);
      const paidCount = locStudents.filter(s => 
        periodPayments.some(p => p.studentId === s.id)
      ).length;
      return { ...loc, studentCount: locStudents.length, paidCount };
    });

    return { totalCollected, totalStudents, locStats };
  }, [data, month, year]);

  return (
    <div className={`min-h-screen pb-24 ${isVisible ? 'animate-fade-in' : ''}`}>
      <Header 
        title="Yoga Fee Tracker" 
        onSettings={onSettings}
      />
      <div className="bg-blue-600 dark:bg-orange-800 pb-16 pt-2 px-4 rounded-b-[2.5rem] text-white shadow-lg relative z-10 transition-colors duration-500">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => onMonthChange(month === 0 ? 11 : month - 1)} className="p-2 rounded-full hover:bg-white/20">
            <ChevronRight className="rotate-180" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold w-28">{MONTHS[month]}</h2>
            <p className="opacity-80 font-medium">{year}</p>
          </div>
          <button onClick={() => onMonthChange(month === 11 ? 0 : month + 1)} className="p-2 rounded-full hover:bg-white/20">
            <ChevronRight />
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm uppercase tracking-wider opacity-80 mb-1">Total Collected</p>
          <p className="text-4xl font-bold">₹{stats.totalCollected.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 mt-6 relative z-20 space-y-4">
        <div className="flex justify-between items-end px-2 mb-2 h-8">
           <h3 className="font-bold text-slate-800 dark:text-orange-50 text-lg shadow-sm bg-blue-100 dark:bg-stone-800 px-3 py-1 rounded-lg">Locations</h3>
        </div>
        {stats.locStats.map(loc => (
          <Card 
            key={loc.id} 
            onClick={() => onLocationSelect(loc.id)} 
            className="flex items-center justify-between overflow-hidden"
            style={loc.color ? {
              borderLeft: `4px solid ${loc.color}`,
              background: `linear-gradient(to right, ${loc.color}10, transparent)`
            } : undefined}
          >
            <div className="flex items-center gap-3">
              {loc.color && (
                <div 
                  className="w-10 h-10 rounded-full shrink-0 -ml-1"
                  style={{ backgroundColor: loc.color }}
                />
              )}
              <div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-orange-50">{loc.name}</h4>
                <p className="text-slate-500 dark:text-stone-400 text-sm">{loc.studentCount} Students</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`font-bold ${loc.paidCount === loc.studentCount && loc.studentCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>
                  {loc.paidCount} / {loc.studentCount}
                </p>
                <p className="text-xs text-slate-400 dark:text-stone-500">Paid</p>
              </div>
              <ChevronRight className="text-slate-300 dark:text-stone-600" />
            </div>
          </Card>
        ))}
      </div>
      <Fab onClick={onAddLocation} label="Add Location" />
    </div>
  );
};

export default Dashboard;

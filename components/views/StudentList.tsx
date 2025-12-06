import React, { useEffect, useState, useRef } from 'react';
import { Search, Check, Trash2 } from 'lucide-react';
import { Location, Student, Payment } from '../../types';
import { Header, Card, Fab } from '../Layout';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const StudentList: React.FC<{
  location: Location;
  students: Student[];
  payments: Payment[];
  month: number;
  year: number;
  onBack: () => void;
  onSelectStudent: (id: string) => void;
  onAddStudent: () => void;
  onDeleteLocation: () => void;
  onExitComplete?: () => void;
  isExiting?: boolean;
}> = ({ location, students, payments, month, year, onBack, onSelectStudent, onAddStudent, onDeleteLocation, onExitComplete, isExiting }) => {
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExiting && containerRef.current) {
      const handleAnimationEnd = () => onExitComplete?.();
      containerRef.current.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => containerRef.current?.removeEventListener('animationend', handleAnimationEnd);
    }
  }, [isExiting, onExitComplete]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPaymentStatus = (studentId: string) => {
    return payments.find(p => p.studentId === studentId && p.month === month && p.year === year);
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-blue-50 dark:bg-stone-950 absolute top-0 w-full z-10 ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
    >
      <Header 
        title={location.name} 
        subtitle={`${MONTHS[month]} ${year}`}
        onBack={onBack}
        rightAction={
          <button 
            onClick={onDeleteLocation} 
            className="p-2 -mr-2 text-white/80 hover:text-red-200 active:scale-95 transition-all"
            aria-label="Delete Location"
          >
            <Trash2 size={20} />
          </button>
        }
      />

      <div className="p-4 space-y-4 pb-24">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-stone-500" size={20} />
          <input 
            type="text" 
            placeholder="Search student..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 pl-10 pr-4 py-3 rounded-xl border border-blue-200 dark:border-orange-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 text-slate-800 dark:text-orange-50 placeholder:text-slate-400 dark:placeholder:text-stone-600"
          />
        </div>

        <div className="space-y-3 overflow-y-scroll hide-scrollbar max-h-[60vh]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-stone-500">
              <p>No students found.</p>
            </div>
          ) : filteredStudents.map(student => {
            const payment = getPaymentStatus(student.id);
            return (
              <Card key={student.id} onClick={() => onSelectStudent(student.id)} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${payment ? 'bg-emerald-500' : 'bg-blue-200 text-blue-800 dark:bg-orange-800 dark:text-orange-100'}`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-orange-50">{student.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${payment ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}`}>
                      {payment ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
                {payment ? (
                   <Check className="text-emerald-500" />
                ) : (
                   <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-stone-600 flex items-center justify-center opacity-50 text-slate-400 dark:text-stone-500">
                     <span className="text-xs font-bold">₹</span>
                   </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      <Fab onClick={onAddStudent} label="Add Student" />
    </div>
  );
};

export default StudentList;

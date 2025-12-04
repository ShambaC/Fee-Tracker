import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  Check, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  Download, 
  Upload, 
  XCircle,
  Clock,
  Moon,
  Sun,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AppData, Location, Student, Payment, ViewState } from './types';
import { loadData, saveData, exportData, importData, loadTheme, saveTheme } from './services/storage';
import { Header, Card, Fab } from './components/Layout';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Simple icon helper for the big button
const CheckCircleIcon = () => (
  <div className="bg-white/20 rounded-full p-1">
    <Check size={20} />
  </div>
);

// --- Sub-Components (Views) ---

// 1. Dashboard View
const Dashboard: React.FC<{
  data: AppData;
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onLocationSelect: (id: string) => void;
  onSettings: () => void;
  onAddLocation: () => void;
}> = ({ data, month, year, onMonthChange, onLocationSelect, onSettings, onAddLocation }) => {
  
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalStudents = 0;
    
    // Payments for current period
    const periodPayments = data.payments.filter(p => p.month === month && p.year === year);
    totalCollected = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    totalStudents = data.students.filter(s => s.isActive).length;
    
    // Per location stats
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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen pb-24"
    >
      <Header 
        title="Yoga Fee Tracker" 
        onSettings={onSettings}
      />
      
      {/* Month Selector & Summary */}
      <div className="bg-blue-600 dark:bg-orange-800 pb-16 pt-2 px-4 rounded-b-[2.5rem] text-white shadow-lg relative z-10 transition-colors duration-500">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => onMonthChange(month === 0 ? 11 : month - 1)} className="p-2 rounded-full hover:bg-white/20">
            <ChevronRight className="rotate-180" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{MONTHS[month]}</h2>
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

      {/* Location List */}
      <div className="px-4 mt-6 relative z-20 space-y-4">
        <div className="flex justify-between items-end px-2 mb-2 h-8">
           <h3 className="font-bold text-slate-800 dark:text-orange-50 text-lg shadow-sm bg-blue-100/80 dark:bg-stone-800/80 backdrop-blur-md px-3 py-1 rounded-lg">Locations</h3>
        </div>
        
        {stats.locStats.map(loc => (
          <Card key={loc.id} onClick={() => onLocationSelect(loc.id)} className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-orange-50">{loc.name}</h4>
              <p className="text-slate-500 dark:text-stone-400 text-sm">{loc.studentCount} Students</p>
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
    </motion.div>
  );
};

// 2. Student List View
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
}> = ({ location, students, payments, month, year, onBack, onSelectStudent, onAddStudent, onDeleteLocation }) => {
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPaymentStatus = (studentId: string) => {
    return payments.find(p => p.studentId === studentId && p.month === month && p.year === year);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="min-h-screen bg-transparent absolute top-0 w-full z-10"
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
        {/* Search Bar */}
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

        <div className="space-y-3">
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
    </motion.div>
  );
};

// 3. Student Detail / Payment View
const StudentDetail: React.FC<{
  student: Student;
  locationName: string;
  currentPayment?: Payment;
  allPayments: Payment[];
  month: number;
  year: number;
  onBack: () => void;
  onPayment: (amount: number) => void;
  onUndo: (paymentId: string) => void;
  onUpdateDefaultFee: (newFee: number) => void;
  onDeleteStudent: () => void;
}> = ({ student, locationName, currentPayment, allPayments, month, year, onBack, onPayment, onUndo, onUpdateDefaultFee, onDeleteStudent }) => {
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [feeAmount, setFeeAmount] = useState<string>(student.defaultFee?.toString() || '150');
  const [isEditingFee, setIsEditingFee] = useState(false);

  // Trigger confetti logic wrapper
  const handlePayment = () => {
    const amount = parseFloat(feeAmount);
    if (amount > 0) {
      onPayment(amount);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    }
  };

  const handleSaveFee = () => {
    const amount = parseFloat(feeAmount);
    if (amount > 0) {
      onUpdateDefaultFee(amount);
      setIsEditingFee(false);
    }
  };

  // Get history (last 6 months)
  const history = useMemo(() => {
    const hist = [];
    // Start from current month - 1
    let m = month;
    let y = year;
    
    for(let i=0; i<6; i++) {
        m--;
        if (m < 0) { m = 11; y--; }
        const p = allPayments.find(pay => pay.studentId === student.id && pay.month === m && pay.year === y);
        hist.push({ monthName: MONTHS[m], year: y, payment: p });
    }
    return hist;
  }, [allPayments, month, year, student.id]);

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="min-h-screen bg-transparent absolute top-0 w-full z-20"
    >
      <Header 
        title="Payment" 
        onBack={onBack} 
        rightAction={
          <button 
            onClick={onDeleteStudent} 
            className="p-2 -mr-2 text-white/80 hover:text-red-200 active:scale-95 transition-all"
            aria-label="Delete Student"
          >
            <Trash2 size={20} />
          </button>
        }
      />
      
      <div className="relative pt-6 px-4 pb-20">
        
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 dark:bg-orange-900/40 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-orange-200 mb-3 shadow-inner">
            {student.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-orange-50">{student.name}</h2>
          <p className="text-slate-600 dark:text-stone-400">{locationName}</p>
        </div>

        {/* Payment Card */}
        <Card className="mb-6 overflow-hidden border-0 shadow-lg relative">
          <div className={`absolute top-0 left-0 w-full h-2 ${currentPayment ? 'bg-emerald-500' : 'bg-orange-400'}`}></div>
          <div className="pt-4 text-center">
            <h3 className="text-lg font-medium text-slate-500 dark:text-stone-400 mb-1">{MONTHS[month]} {year}</h3>
            
            {currentPayment ? (
              <div className="py-6">
                 <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4"
                 >
                   <Check size={40} className="text-emerald-600 dark:text-emerald-400" />
                 </motion.div>
                 <h2 className="text-3xl font-bold text-slate-800 dark:text-orange-50 mb-1">Paid ₹{currentPayment.amount}</h2>
                 <p className="text-sm text-slate-500 dark:text-stone-400">
                   on {new Date(currentPayment.datePaid).toLocaleDateString()}
                 </p>
                 <button 
                  onClick={() => onUndo(currentPayment.id)}
                  className="mt-6 text-sm text-red-400 underline py-2"
                 >
                   Undo Payment
                 </button>
              </div>
            ) : (
              <div className="py-4">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-2xl font-bold text-slate-700 dark:text-stone-300">₹</span>
                  {isEditingFee ? (
                     <div className="flex flex-col items-center">
                       <input 
                        type="tel" 
                        value={feeAmount} 
                        onChange={(e) => setFeeAmount(e.target.value)}
                        autoFocus
                        className="text-4xl font-bold text-slate-800 dark:text-white w-32 text-center bg-transparent border-b-2 border-blue-500 dark:border-orange-500 focus:outline-none mb-2" 
                      />
                      <button onClick={handleSaveFee} className="text-xs bg-blue-100 dark:bg-orange-900/50 px-3 py-1 rounded-full text-blue-800 dark:text-orange-200">Save Default</button>
                     </div>
                  ) : (
                    <div className="flex items-center gap-2" onClick={() => setIsEditingFee(true)}>
                       <span className="text-5xl font-bold text-slate-800 dark:text-white border-b-2 border-transparent">{feeAmount}</span>
                       <Edit2 size={16} className="text-slate-400 dark:text-stone-500 opacity-50" />
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handlePayment}
                  className="w-full bg-blue-700 dark:bg-orange-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-blue-800 dark:hover:bg-orange-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon /> Mark as Paid
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* History */}
        <h3 className="font-bold text-slate-800 dark:text-orange-100 mb-3 ml-1">Recent History</h3>
        <div className="space-y-3">
          {history.map((h, idx) => (
             <div key={idx} className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between border border-blue-50 dark:border-stone-800">
               <div className="flex items-center gap-3">
                 {h.payment ? <Check size={18} className="text-emerald-500"/> : <Clock size={18} className="text-orange-400"/>}
                 <span className="font-medium text-slate-700 dark:text-stone-300">{h.monthName}</span>
               </div>
               <span className={`text-sm font-bold ${h.payment ? 'text-slate-400 dark:text-stone-500' : 'text-orange-400'}`}>
                 {h.payment ? `₹${h.payment.amount}` : 'Pending'}
               </span>
             </div>
          ))}
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccess(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-800 rounded-3xl p-8 text-center m-8 max-w-sm shadow-2xl cursor-default"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 1 }}
                className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={48} className="text-emerald-600 dark:text-emerald-400" strokeWidth={4} />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Received!</h2>
              <p className="text-slate-600 dark:text-stone-300">
                {student.name} is all set for {MONTHS[month]}.
              </p>
              <p className="text-xs text-slate-400 mt-4">(Tap anywhere to dismiss)</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 4. Simple Form Views (Add Location / Add Student)
const AddForm: React.FC<{
  title: string;
  onSave: (val1: string, val2?: string) => void;
  onBack: () => void;
  field1Label: string;
  field2Label?: string;
  field2Default?: string;
  field2Type?: 'text' | 'number';
}> = ({ title, onSave, onBack, field1Label, field2Label, field2Default = '', field2Type = 'text' }) => {
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState(field2Default);

  return (
    <motion.div 
      initial={{ y: '100%' }} 
      animate={{ y: 0 }} 
      exit={{ y: '100%' }}
      className="min-h-screen bg-transparent absolute top-0 w-full z-40 bg-blue-50 dark:bg-stone-950"
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
    </motion.div>
  );
};

// 5. Settings View
const SettingsView: React.FC<{
  data: AppData;
  onImport: (d: AppData) => void;
  onBack: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}> = ({ data, onImport, onBack, theme, onToggleTheme }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData(data));
    alert('Data copied to clipboard!');
  };

  const handleImport = () => {
    const parsed = importData(jsonInput);
    if (parsed) {
      onImport(parsed);
      alert('Data imported successfully!');
      onBack();
    } else {
      setError('Invalid JSON format.');
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }} 
      animate={{ y: 0 }} 
      exit={{ y: '100%' }}
      className="min-h-screen bg-blue-50 dark:bg-stone-950 absolute top-0 w-full z-30"
    >
      <Header title="Settings" onBack={onBack} />
      <div className="p-4 space-y-6">
        
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
            <Download className="text-slate-600 dark:text-stone-400" />
            <h3 className="font-bold">Export Backup</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-stone-300">Save your current data to a file or copy it to transfer to another device.</p>
          <button onClick={handleCopy} className="w-full bg-blue-100 dark:bg-stone-800 text-blue-800 dark:text-orange-100 py-3 rounded-lg font-bold hover:bg-blue-200 dark:hover:bg-stone-700">
            Copy to Clipboard
          </button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-slate-800 dark:text-white mb-2">
            <Upload className="text-slate-600 dark:text-stone-400" />
            <h3 className="font-bold">Import Backup</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-stone-300">Paste your backup JSON here to restore data.</p>
          <textarea 
            className="w-full h-32 p-3 text-xs font-mono bg-blue-100 dark:bg-stone-800 rounded-lg border border-blue-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-orange-500 text-slate-900 dark:text-stone-100"
            placeholder='Paste JSON data here...'
            value={jsonInput}
            onChange={(e) => { setJsonInput(e.target.value); setError(''); }}
          ></textarea>
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button onClick={handleImport} className="w-full bg-blue-800 dark:bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-blue-900">
            Restore Data
          </button>
        </Card>

        <div className="text-center text-xs text-slate-400 dark:text-stone-600 pt-8">
          <p>Yoga Fee Tracker v1.3</p>
          <p>Local Storage Mode</p>
        </div>
      </div>
    </motion.div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ locations: [], students: [], payments: [] });
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [loaded, setLoaded] = useState(false);
  
  // Navigation State
  const [viewState, setViewState] = useState<ViewState>({
    current: 'dashboard',
    history: []
  });

  // Date State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Load Data on Mount
  useEffect(() => {
    const loadedData = loadData();
    const loadedTheme = loadTheme();
    setData(loadedData);
    setTheme(loadedTheme);
    setLoaded(true);
  }, []);

  // Sync Theme to Document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (loaded) saveTheme(theme);
  }, [theme, loaded]);

  // Save Data on Change
  useEffect(() => {
    if (loaded) {
      saveData(data);
    }
  }, [data, loaded]);

  const navigateTo = (view: ViewState['current'], params: Partial<ViewState> = {}) => {
    setViewState(prev => ({
      ...prev,
      current: view,
      history: [...prev.history, prev.current],
      ...params
    }));
  };

  const goBack = () => {
    setViewState(prev => {
      const newHistory = [...prev.history];
      const lastView = newHistory.pop() || 'dashboard';
      return {
        ...prev,
        current: lastView,
        history: newHistory
      };
    });
  };

  // Actions
  const handlePayment = (amount: number) => {
    if (!viewState.selectedStudentId) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      studentId: viewState.selectedStudentId,
      month: currentMonth,
      year: currentYear,
      amount: amount,
      datePaid: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }));
  };

  const handleUndoPayment = (paymentId: string) => {
    setData(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== paymentId)
    }));
  };

  const handleUpdateStudentFee = (newFee: number) => {
    if (!viewState.selectedStudentId) return;
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.id === viewState.selectedStudentId 
          ? { ...s, defaultFee: newFee }
          : s
      )
    }));
  };

  const handleAddLocation = (name: string) => {
    const newLoc: Location = { id: crypto.randomUUID(), name };
    setData(prev => ({
      ...prev,
      locations: [...prev.locations, newLoc]
    }));
    goBack();
  };

  const handleAddStudent = (name: string, feeStr?: string) => {
    if (!viewState.selectedLocationId) return;
    const fee = feeStr ? parseFloat(feeStr) : 150;
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name,
      locationId: viewState.selectedLocationId,
      joinedDate: new Date().toISOString(),
      isActive: true,
      defaultFee: fee
    };
    setData(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
    goBack();
  };

  const handleDeleteLocation = () => {
    if (!viewState.selectedLocationId) return;
    if (window.confirm("Are you sure you want to delete this location? All associated students and their payment history will be permanently deleted.")) {
      const locId = viewState.selectedLocationId;
      setData(prev => {
         const studentsToDelete = prev.students.filter(s => s.locationId === locId);
         const studentIds = studentsToDelete.map(s => s.id);
         return {
           ...prev,
           locations: prev.locations.filter(l => l.id !== locId),
           students: prev.students.filter(s => s.locationId !== locId),
           payments: prev.payments.filter(p => !studentIds.includes(p.studentId))
         };
      });
      goBack();
    }
  };

  const handleDeleteStudent = () => {
    if (!viewState.selectedStudentId) return;
    if (window.confirm("Are you sure you want to delete this student and their payment history?")) {
      setData(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== viewState.selectedStudentId),
        payments: prev.payments.filter(p => p.studentId !== viewState.selectedStudentId)
      }));
      goBack();
    }
  };

  const handleImport = (newData: AppData) => {
    setData(newData);
  };

  // derived state helpers
  const selectedLocation = data.locations.find(l => l.id === viewState.selectedLocationId);
  const locationStudents = data.students.filter(s => s.locationId === viewState.selectedLocationId && s.isActive);
  const selectedStudent = data.students.find(s => s.id === viewState.selectedStudentId);
  const selectedStudentPayment = viewState.selectedStudentId 
    ? data.payments.find(p => p.studentId === viewState.selectedStudentId && p.month === currentMonth && p.year === currentYear)
    : undefined;

  if (!loaded) return null;

  return (
    <div className="max-w-md mx-auto relative overflow-hidden bg-blue-50 dark:bg-stone-950 bg-noise shadow-2xl min-h-screen transition-colors duration-500 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-stone-950 dark:to-orange-950">
      <AnimatePresence mode='wait'>
        {viewState.current === 'dashboard' && (
          <Dashboard 
            key="dashboard"
            data={data}
            month={currentMonth}
            year={currentYear}
            onMonthChange={(m) => {
              if (m === 0 && currentMonth === 11) setCurrentYear(y => y + 1);
              if (m === 11 && currentMonth === 0) setCurrentYear(y => y - 1);
              setCurrentMonth(m);
            }}
            onLocationSelect={(id) => navigateTo('location_list', { selectedLocationId: id })}
            onSettings={() => navigateTo('settings')}
            onAddLocation={() => navigateTo('add_location')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewState.current === 'location_list' && selectedLocation && (
          <StudentList 
            key="student_list"
            location={selectedLocation}
            students={locationStudents}
            payments={data.payments}
            month={currentMonth}
            year={currentYear}
            onBack={goBack}
            onSelectStudent={(id) => navigateTo('student_detail', { selectedStudentId: id })}
            onAddStudent={() => navigateTo('add_student')}
            onDeleteLocation={handleDeleteLocation}
          />
        )}

        {viewState.current === 'student_detail' && selectedStudent && (
          <StudentDetail 
            key="student_detail"
            student={selectedStudent}
            locationName={data.locations.find(l => l.id === selectedStudent.locationId)?.name || ''}
            currentPayment={selectedStudentPayment}
            allPayments={data.payments}
            month={currentMonth}
            year={currentYear}
            onBack={goBack}
            onPayment={handlePayment}
            onUndo={handleUndoPayment}
            onUpdateDefaultFee={handleUpdateStudentFee}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {viewState.current === 'add_location' && (
          <AddForm 
             key="add_location"
             title="Add Location"
             field1Label="Location Name"
             onSave={(name) => handleAddLocation(name)}
             onBack={goBack}
          />
        )}

        {viewState.current === 'add_student' && (
          <AddForm 
             key="add_student"
             title="Add Student"
             field1Label="Student Name"
             field2Label="Default Fee (₹)"
             field2Default="150"
             field2Type="number"
             onSave={(name, fee) => handleAddStudent(name, fee)}
             onBack={goBack}
          />
        )}

        {viewState.current === 'settings' && (
          <SettingsView 
            key="settings"
            data={data}
            onImport={handleImport}
            onBack={goBack}
            theme={theme}
            onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
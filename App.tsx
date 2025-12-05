import React, { useState, useEffect, useMemo, useRef } from 'react';
import './index.css';
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
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
  Info,
  FileDown,
  FileUp,
  Shield,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

import { AppData, Location, Student, Payment, ViewState } from './types';
import { 
  loadData, 
  saveData, 
  exportToFile, 
  importFromFile, 
  loadTheme, 
  saveTheme,
  checkPersistentStorage,
  requestPersistentStorage,
  hasPersistenceBeenRequested
} from './services/storage';
import { Header, Card, Fab } from './components/Layout';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- Custom Modal Components ---

// Confirm Modal for delete/destructive actions
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

// Toast notification component
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
  isVisible: boolean;
}> = ({ data, month, year, onMonthChange, onLocationSelect, onSettings, onAddLocation, isVisible }) => {
  
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
    <div className={`min-h-screen pb-24 ${isVisible ? 'animate-fade-in' : ''}`}>
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
           <h3 className="font-bold text-slate-800 dark:text-orange-50 text-lg shadow-sm bg-blue-100 dark:bg-stone-800 px-3 py-1 rounded-lg">Locations</h3>
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
    </div>
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

        <div className="space-y-3 overflow-y-auto max-h-[60vh]">
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
  onExitComplete?: () => void;
  isExiting?: boolean;
}> = ({ student, locationName, currentPayment, allPayments, month, year, onBack, onPayment, onUndo, onUpdateDefaultFee, onDeleteStudent, onExitComplete, isExiting }) => {
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [feeAmount, setFeeAmount] = useState<string>(student.defaultFee?.toString() || '150');
  const [isEditingFee, setIsEditingFee] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExiting && containerRef.current) {
      const handleAnimationEnd = () => onExitComplete?.();
      containerRef.current.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => containerRef.current?.removeEventListener('animationend', handleAnimationEnd);
    }
  }, [isExiting, onExitComplete]);

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
    <div 
      ref={containerRef}
      className={`min-h-screen bg-blue-50 dark:bg-stone-950 absolute top-0 w-full z-20 ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
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
                 <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                   <Check size={40} className="text-emerald-600 dark:text-emerald-400" />
                 </div>
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
             <div key={idx} className="bg-white dark:bg-stone-900 rounded-lg p-4 flex items-center justify-between border border-blue-50 dark:border-stone-800">
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
      {showSuccess && (
        <div 
          onClick={() => setShowSuccess(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 cursor-pointer animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-800 rounded-3xl p-8 text-center m-8 max-w-sm shadow-2xl cursor-default animate-scale-in"
          >
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-6 animate-success-bounce">
              <Check size={48} className="text-emerald-600 dark:text-emerald-400" strokeWidth={4} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Received!</h2>
            <p className="text-slate-600 dark:text-stone-300">
              {student.name} is all set for {MONTHS[month]}.
            </p>
            <p className="text-xs text-slate-400 mt-4">(Tap anywhere to dismiss)</p>
          </div>
        </div>
      )}
    </div>
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

// 5. Settings View
const SettingsView: React.FC<{
  data: AppData;
  onImport: (d: AppData) => void;
  onBack: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isPersistent: boolean;
  onRequestPersistence: () => void;
  onExitComplete?: () => void;
  isExiting?: boolean;
}> = ({ data, onImport, onBack, theme, onToggleTheme, onShowToast, isPersistent, onRequestPersistence, onExitComplete, isExiting }) => {
  const [error, setError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExiting && containerRef.current) {
      const handleAnimationEnd = () => onExitComplete?.();
      containerRef.current.addEventListener('animationend', handleAnimationEnd, { once: true });
      return () => containerRef.current?.removeEventListener('animationend', handleAnimationEnd);
    }
  }, [isExiting, onExitComplete]);

  const handleExportFile = () => {
    exportToFile(data);
    onShowToast('Backup file downloaded!', 'success');
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
    
    // Reset file input
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
      <div className="flex-1 overflow-y-auto overscroll-contain">
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

          {/* Storage Status Card */}
          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-slate-800 dark:text-white mb-2">
              <HardDrive className="text-slate-600 dark:text-stone-400" />
              <h3 className="font-bold">Data Storage</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPersistent ? (
                  <ShieldCheck size={20} className="text-green-500" />
                ) : (
                  <Shield size={20} className="text-orange-500" />
                )}
                <span className="text-sm text-slate-700 dark:text-stone-300">
                  {isPersistent ? 'Persistent storage enabled' : 'Storage may be cleared by browser'}
                </span>
              </div>
            </div>
            
            {!isPersistent && (
              <>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Enable persistent storage to prevent your data from being automatically cleared by the browser when storage is low.
                </p>
                <button 
                  onClick={onRequestPersistence}
                  className="w-full bg-green-600 dark:bg-green-700 text-white py-3 rounded-lg font-bold hover:bg-green-700 dark:hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Enable Persistent Storage
                </button>
              </>
            )}
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
            <p>Yoga Fee Tracker v1.4</p>
            <p className="flex items-center justify-center gap-1">
              {isPersistent ? (
                <><ShieldCheck size={12} className="text-green-500" /> Persistent Storage</>
              ) : (
                <><HardDrive size={12} /> IndexedDB Storage</>
              )}
            </p>
            <p>Made with ❤️ by ShambaC</p>
          </div>
        </div>
      </div>
    </div>
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

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, message: '', type: 'success' });

  // Persistent Storage State
  const [isPersistent, setIsPersistent] = useState(false);

  // Date State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Load Data on Mount
  useEffect(() => {
    const initApp = async () => {
      const loadedData = await loadData();
      const loadedTheme = loadTheme();
      setData(loadedData);
      setTheme(loadedTheme);
      
      // Check persistent storage status
      const persisted = await checkPersistentStorage();
      setIsPersistent(persisted);
      
      // Auto-request persistence if not already requested and not persisted
      if (!persisted && !hasPersistenceBeenRequested()) {
        // Small delay to let the app render first
        setTimeout(async () => {
          const granted = await requestPersistentStorage();
          setIsPersistent(granted);
        }, 1000);
      }
      
      setLoaded(true);
    };
    initApp();
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
      saveData(data).catch(console.error);
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
    setConfirmModal({
      isOpen: true,
      title: 'Delete Location',
      message: 'Are you sure you want to delete this location? All associated students and their payment history will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => {
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
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        goBack();
      }
    });
  };

  const handleDeleteStudent = () => {
    if (!viewState.selectedStudentId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Remove Student',
      message: 'Are you sure you want to remove this student? They will be marked as inactive and won\'t appear in future months, but their payment history will be preserved.',
      confirmText: 'Remove',
      variant: 'warning',
      onConfirm: () => {
        setData(prev => ({
          ...prev,
          students: prev.students.map(s => 
            s.id === viewState.selectedStudentId 
              ? { ...s, isActive: false }
              : s
          )
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        goBack();
      }
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isOpen: true, message, type });
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
    <div className="max-w-md mx-auto relative overflow-hidden bg-blue-50 dark:bg-stone-950 shadow-2xl min-h-screen transition-colors duration-500 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-stone-950 dark:to-orange-950">
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
          isVisible={viewState.current === 'dashboard'}
        />
      )}

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
          onShowToast={showToast}
          isPersistent={isPersistent}
          onRequestPersistence={async () => {
            const granted = await requestPersistentStorage();
            setIsPersistent(granted);
            if (granted) {
              showToast('Persistent storage enabled!', 'success');
            } else {
              showToast('Browser denied persistent storage request', 'error');
            }
          }}
        />
      )}

      {/* Global Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        variant={confirmModal.variant}
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
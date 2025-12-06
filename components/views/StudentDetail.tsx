import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import { Student, Payment } from '../../types';
import { Header, Card } from '../Layout';
import CheckCircleIcon from '../icons/CheckCircleIcon';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

  const history = useMemo(() => {
    const hist: { monthName: string; year: number; payment?: Payment | undefined }[] = [];
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
      <div className="relative pt-6 px-4 pb-20 overflow-y-scroll hide-scrollbar max-h-[80vh]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 dark:bg-orange-900/40 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-orange-200 mb-3 shadow-inner">
            {student.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-orange-50">{student.name}</h2>
          <p className="text-slate-600 dark:text-stone-400">{locationName}</p>
        </div>

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

export default StudentDetail;

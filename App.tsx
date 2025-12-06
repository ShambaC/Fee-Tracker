import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './index.css';
import { App as CapacitorApp } from '@capacitor/app';

import { AppData, Location, Student, Payment, ViewState } from './types';
import { loadData, saveData, loadTheme, saveTheme } from './services/storage';
import { Header, Card, Fab } from './components/Layout';
import ConfirmModal from './components/modals/ConfirmModal';
import Toast from './components/modals/Toast';
import Dashboard from './components/views/Dashboard';
import StudentList from './components/views/StudentList';
import StudentDetail from './components/views/StudentDetail';
import AddForm from './components/forms/AddForm';
import AddLocationForm from './components/forms/AddLocationForm';
import SettingsView from './components/views/SettingsView';

// NOTE: Component-specific constants moved into their respective files



// NOTE: View components and helpers are moved to individual files under /components


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

  // Date State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', ({canGoBack}) => {
      if(!canGoBack){
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backButtonListener.then(handle => handle.remove());
    };
  }, []);

  // Load Data on Mount
  useEffect(() => {
    const initApp = async () => {
      const loadedData = await loadData();
      const loadedTheme = await loadTheme();
      setData(loadedData);
      setTheme(loadedTheme);
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
    if (loaded) {
      saveTheme(theme).catch(console.error);
    }
  }, [theme, loaded]);

  // Save Data on Change
  useEffect(() => {
    if (loaded) {
      saveData(data).catch(console.error);
    }
  }, [data, loaded]);

  // goBack function using useCallback so it can be used in useEffect
  const goBack = useCallback(() => {
    setViewState(prev => {
      // If already at dashboard, don't do anything
      if (prev.current === 'dashboard' && prev.history.length === 0) {
        return prev;
      }
      const newHistory = [...prev.history];
      const lastView = newHistory.pop() || 'dashboard';
      return {
        ...prev,
        current: lastView,
        history: newHistory
      };
    });
  }, []);

  // Handle browser/OS back button
  useEffect(() => {
    // Push initial state when app loads
    if (loaded && window.history.state === null) {
      window.history.replaceState({ view: 'dashboard' }, '');
    }
  }, [loaded]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser back behavior by going back in our app navigation
      if (viewState.current !== 'dashboard') {
        // Push a new state to prevent actually leaving the page
        window.history.pushState({ view: viewState.current }, '');
        goBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewState.current, goBack]);

  const navigateTo = (view: ViewState['current'], params: Partial<ViewState> = {}) => {
    // Push state to browser history for back button support
    window.history.pushState({ view }, '');
    
    setViewState(prev => ({
      ...prev,
      current: view,
      history: [...prev.history, prev.current],
      ...params
    }));
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

  const handleAddLocation = (name: string, color?: string) => {
    const newLoc: Location = { id: crypto.randomUUID(), name, color };
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
        <AddLocationForm 
           key="add_location"
           onSave={(name, color) => handleAddLocation(name, color)}
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
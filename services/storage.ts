import { AppData, Location, Student, Payment } from '../types';

const STORAGE_KEY = 'yoga_tracker_data_v2';
const THEME_KEY = 'yoga_tracker_theme';

const SEED_DATA: AppData = {
  locations: [
    { id: 'loc1', name: 'Studio A' },
    { id: 'loc2', name: 'Community Hall' },
    { id: 'loc3', name: 'Park View' },
  ],
  students: [
    { id: 'stu1', name: 'Alice Smith', locationId: 'loc1', joinedDate: '2024-01-15', isActive: true, defaultFee: 150 },
    { id: 'stu2', name: 'Bob Johnson', locationId: 'loc1', joinedDate: '2024-02-01', isActive: true, defaultFee: 150 },
    { id: 'stu3', name: 'Charlie Brown', locationId: 'loc1', joinedDate: '2024-03-10', isActive: true, defaultFee: 150 },
    { id: 'stu4', name: 'Diana Prince', locationId: 'loc2', joinedDate: '2024-01-05', isActive: true, defaultFee: 150 },
    { id: 'stu5', name: 'Evan Wright', locationId: 'loc2', joinedDate: '2024-05-20', isActive: true, defaultFee: 150 },
    { id: 'stu6', name: 'Fiona Green', locationId: 'loc3', joinedDate: '2024-06-15', isActive: true, defaultFee: 200 },
  ],
  payments: [
    // Pre-populate some payments for the current/previous month
    { id: 'pay1', studentId: 'stu1', month: 9, year: 2025, amount: 150, datePaid: new Date().toISOString() }, // October (index 9)
    { id: 'pay2', studentId: 'stu2', month: 9, year: 2025, amount: 150, datePaid: new Date().toISOString() },
    { id: 'pay3', studentId: 'stu4', month: 8, year: 2025, amount: 150, datePaid: new Date().toISOString() },
  ]
};

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load data", e);
  }
  return SEED_DATA;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const loadTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) {}
  return 'light';
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}
};

export const exportData = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): AppData | null => {
  try {
    const parsed = JSON.parse(jsonString);
    // Basic validation
    if (Array.isArray(parsed.locations) && Array.isArray(parsed.students)) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};
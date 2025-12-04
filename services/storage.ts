import { AppData } from '../types';

const DB_NAME = 'yoga_tracker_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';
const DATA_KEY = 'main_data';
const THEME_KEY = 'theme';
const PERSISTENCE_KEY = 'yoga_tracker_persistence_requested';

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
    { id: 'pay1', studentId: 'stu1', month: 11, year: 2025, amount: 150, datePaid: new Date().toISOString() },
    { id: 'pay2', studentId: 'stu2', month: 11, year: 2025, amount: 150, datePaid: new Date().toISOString() },
    { id: 'pay3', studentId: 'stu4', month: 10, year: 2025, amount: 150, datePaid: new Date().toISOString() },
  ]
};

// --- Persistent Storage API ---

// Check if persistent storage is already granted
export const checkPersistentStorage = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persisted) {
    return await navigator.storage.persisted();
  }
  return false;
};

// Request persistent storage permission from the browser
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    if (isPersisted) {
      console.log('Storage is now persistent!');
      localStorage.setItem(PERSISTENCE_KEY, 'granted');
    } else {
      console.log('Persistent storage request was denied.');
    }
    return isPersisted;
  }
  console.log('Persistent Storage API not supported');
  return false;
};

// Check if we've already asked for persistence (to avoid repeated prompts)
export const hasPersistenceBeenRequested = (): boolean => {
  return localStorage.getItem(PERSISTENCE_KEY) !== null;
};

// Get storage estimate (useful for debugging/display)
export const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return null;
};

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Get data from IndexedDB
const getFromDB = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => {
        console.error('Failed to get from IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };
    });
  } catch (e) {
    console.error('IndexedDB get error:', e);
    return null;
  }
};

// Save data to IndexedDB
const saveToDB = async <T>(key: string, value: T): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onerror = () => {
        console.error('Failed to save to IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (e) {
    console.error('IndexedDB save error:', e);
  }
};

// Migrate data from localStorage to IndexedDB (one-time migration)
const migrateFromLocalStorage = async (): Promise<AppData | null> => {
  try {
    const oldKey = 'yoga_tracker_data_v2';
    const saved = localStorage.getItem(oldKey);
    if (saved) {
      const data = JSON.parse(saved) as AppData;
      // Save to IndexedDB
      await saveToDB(DATA_KEY, data);
      // Clear old localStorage data
      localStorage.removeItem(oldKey);
      console.log('Successfully migrated data from localStorage to IndexedDB');
      return data;
    }
  } catch (e) {
    console.error('Migration from localStorage failed:', e);
  }
  return null;
};

// Public API - Load data
export const loadData = async (): Promise<AppData> => {
  try {
    // First try IndexedDB
    let data = await getFromDB<AppData>(DATA_KEY);
    
    if (data) {
      return data;
    }

    // Try to migrate from localStorage
    data = await migrateFromLocalStorage();
    if (data) {
      return data;
    }

    // Return seed data for new users
    return SEED_DATA;
  } catch (e) {
    console.error('Failed to load data:', e);
    return SEED_DATA;
  }
};

// Public API - Save data
export const saveData = async (data: AppData): Promise<void> => {
  await saveToDB(DATA_KEY, data);
};

// Theme functions (still use localStorage for simplicity - theme is not critical data)
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

// Export data to JSON string (for file export)
export const exportData = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};

// Import/validate data from JSON string
export const importData = (jsonString: string): AppData | null => {
  try {
    const parsed = JSON.parse(jsonString);
    // Basic validation
    if (Array.isArray(parsed.locations) && Array.isArray(parsed.students) && Array.isArray(parsed.payments)) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// File-based export - downloads a JSON file
export const exportToFile = (data: AppData): void => {
  const jsonString = exportData(data);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const filename = `yoga-fee-tracker-backup-${dateStr}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// File-based import - reads a JSON file
export const importFromFile = (file: File): Promise<AppData | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = importData(content);
        resolve(data);
      } catch (err) {
        console.error('Failed to parse file:', err);
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      console.error('Failed to read file:', reader.error);
      resolve(null);
    };
    
    reader.readAsText(file);
  });
};
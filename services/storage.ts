import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { AppData } from '../types';

const DATA_KEY = 'yoga_tracker_data';
const THEME_KEY = 'yoga_tracker_theme';

const SEED_DATA: AppData = {
  locations: [
    { id: 'loc1', name: 'Studio A', color: '#FF5733' },
    { id: 'loc2', name: 'Community Hall', color: '#33C1FF' },
    { id: 'loc3', name: 'Park View', color: '#33FF57' },
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

// --- Migration from old storage methods ---

// Migrate from localStorage (old v2 key)
const migrateFromLocalStorage = async (): Promise<AppData | null> => {
  try {
    const oldKey = 'yoga_tracker_data_v2';
    const saved = localStorage.getItem(oldKey);
    if (saved) {
      const data = JSON.parse(saved) as AppData;
      // Save to Capacitor Preferences
      await saveData(data);
      // Clear old localStorage data
      localStorage.removeItem(oldKey);
      console.log('Successfully migrated data from localStorage to Capacitor Preferences');
      return data;
    }
  } catch (e) {
    console.error('Migration from localStorage failed:', e);
  }
  return null;
};

// Migrate from IndexedDB (previous implementation)
const migrateFromIndexedDB = async (): Promise<AppData | null> => {
  try {
    const DB_NAME = 'yoga_tracker_db';
    const STORE_NAME = 'app_data';
    const IDB_DATA_KEY = 'main_data';

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        resolve(null);
      };

      request.onsuccess = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.close();
            resolve(null);
            return;
          }

          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const getRequest = store.get(IDB_DATA_KEY);

          getRequest.onsuccess = async () => {
            const data = getRequest.result as AppData | undefined;
            db.close();

            if (data) {
              // Save to Capacitor Preferences
              await saveData(data);
              // Delete the IndexedDB database
              indexedDB.deleteDatabase(DB_NAME);
              console.log('Successfully migrated data from IndexedDB to Capacitor Preferences');
              resolve(data);
            } else {
              resolve(null);
            }
          };

          getRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch (e) {
          resolve(null);
        }
      };

      request.onupgradeneeded = () => {
        // Database doesn't exist or is empty
        request.transaction?.abort();
      };
    });
  } catch (e) {
    console.error('Migration from IndexedDB failed:', e);
    return null;
  }
};

// --- Public API ---

// Load data from Capacitor Preferences
export const loadData = async (): Promise<AppData> => {
  try {
    const { value } = await Preferences.get({ key: DATA_KEY });
    
    if (value) {
      return JSON.parse(value) as AppData;
    }

    // Try to migrate from IndexedDB (previous implementation)
    const indexedDBData = await migrateFromIndexedDB();
    if (indexedDBData) {
      return indexedDBData;
    }

    // Try to migrate from localStorage (even older implementation)
    const localStorageData = await migrateFromLocalStorage();
    if (localStorageData) {
      return localStorageData;
    }

    // Return seed data for new users
    return SEED_DATA;
  } catch (e) {
    console.error('Failed to load data:', e);
    return SEED_DATA;
  }
};

// Save data to Capacitor Preferences
export const saveData = async (data: AppData): Promise<void> => {
  try {
    await Preferences.set({
      key: DATA_KEY,
      value: JSON.stringify(data)
    });
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

// Load theme preference
export const loadTheme = async (): Promise<'light' | 'dark'> => {
  try {
    const { value } = await Preferences.get({ key: THEME_KEY });
    if (value === 'dark' || value === 'light') {
      return value;
    }
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return 'light';
};

// Save theme preference
export const saveTheme = async (theme: 'light' | 'dark'): Promise<void> => {
  try {
    await Preferences.set({
      key: THEME_KEY,
      value: theme
    });
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
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

// Generate backup filename with date
const getBackupFilename = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `yoga-fee-tracker-backup-${dateStr}.json`;
};

// Check if running on native platform
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// File-based export using Capacitor Filesystem (native) or download (web)
export const exportToFile = async (data: AppData): Promise<{ success: boolean; path?: string; error?: string }> => {
  const jsonString = exportData(data);
  const filename = getBackupFilename();

  if (isNativePlatform()) {
    try {
      // On native, save to Documents directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonString,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      return { 
        success: true, 
        path: result.uri 
      };
    } catch (e) {
      console.error('Failed to export file:', e);
      return { 
        success: false, 
        error: e instanceof Error ? e.message : 'Failed to save file' 
      };
    }
  } else {
    // On web, use download method
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, path: filename };
    } catch (e) {
      console.error('Failed to download file:', e);
      return { 
        success: false, 
        error: e instanceof Error ? e.message : 'Failed to download file' 
      };
    }
  }
};

// File-based import using file picker (works on both web and native via input element)
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

// Read backup file from filesystem (native only)
export const readBackupFromPath = async (path: string): Promise<AppData | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const result = await Filesystem.readFile({
      path: path,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    if (typeof result.data === 'string') {
      return importData(result.data);
    }
    return null;
  } catch (e) {
    console.error('Failed to read backup file:', e);
    return null;
  }
};

// List available backup files (native only)
export const listBackupFiles = async (): Promise<string[]> => {
  if (!isNativePlatform()) {
    return [];
  }

  try {
    const result = await Filesystem.readdir({
      path: '',
      directory: Directory.Documents
    });

    return result.files
      .filter(file => file.name.startsWith('yoga-fee-tracker-backup-') && file.name.endsWith('.json'))
      .map(file => file.name)
      .sort()
      .reverse(); // Most recent first
  } catch (e) {
    console.error('Failed to list backup files:', e);
    return [];
  }
};

// Delete a backup file (native only)
export const deleteBackupFile = async (filename: string): Promise<boolean> => {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Documents
    });
    return true;
  } catch (e) {
    console.error('Failed to delete backup file:', e);
    return false;
  }
};
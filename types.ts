export interface Location {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  locationId: string;
  joinedDate: string; // ISO Date string
  isActive: boolean;
  defaultFee?: number; // Added: Fee amount for this student
}

export interface Payment {
  id: string;
  studentId: string;
  month: number; // 0-11 (Jan-Dec)
  year: number;  // e.g. 2025
  amount: number;
  datePaid: string; // ISO Date string
}

export interface AppData {
  locations: Location[];
  students: Student[];
  payments: Payment[];
}

// Navigation Types
export type ViewName = 'dashboard' | 'location_list' | 'student_detail' | 'settings' | 'add_location' | 'add_student';

export interface ViewState {
  current: ViewName;
  selectedLocationId?: string;
  selectedStudentId?: string;
  history: ViewName[]; // Simple history stack for back navigation
}
import { ReservationStatus, VIEWS } from './constants';

export interface OpeningHours {
  open: string; // "HH:MM" format
  close: string; // "HH:MM" format
}

export interface Settings {
  turnoverMinutes: number;
  openingHours: { [day: string]: OpeningHours }; // day: "monday", "tuesday", etc.
  timezone: string;
  overallCapacity?: number;
  noShowGraceMinutes?: number;
}

export interface SpecialOpeningHour {
    date: string; // "YYYY-MM-DD"
    isOpen: boolean;
    openTime: string | null; // "HH:MM"
    closeTime: string | null; // "HH:MM"
}

export interface Floor {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string;
  floorId: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  sectionId: string;
  isReady: boolean;
}

export interface Reservation {
  id: string;
  customerName: string;
  contact: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  covers: number;
  tableId: string | null;
  sectionId: string;
  status: ReservationStatus;
  notes: string;
  createdAt: string; // ISO string
  checkAmount?: number | null; // Added for financial tracking
  // FIX: Add optional properties to match the data shape from apiService.getReservations
  tableName?: string;
  sectionName?: string;
}

export type View = typeof VIEWS[keyof typeof VIEWS];

// Types for creating new layout items
export type NewFloor = Omit<Floor, 'id'>;
export type NewSection = Omit<Section, 'id'>;
// FIX: The Omit utility type takes two arguments. The second argument should be a union of keys to exclude.
export type NewTable = Omit<Table, 'id' | 'isReady'>;
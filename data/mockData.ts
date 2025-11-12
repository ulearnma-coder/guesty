
import type { Floor, Section, Table, Reservation, Settings } from '../types';
import { ReservationStatus } from '../constants';

// Default settings for the restaurant
export let mockSettings: Settings = {
  turnoverMinutes: 90,
  openingHours: {
    monday: { open: '17:00', close: '22:00' },
    tuesday: { open: '17:00', close: '22:00' },
    wednesday: { open: '17:00', close: '22:00' },
    thursday: { open: '17:00', close: '22:00' },
    friday: { open: '17:00', close: '23:00' },
    saturday: { open: '12:00', close: '23:00' },
    sunday: { open: '12:00', close: '21:00' },
  },
  timezone: 'America/New_York',
};

// Restaurant layout data
export let mockFloors: Floor[] = [
  { id: 'floor1', name: 'Main Floor' },
];

export let mockSections: Section[] = [
  { id: 'sec1', name: 'Dining Room', floorId: 'floor1' },
  { id: 'sec2', name: 'Patio', floorId: 'floor1' },
];

export let mockTables: Table[] = [
  // FIX: Added missing 'isReady' property to conform to Table type.
  { id: 't1', name: '1', capacity: 2, sectionId: 'sec1', isReady: true },
  // FIX: Added missing 'isReady' property to conform to Table type.
  { id: 't2', name: '2', capacity: 4, sectionId: 'sec1', isReady: true },
  // FIX: Added missing 'isReady' property to conform to Table type.
  { id: 't3', name: '3', capacity: 4, sectionId: 'sec1', isReady: true },
  // FIX: Added missing 'isReady' property to conform to Table type.
  { id: 't4', name: '4', capacity: 6, sectionId: 'sec1', isReady: true },
  // FIX: Added missing 'isReady' property to conform to Table type.
  { id: 't10', name: '10', capacity: 4, sectionId: 'sec2', isReady: true },
  // FIX: Added missing 'isReady' property to conform to Table type.
  { id: 't11', name: '11', capacity: 2, sectionId: 'sec2', isReady: true },
];

// Sample reservations for today
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;

export let mockReservations: Reservation[] = [
  {
    id: 'res1',
    customerName: 'Alice Johnson',
    contact: '555-0101',
    date: todayStr,
    time: '18:00',
    covers: 2,
    tableId: 't1',
    sectionId: 'sec1',
    status: ReservationStatus.CONFIRMED,
    notes: 'Window seat requested.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res2',
    customerName: 'Bob Williams',
    contact: '555-0102',
    date: todayStr,
    time: '19:30',
    covers: 4,
    tableId: 't2',
    sectionId: 'sec1',
    status: ReservationStatus.CONFIRMED,
    notes: 'Celebrating an anniversary.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res3',
    customerName: 'Charlie Brown',
    contact: '555-0103',
    date: todayStr,
    time: '20:00',
    covers: 3,
    tableId: 't3',
    sectionId: 'sec1',
    status: ReservationStatus.PENDING,
    notes: 'Needs high chair.',
    createdAt: new Date().toISOString(),
  },
   {
    id: 'res4',
    customerName: 'Diana Prince',
    contact: '555-0104',
    date: todayStr,
    time: '17:30',
    covers: 2,
    tableId: 't11',
    sectionId: 'sec2',
    status: ReservationStatus.PAID,
    notes: '',
    createdAt: new Date().toISOString(),
  },
];
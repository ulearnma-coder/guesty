import { mockSettings, mockFloors, mockSections, mockTables, mockReservations } from '../data/mockData';
import type { Settings, Reservation, Table, Section, Floor } from '../types';

// Simulate network latency
const API_LATENCY = 500;

const simulateApi = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), API_LATENCY);
    });
};

// --- Settings ---
export const getSettings = (): Promise<Settings> => {
    return simulateApi(mockSettings);
};

export const updateSettings = (newSettings: Settings): Promise<Settings> => {
    // FIX: Cannot assign to 'mockSettings' because it is an import.
    // Mutate the imported object directly using Object.assign() instead of reassigning it.
    Object.assign(mockSettings, newSettings);
    return simulateApi(mockSettings);
};

// --- Layout ---
export const getFloors = (): Promise<Floor[]> => simulateApi(mockFloors);
export const getSections = (): Promise<Section[]> => simulateApi(mockSections);
export const getTables = (): Promise<Table[]> => simulateApi(mockTables);

// --- Reservations ---
export const getReservationsByDate = (date: string): Promise<Reservation[]> => {
    const filtered = mockReservations.filter(r => r.date === date);
    return simulateApi(filtered);
};

export const createReservation = (newReservationData: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> => {
    const newReservation: Reservation = {
        ...newReservationData,
        id: `res${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    mockReservations.push(newReservation);
    return simulateApi(newReservation);
};

export const updateReservation = (updatedReservation: Reservation): Promise<Reservation> => {
    const index = mockReservations.findIndex(r => r.id === updatedReservation.id);
    if (index !== -1) {
        mockReservations[index] = updatedReservation;
        return simulateApi(updatedReservation);
    }
    return Promise.reject(new Error("Reservation not found"));
};

export const deleteReservation = (reservationId: string): Promise<{ id: string }> => {
    const index = mockReservations.findIndex(r => r.id === reservationId);
    if (index !== -1) {
        mockReservations.splice(index, 1);
        return simulateApi({ id: reservationId });
    }
    return Promise.reject(new Error("Reservation not found"));
};
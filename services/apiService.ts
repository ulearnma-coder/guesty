import { supabase } from './supabaseClient';
import type { Settings, Reservation, Table, Section, Floor, NewFloor, NewSection, NewTable, SpecialOpeningHour } from '../types';

// This file provides a layer of abstraction for all interactions with the Supabase database.
// Each function corresponds to a specific data operation (e.g., fetching settings, creating a reservation).

// --- Settings ---
const SETTINGS_COLUMNS = '"turnoverMinutes", "openingHours", timezone, "overallCapacity", "noShowGraceMinutes"';

export const getSettings = async (): Promise<Settings> => {
    const { data, error } = await supabase
        .from('settings')
        .select(SETTINGS_COLUMNS)
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching settings:", error.message);
        throw error;
    }
    return data;
};

export const updateSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
    const { data, error } = await supabase
        .from('settings')
        .update(newSettings)
        .eq('id', 1)
        .select(SETTINGS_COLUMNS)
        .single();

    if (error) {
        console.error("Error updating settings:", error.message);
        throw error;
    }
    return data;
};

// --- Special Opening Hours ---
export const getSpecialOpeningHours = async (): Promise<SpecialOpeningHour[]> => {
    const { data, error } = await supabase.from('special_opening_hours').select('*');
    if (error) {
        console.error("Error fetching special opening hours:", error.message);
        throw error;
    }
    return data;
};

export const upsertSpecialOpeningHour = async (hour: SpecialOpeningHour): Promise<SpecialOpeningHour> => {
    const { data, error } = await supabase
        .from('special_opening_hours')
        .upsert(hour)
        .select()
        .single();
    if (error) {
        console.error("Error upserting special opening hour:", error.message);
        throw error;
    }
    return data;
};

export const deleteSpecialOpeningHour = async (date: string): Promise<{ date: string }> => {
    const { error } = await supabase.from('special_opening_hours').delete().eq('date', date);
    if (error) {
        console.error("Error deleting special opening hour:", error.message);
        throw error;
    }
    return { date };
};


// --- Layout ---
export const getFloors = async (): Promise<Floor[]> => {
    const { data, error } = await supabase.from('floors').select('*');
    if (error) throw error;
    return data;
};
export const getSections = async (): Promise<Section[]> => {
    const { data, error } = await supabase.from('sections').select('*');
    if (error) throw error;
    return data;
};
export const getTables = async (): Promise<Table[]> => {
    const { data, error } = await supabase.from('tables').select('*');
    if (error) throw error;
    return data;
};

// --- Layout CRUD Operations ---
// Floors
export const createFloor = async (floor: NewFloor) => {
    const { data, error } = await supabase.from('floors').insert(floor).select().single();
    if (error) throw error;
    return data;
};
export const updateFloor = async (id: string, updates: Partial<NewFloor>) => {
    const { data, error } = await supabase.from('floors').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteFloor = async (id: string) => {
    const { error } = await supabase.from('floors').delete().eq('id', id);
    if (error) throw error;
    return { id };
};

// Sections
export const createSection = async (section: NewSection) => {
    const { data, error } = await supabase.from('sections').insert(section).select().single();
    if (error) throw error;
    return data;
};
export const updateSection = async (id: string, updates: Partial<NewSection>) => {
    const { data, error } = await supabase.from('sections').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteSection = async (id: string) => {
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) throw error;
    return { id };
};

// Tables
export const createTable = async (table: NewTable) => {
    const { data, error } = await supabase.from('tables').insert(table).select().single();
    if (error) throw error;
    return data;
};
export const updateTable = async (id: string, updates: Partial<NewTable>) => {
    const { data, error } = await supabase.from('tables').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const updateTableReadyStatus = async (id: string, isReady: boolean): Promise<Table> => {
    const { data, error } = await supabase
        .from('tables')
        .update({ 'isReady': isReady })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};
export const deleteTable = async (id: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) throw error;
    return { id };
};


// --- Reservations ---

/**
 * Fetches reservations based on a filter object.
 * @param filters - An object with filters, e.g., { date: 'YYYY-MM-DD', status: 'CONFIRMED' }
 * @returns A promise that resolves to an array of reservations.
 */
export const getReservations = async (filters: { date?: string; status?: string }): Promise<Reservation[]> => {
    let query = supabase.from('reservations').select('*, tables(name), sections(name)');

    if (filters.date) {
        query = query.eq('date', filters.date);
    }

    if (filters.status && filters.status.toUpperCase() !== 'ALL') {
        query = query.eq('status', filters.status);
    }
    
    // Order by time by default
    query = query.order('time', { ascending: true });

    const { data, error } = await query;
        
    if (error) {
        console.error("Error fetching reservations:", error.message);
        throw error;
    }
    // The data from Supabase needs to be reshaped slightly if joins are used
    return data.map((r: any) => ({
        ...r,
        tableName: r.tables?.name || 'N/A',
        sectionName: r.sections?.name || 'N/A',
    }));
};


export const createReservation = async (newReservationData: Omit<Reservation, 'id' | 'createdAt' | 'checkAmount'>): Promise<Reservation> => {
    const { data, error } = await supabase
        .from('reservations')
        .insert([newReservationData])
        .select()
        .single();

    if (error) {
        console.error("Error creating reservation:", error.message);
        throw error;
    }
    return data;
};

export const updateReservation = async (reservationId: string, updateData: Partial<Reservation>): Promise<Reservation> => {
    const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select()
        .single();
        
    if (error) {
        console.error("Error updating reservation:", error.message);
        throw error;
    }
    return data;
};

export const deleteReservation = async (reservationId: string): Promise<{ id: string }> => {
    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

    if (error) {
        console.error("Error deleting reservation:", error.message);
        throw error;
    }
    return { id: reservationId };
};

// --- Financials ---
export const getFinancialReport = async ({ startDate, endDate }: { startDate: string, endDate: string }): Promise<Reservation[]> => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*') // Get all fields for the detailed list
        .eq('status', 'PAID')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('"checkAmount"', 'is', null); // Only include reservations with a check amount

    if (error) {
        console.error("Error fetching financial report:", error.message);
        throw error;
    }
    return data || [];
};
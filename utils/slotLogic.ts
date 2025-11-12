import type { Reservation, Settings, Table, SpecialOpeningHour } from '../types';
import { getDayOfWeek } from './time';

/**
 * This file contains the core business logic for calculating available time slots.
 */

interface TimeSlot {
    time: string; // "HH:MM"
    availableTables: Table[];
}

/**
 * Calculates available reservation slots for a given date, party size, and restaurant settings.
 * It now considers special opening hours for specific dates.
 *
 * @param date - The date for which to calculate availability.
 * @param covers - The number of guests (party size).
 * @param settings - The restaurant's settings (opening hours, turnover).
 * @param reservations - An array of existing reservations for that day.
 * @param tables - An array of all tables in the restaurant.
 * @param specialOpeningHours - An array of date-specific overrides for opening hours.
 * @returns An array of available time slots.
 */
export const calculateAvailableSlots = (
    date: Date,
    covers: number,
    settings: Settings,
    reservations: Reservation[],
    tables: Table[],
    specialOpeningHours: SpecialOpeningHour[]
): TimeSlot[] => {
    const availableSlots: TimeSlot[] = [];
    const dateString = date.toISOString().split('T')[0];
    
    // Check for a special opening hour for the selected date
    const specialHour = specialOpeningHours.find(h => h.date === dateString);

    let effectiveOpeningHours;
    if (specialHour) {
        if (!specialHour.isOpen || !specialHour.openTime || !specialHour.closeTime) {
            return []; // Restaurant is closed on this special day
        }
        effectiveOpeningHours = { open: specialHour.openTime, close: specialHour.closeTime };
    } else {
        const dayOfWeek = getDayOfWeek(date);
        effectiveOpeningHours = settings.openingHours[dayOfWeek];
    }
    
    if (!effectiveOpeningHours || !effectiveOpeningHours.open) {
        return []; // Restaurant is closed
    }

    const eligibleTables = tables.filter(t => t.capacity >= covers && t.isReady);
    if (eligibleTables.length === 0) {
        return []; // No tables large enough or ready
    }

    // Generate potential time slots every 15 minutes
    const [startH, startM] = effectiveOpeningHours.open.split(':').map(Number);
    const [endH, endM] = effectiveOpeningHours.close.split(':').map(Number);
    
    const openingTime = new Date(date);
    openingTime.setHours(startH, startM, 0, 0);

    const closingTime = new Date(date);
    closingTime.setHours(endH, endM, 0, 0);

    let currentTime = openingTime;
    
    while(currentTime < closingTime) {
        const timeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
        
        // Find tables that are NOT occupied at this time
        const availableTablesForSlot = eligibleTables.filter(table => {
            // Check for any reservations for this table that would conflict with the potential new booking
            const conflictingReservations = reservations.filter(r => r.tableId === table.id);

            return !conflictingReservations.some(res => {
                const resStartTime = new Date(date);
                const [resH, resM] = res.time.split(':').map(Number);
                resStartTime.setHours(resH, resM, 0, 0);

                const resEndTime = new Date(resStartTime.getTime() + settings.turnoverMinutes * 60000);
                
                const newBookingStartTime = currentTime;
                const newBookingEndTime = new Date(newBookingStartTime.getTime() + settings.turnoverMinutes * 60000);

                // A conflict exists if the new booking overlaps with an existing one.
                // (StartA <= EndB) and (EndA >= StartB)
                return newBookingStartTime < resEndTime && newBookingEndTime > resStartTime;
            });
        });

        if (availableTablesForSlot.length > 0) {
            availableSlots.push({
                time: timeStr,
                availableTables: availableTablesForSlot
            });
        }
        
        // Move to the next 15-minute interval
        currentTime = new Date(currentTime.getTime() + 15 * 60000);
    }


    return availableSlots;
};

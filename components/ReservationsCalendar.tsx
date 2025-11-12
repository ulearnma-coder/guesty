import React, { useState, useEffect, useCallback } from 'react';
import { getReservations, getSettings } from '../services/apiService';
import type { Reservation, Settings } from '../types';
import ReservationModal from './ReservationModal';
import { getDayOfWeek, formatTime } from '../utils/time';
import { ReservationStatus } from '../constants';

const STATUS_COLORS: { [key in ReservationStatus]: string } = {
    [ReservationStatus.PENDING]: 'bg-yellow-500',
    [ReservationStatus.CONFIRMED]: 'bg-green-500',
    [ReservationStatus.CANCELLED]: 'bg-red-500',
    [ReservationStatus.NO_SHOW]: 'bg-gray-600',
    [ReservationStatus.PAID]: 'bg-blue-500',
};

/**
 * A calendar-like view to display and manage daily reservations.
 * Shows a timeline for the selected day with all bookings.
 */
const ReservationsCalendar: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const dateString = selectedDate.toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [resData, settingsData] = await Promise.all([
                getReservations({ date: dateString }),
                getSettings()
            ]);
            setReservations(resData);
            setSettings(settingsData);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to fetch data.";
            console.error("Calendar fetch error:", errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [dateString]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDateChange = (days: number) => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    };
    
    const handleOpenModal = (reservation: Reservation | null) => {
        setSelectedReservation(reservation);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedReservation(null);
        fetchData(); // Refresh data after modal closes
    };
    
    const renderTimeSlots = () => {
        if (!settings) return null;

        const dayOfWeek = getDayOfWeek(selectedDate);
        const openingHours = settings.openingHours[dayOfWeek];
        if (!openingHours || !openingHours.open) return <p className="text-center p-4">Restaurant is closed today.</p>;

        const openTime = parseInt(openingHours.open.split(':')[0]);
        const closeTime = parseInt(openingHours.close.split(':')[0]);
        const slots = [];
        for (let hour = openTime; hour < closeTime; hour++) {
            slots.push(`${String(hour).padStart(2, '0')}:00`);
            slots.push(`${String(hour).padStart(2, '0')}:30`);
        }

        return slots.map(time => (
            <div key={time} className="relative border-t border-accent h-20 flex">
                <span className="absolute -top-2.5 left-2 bg-secondary px-1 text-xs text-text-secondary">{formatTime(time)}</span>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 p-1 pt-4">
                    {reservations
                        .filter(r => {
                            const resHour = parseInt(r.time.split(':')[0]);
                            const resMin = parseInt(r.time.split(':')[1]);
                            const slotHour = parseInt(time.split(':')[0]);
                            const slotMin = parseInt(time.split(':')[1]);
                            return resHour === slotHour && (slotMin === 0 ? resMin < 30 : resMin >= 30);
                        })
                        .map(res => (
                            <div
                                key={res.id}
                                onClick={() => handleOpenModal(res)}
                                className={`p-2 rounded-md cursor-pointer text-white text-xs ${STATUS_COLORS[res.status]} h-fit`}
                            >
                                <p className="font-bold truncate">{res.customerName}</p>
                                <p>{res.covers} covers @ {formatTime(res.time)}</p>
                            </div>
                        ))}
                </div>
            </div>
        ));
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Reservations</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors duration-200">
                    New Reservation
                </button>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-md mb-6"><strong>Error:</strong> {error}</div>}
            
            <div className="flex items-center justify-center space-x-4 mb-4 bg-secondary p-2 rounded-md">
                <button onClick={() => handleDateChange(-1)} className="p-2 rounded hover:bg-accent">&lt;</button>
                <h3 className="text-xl font-semibold">{selectedDate.toDateString()}</h3>
                <button onClick={() => handleDateChange(1)} className="p-2 rounded hover:bg-accent">&gt;</button>
            </div>

            <div className="bg-secondary p-4 rounded-lg shadow-lg">
                {loading ? <p>Loading...</p> : renderTimeSlots()}
            </div>
            
            {isModalOpen && (
                <ReservationModal 
                    reservation={selectedReservation} 
                    onClose={handleCloseModal}
                    initialDate={dateString}
                />
            )}
        </div>
    );
};

export default ReservationsCalendar;

import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import type { Reservation, Settings } from '../types';
import { ReservationStatus } from '../constants';
import { formatTime } from '../utils/time';

const STATUS_COLORS: { [key in ReservationStatus]: string } = {
    [ReservationStatus.PENDING]: 'bg-yellow-600',
    [ReservationStatus.CONFIRMED]: 'bg-green-600',
    [ReservationStatus.CANCELLED]: 'bg-red-600',
    [ReservationStatus.NO_SHOW]: 'bg-gray-500',
    [ReservationStatus.PAID]: 'bg-blue-600',
};

// A simple modal for entering the check amount
const CheckAmountModal: React.FC<{
    onClose: () => void;
    onSubmit: (amount: number) => void;
}> = ({ onClose, onSubmit }) => {
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!isNaN(numericAmount) && numericAmount >= 0) {
            onSubmit(numericAmount);
        } else {
            alert('Please enter a valid, non-negative number.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Enter Final Check Amount</h2>
                <div className="mb-4">
                    <label htmlFor="checkAmount" className="sr-only">Amount</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">$</div>
                        <input
                            type="number"
                            id="checkAmount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-primary border border-accent rounded-md p-2 pl-7 text-text-primary"
                            placeholder="123.45"
                            min="0"
                            step="0.01"
                            required
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600">Cancel</button>
                    <button type="submit" className="bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500">Save</button>
                </div>
            </form>
        </div>
    );
};


const ReservationsList: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('ALL'); // New state for status filter
    
    // State for the check amount modal
    const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
    const [currentReservationId, setCurrentReservationId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [data, settingsData] = await Promise.all([
                api.getReservations({ date: selectedDate, status: statusFilter }), // Pass status filter to API
                api.getSettings()
            ]);
            setReservations(data);
            setSettings(settingsData);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch reservations');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, statusFilter]); // Add statusFilter to dependency array

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = async (reservationId: string, newStatus: ReservationStatus) => {
        if (newStatus === ReservationStatus.PAID) {
            setCurrentReservationId(reservationId);
            setIsAmountModalOpen(true);
        } else {
            try {
                const currentReservation = reservations.find(r => r.id === reservationId);
                const updatePayload: Partial<Reservation> = { status: newStatus };
                if (currentReservation?.status === ReservationStatus.PAID) {
                    updatePayload.checkAmount = null;
                }
                
                await api.updateReservation(reservationId, updatePayload);
                fetchData();
            } catch (err: any) {
                alert(`Failed to update status: ${err.message}`);
            }
        }
    };

    const handleAmountSubmit = async (amount: number) => {
        if (!currentReservationId) return;

        try {
            await api.updateReservation(currentReservationId, {
                status: ReservationStatus.PAID,
                checkAmount: amount,
            });
            fetchData();
        } catch (err: any) {
            alert(`Failed to save check amount: ${err.message}`);
        } finally {
            setIsAmountModalOpen(false);
            setCurrentReservationId(null);
        }
    };
    
    const isPotentialNoShow = (reservation: Reservation): boolean => {
        if (reservation.status !== ReservationStatus.CONFIRMED || !settings?.noShowGraceMinutes) {
            return false;
        }
        const gracePeriod = settings.noShowGraceMinutes;
        const reservationTime = new Date(`${reservation.date}T${reservation.time}`);
        const graceTime = new Date(reservationTime.getTime() + gracePeriod * 60000);
        return new Date() > graceTime;
    };

    return (
        <div>
            {isAmountModalOpen && (
                <CheckAmountModal
                    onClose={() => setIsAmountModalOpen(false)}
                    onSubmit={handleAmountSubmit}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Reservations List</h2>
                <div className="flex items-center space-x-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-secondary border border-accent p-2 rounded-md"
                    >
                        <option value="ALL">All Statuses</option>
                        {Object.values(ReservationStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-secondary border border-accent p-2 rounded-md"
                    />
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-md mb-6"><strong>Error:</strong> {error}</div>}

            <div className="bg-secondary rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-accent">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Time</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Guest</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Covers</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Table / Section</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Notes</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center p-8">Loading reservations...</td></tr>
                            ) : reservations.length > 0 ? (
                                reservations.map(res => (
                                    <tr key={res.id} className={`transition-colors ${isPotentialNoShow(res) ? 'bg-yellow-900/50 hover:bg-yellow-900/70' : 'hover:bg-primary'}`}>
                                        <td className="py-4 px-4 whitespace-nowrap font-medium">{formatTime(res.time)}</td>
                                        <td className="py-4 px-4 whitespace-nowrap">{res.customerName}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-center">{res.covers}</td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {res.tableName} / {res.sectionName}
                                        </td>
                                        <td className="py-4 px-4 max-w-xs truncate" title={res.notes}>{res.notes || '-'}</td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <select
                                                value={res.status}
                                                onChange={(e) => handleStatusChange(res.id, e.target.value as ReservationStatus)}
                                                className={`${STATUS_COLORS[res.status]} border-none rounded-md p-1.5 text-xs text-white font-bold focus:ring-2 focus:ring-highlight`}
                                            >
                                                {Object.values(ReservationStatus).map(s => (
                                                    <option key={s} value={s} className="bg-secondary font-bold">{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="text-center p-8 text-text-secondary">No reservations found for this date and status.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReservationsList;
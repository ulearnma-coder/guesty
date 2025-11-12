import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Reservation, Table, Section, Settings, SpecialOpeningHour } from '../types';
import { ReservationStatus } from '../constants';
import * as api from '../services/apiService';
import { calculateAvailableSlots } from '../utils/slotLogic';
import { formatTime } from '../utils/time';

interface ReservationModalProps {
    reservation: Reservation | null;
    onClose: () => void;
    initialDate: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ reservation, onClose, initialDate }) => {
    const [currentStep, setCurrentStep] = useState(1); // 1: Time, 2: Table, 3: Details
    const [formData, setFormData] = useState<Partial<Reservation>>({
        customerName: '',
        contact: '',
        date: initialDate,
        time: '',
        covers: 2,
        tableId: null,
        sectionId: '',
        status: ReservationStatus.CONFIRMED,
        notes: '',
    });
    
    // Data fetched from API
    const [allTables, setAllTables] = useState<Table[]>([]);
    const [allSections, setAllSections] = useState<Section[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [reservationsForDate, setReservationsForDate] = useState<Reservation[]>([]);
    const [specialOpeningHours, setSpecialOpeningHours] = useState<SpecialOpeningHour[]>([]);

    // State derived from selections
    const [availableTimeSlots, setAvailableTimeSlots] = useState<ReturnType<typeof calculateAvailableSlots>>([]);
    const [availableTablesForSlot, setAvailableTablesForSlot] = useState<Table[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({}); // For inline validation
    const [loading, setLoading] = useState(true);

    const fetchReservationsForDate = useCallback(async (date: string) => {
        try {
            const reservationsData = await api.getReservations({ date });
            setReservationsForDate(
                reservation ? reservationsData.filter(r => r.id !== reservation.id) : reservationsData
            );
        } catch(err: any) {
            setError(`Failed to load reservations for ${date}: ${err.message}`);
        }
    }, [reservation]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [tablesData, sectionsData, settingsData, specialHoursData] = await Promise.all([
                    api.getTables(),
                    api.getSections(),
                    api.getSettings(),
                    api.getSpecialOpeningHours()
                ]);
                setAllTables(tablesData);
                setAllSections(sectionsData);
                setSettings(settingsData);
                setSpecialOpeningHours(specialHoursData);

                if (reservation) {
                    setFormData({ ...reservation, customerName: reservation.customerName || '', contact: reservation.contact || '', notes: reservation.notes || '' });
                    setCurrentStep(3);
                }
                
                await fetchReservationsForDate(formData.date!);

            } catch(err: any) {
                setError(`Failed to load data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [reservation, fetchReservationsForDate, formData.date]);

    useEffect(() => {
        if (!settings || allTables.length === 0 || !formData.date || !formData.covers) return;
        const dateObj = new Date(formData.date + 'T00:00:00');
        const slots = calculateAvailableSlots(dateObj, formData.covers, settings, reservationsForDate, allTables, specialOpeningHours);
        setAvailableTimeSlots(slots);
    }, [formData.date, formData.covers, settings, reservationsForDate, allTables, specialOpeningHours]);


    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "date") {
            setFormData(prev => ({ ...prev, date: value, time: '', tableId: null, sectionId: '' }));
            fetchReservationsForDate(value);
            setCurrentStep(1);
        } else {
             setFormData(prev => ({ ...prev, [name]: name === 'covers' ? parseInt(value, 10) : value }));
        }
    };

    const handleTimeSelect = (slot: { time: string; availableTables: Table[] }) => {
        setFormData(prev => ({ ...prev, time: slot.time }));
        setAvailableTablesForSlot(slot.availableTables);
        setCurrentStep(2);
    };

    const handleTableSelect = (table: Table) => {
        setFormData(prev => ({ ...prev, tableId: table.id, sectionId: table.sectionId }));
        setCurrentStep(3);
    };
    
    const validateDetails = (): boolean => {
        const errors: { [key: string]: string } = {};
        if (!formData.customerName?.trim()) {
            errors.customerName = "Customer name is required.";
        }
        if (!formData.contact?.trim()) {
            errors.contact = "Contact information is required.";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!validateDetails()) return;

        if (!formData.tableId) {
            setError("A table must be selected.");
            return;
        }

        const selectedTable = allTables.find(t => t.id === formData.tableId);
        if (!selectedTable) {
            setError("Could not find the selected table. Please go back and select a table again.");
            return;
        }

        if (!formData.covers || formData.covers > selectedTable.capacity) {
            setError(`Party size (${formData.covers}) exceeds this table's capacity of ${selectedTable.capacity}. Please choose a larger table or reduce the party size.`);
            return;
        }

        setIsSaving(true);
        try {
            const submissionPayload = {
                customerName: formData.customerName!,
                contact: formData.contact!,
                date: formData.date!,
                time: formData.time!,
                covers: formData.covers!,
                tableId: formData.tableId,
                sectionId: formData.sectionId!,
                status: formData.status!,
                notes: formData.notes!,
            };

            if (reservation) {
                await api.updateReservation(reservation.id, submissionPayload);
            } else {
                await api.createReservation(submissionPayload);
            }
            onClose();
        } catch (err: any) {
            setError(`Error saving reservation: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const sectionsWithAvailableTables = useMemo(() => {
        return allSections.map(section => ({
            ...section,
            tables: availableTablesForSlot.filter(table => table.sectionId === section.id)
        })).filter(section => section.tables.length > 0);
    }, [allSections, availableTablesForSlot]);

    const renderStep1_TimeSelection = () => (
        <div>
            <h3 className="text-xl font-bold mb-4">1. Select Date & Party Size</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleFormChange} required className="bg-primary border border-accent p-2 rounded-md w-full" />
                </div>
                <div>
                    <label htmlFor="covers" className="block text-sm font-medium text-text-secondary mb-1">Party Size</label>
                    <input type="number" name="covers" value={formData.covers} onChange={handleFormChange} min="1" required className="bg-primary border border-accent p-2 rounded-md w-full" />
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Available Times</h3>
            <div className="max-h-60 overflow-y-auto grid grid-cols-4 gap-2 p-2 bg-primary rounded-md">
                {loading ? <p>Loading...</p> : availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map(slot => (
                        <button key={slot.time} type="button" onClick={() => handleTimeSelect(slot)} className="bg-accent text-white font-semibold py-2 px-1 rounded-md text-sm hover:bg-highlight transition-colors">
                            {formatTime(slot.time)}
                        </button>
                    ))
                ) : <p className="col-span-4 text-center text-text-secondary py-4">No available slots for this date and party size.</p>}
            </div>
        </div>
    );
    
    const renderStep2_TableSelection = () => (
         <div>
            <button type="button" onClick={() => setCurrentStep(1)} className="text-sm text-highlight mb-4">&larr; Back to time selection</button>
            <h3 className="text-xl font-bold mb-4">2. Select a Table</h3>
             <p className="text-text-secondary mb-4">Available tables for {formData.covers} guests at {formatTime(formData.time || '')}.</p>
            <div className="max-h-72 overflow-y-auto space-y-4">
                {sectionsWithAvailableTables.map(section => (
                    <div key={section.id}>
                        <h4 className="font-semibold text-highlight border-b border-accent pb-1 mb-2">{section.name}</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {section.tables.map(table => (
                                <button key={table.id} type="button" onClick={() => handleTableSelect(table)} className="bg-accent text-white p-3 rounded-md text-center hover:bg-highlight transition-colors">
                                    <span className="font-bold">Table {table.name}</span>
                                    <span className="block text-xs text-text-secondary">{table.capacity} seats</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3_GuestDetails = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                 <button type="button" onClick={() => setCurrentStep(reservation ? 1 : 2)} className="text-sm text-highlight mb-4">&larr; Back to table selection</button>
                <h3 className="text-xl font-bold">3. Enter Guest Details</h3>
                <p className="text-text-secondary">
                    Table {allTables.find(t => t.id === formData.tableId)?.name} for {formData.covers} guests at {formatTime(formData.time || '')}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <input type="text" name="customerName" value={formData.customerName} onChange={handleFormChange} placeholder="Customer Name" required className="bg-primary border border-accent p-2 rounded-md w-full" />
                    {validationErrors.customerName && <p className="text-red-400 text-xs mt-1">{validationErrors.customerName}</p>}
                </div>
                <div>
                    <input type="text" name="contact" value={formData.contact} onChange={handleFormChange} placeholder="Contact (Phone/Email)" required className="bg-primary border border-accent p-2 rounded-md w-full" />
                    {validationErrors.contact && <p className="text-red-400 text-xs mt-1">{validationErrors.contact}</p>}
                </div>
            </div>
            <select name="status" value={formData.status} onChange={handleFormChange} required className="w-full bg-primary border border-accent p-2 rounded-md">
                {Object.values(ReservationStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
            <textarea name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Notes (e.g., allergies, special requests)" rows={3} className="w-full bg-primary border border-accent p-2 rounded-md"></textarea>
            
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors disabled:bg-gray-500">
                    {isSaving ? 'Saving...' : 'Save Reservation'}
                </button>
            </div>
        </form>
    );

    const renderContent = () => {
        if (loading && !reservation) return <p>Loading booking information...</p>;

        switch(currentStep) {
            case 1: return renderStep1_TimeSelection();
            case 2: return renderStep2_TableSelection();
            case 3: return renderStep3_GuestDetails();
            default: return renderStep1_TimeSelection();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary text-text-primary rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-xl">
                <h2 className="text-2xl font-bold mb-6">{reservation ? 'Edit' : 'New'} Reservation</h2>
                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4 text-sm"><strong>Error:</strong> {error}</div>}
                {renderContent()}
            </div>
        </div>
    );
};

export default ReservationModal;

import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import type { Settings, OpeningHours, SpecialOpeningHour } from '../types';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [specialHours, setSpecialHours] = useState<SpecialOpeningHour[]>([]);
    const [newSpecialHour, setNewSpecialHour] = useState<SpecialOpeningHour>({ date: '', isOpen: true, openTime: '17:00', closeTime: '22:00' });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [settingsData, specialHoursData] = await Promise.all([
                api.getSettings(),
                api.getSpecialOpeningHours(),
            ]);
            setSettings(settingsData);
            setSpecialHours(specialHoursData.sort((a, b) => a.date.localeCompare(b.date)));
        } catch (err: any) {
            const errorMessage = err.message || "Failed to load settings data.";
            console.error("Settings fetch error:", errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => prev ? { ...prev, [key]: value } : null);
    };

    const handleHoursChange = (day: string, type: keyof OpeningHours, value: string) => {
        setSettings(prev => {
            if (!prev) return null;
            const newHours = { ...prev.openingHours };
            newHours[day] = { ...newHours[day], [type]: value };
            return { ...prev, openingHours: newHours };
        });
    };
    
    const handleSaveGeneral = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await api.updateSettings(settings);
            alert('General settings saved successfully!');
        } catch (error: any) {
            alert(`Failed to save settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAddSpecialHour = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSpecialHour.date) {
            alert("Please select a date.");
            return;
        }
        try {
            await api.upsertSpecialOpeningHour(newSpecialHour);
            fetchData(); // Refresh list
            setNewSpecialHour({ date: '', isOpen: true, openTime: '17:00', closeTime: '22:00' }); // Reset form
        } catch (error: any) {
            alert(`Failed to add special hours: ${error.message}`);
        }
    };

    const handleDeleteSpecialHour = async (date: string) => {
        if (window.confirm(`Are you sure you want to delete the special hours for ${date}?`)) {
            try {
                await api.deleteSpecialOpeningHour(date);
                fetchData(); // Refresh list
            } catch (error: any) {
                alert(`Failed to delete special hours: ${error.message}`);
            }
        }
    };

    if (loading) return <p>Loading settings...</p>;
    if (error) return <div className="bg-red-900/50 text-red-300 p-4 rounded-md"><strong>Error:</strong> {error}</div>;
    if (!settings) return <p>Could not load settings.</p>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Settings</h2>
            <div className="bg-secondary p-8 rounded-lg shadow-lg max-w-4xl mx-auto space-y-12">
                
                {/* General Settings */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 border-b border-accent pb-2">General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Turnover Time (minutes)</label>
                            <input type="number" value={settings.turnoverMinutes} onChange={(e) => handleInputChange('turnoverMinutes', parseInt(e.target.value, 10))} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Overall Capacity</label>
                            <input type="number" value={settings.overallCapacity || ''} onChange={(e) => handleInputChange('overallCapacity', parseInt(e.target.value, 10))} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">No-Show Grace Period (min)</label>
                            <input type="number" value={settings.noShowGraceMinutes || 15} onChange={(e) => handleInputChange('noShowGraceMinutes', parseInt(e.target.value, 10))} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Timezone</label>
                            <select value={settings.timezone} onChange={(e) => handleInputChange('timezone', e.target.value)} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary">
                                <option>America/New_York</option>
                                <option>America/Chicago</option>
                                <option>America/Denver</option>
                                <option>America/Los_Angeles</option>
                                <option>Europe/London</option>
                            </select>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4 mt-4">
                        <button onClick={handleSaveGeneral} disabled={saving} className="bg-highlight text-white font-bold py-2 px-6 rounded-md hover:bg-teal-500 disabled:bg-gray-500">{saving ? 'Saving...' : 'Save General'}</button>
                    </div>
                </div>

                {/* Default Opening Hours */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 border-b border-accent pb-2">Default Weekly Hours</h3>
                    <div className="space-y-4">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="grid grid-cols-3 items-center gap-4">
                                <span className="capitalize font-medium">{day}</span>
                                <input type="time" value={settings.openingHours[day]?.open || ''} onChange={(e) => handleHoursChange(day, 'open', e.target.value)} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary" />
                                <input type="time" value={settings.openingHours[day]?.close || ''} onChange={(e) => handleHoursChange(day, 'close', e.target.value)} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary" />
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Special Opening Hours */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 border-b border-accent pb-2">Special Hours & Closures</h3>
                    <form onSubmit={handleAddSpecialHour} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-primary p-4 rounded-md mb-6">
                        <div className="col-span-1 sm:col-span-4"><label className="font-medium">Add Override for a Specific Date</label></div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Date</label>
                            <input type="date" value={newSpecialHour.date} onChange={e => setNewSpecialHour(p => ({ ...p, date: e.target.value }))} className="w-full bg-secondary border border-accent rounded-md p-2 text-text-primary" required />
                        </div>
                        <div className="flex items-center pt-5">
                            <input type="checkbox" id="isOpen" checked={newSpecialHour.isOpen} onChange={e => setNewSpecialHour(p => ({ ...p, isOpen: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-highlight focus:ring-highlight" />
                            <label htmlFor="isOpen" className="ml-2">Is Open?</label>
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Open Time</label>
                            <input type="time" value={newSpecialHour.openTime || ''} onChange={e => setNewSpecialHour(p => ({ ...p, openTime: e.target.value }))} disabled={!newSpecialHour.isOpen} className="w-full bg-secondary border border-accent rounded-md p-2 text-text-primary disabled:opacity-50" />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Close Time</label>
                            <input type="time" value={newSpecialHour.closeTime || ''} onChange={e => setNewSpecialHour(p => ({ ...p, closeTime: e.target.value }))} disabled={!newSpecialHour.isOpen} className="w-full bg-secondary border border-accent rounded-md p-2 text-text-primary disabled:opacity-50" />
                        </div>
                        <div className="col-span-1 sm:col-span-4">
                            <button type="submit" className="bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 w-full">Add/Update Special Date</button>
                        </div>
                    </form>

                    <div className="space-y-2">
                        {specialHours.map(h => (
                            <div key={h.date} className="flex justify-between items-center bg-primary p-3 rounded-md">
                                <div>
                                    <p className="font-bold">{h.date}</p>
                                    <p className="text-sm text-text-secondary">{h.isOpen ? `${h.openTime} - ${h.closeTime}` : 'CLOSED'}</p>
                                </div>
                                <button onClick={() => handleDeleteSpecialHour(h.date)} className="text-red-400 hover:text-red-300">Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

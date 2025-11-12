import React, { useState, useEffect, useCallback } from 'react';
import { getReservations } from '../services/apiService';
import { generateStaffBriefing } from '../services/geminiService';
import type { Reservation } from '../types';
import { ReservationStatus } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// A simple card component for displaying stats
const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <p className="text-3xl font-bold mt-1">{value}</p>
        <p className="text-xs text-text-secondary mt-2">{description}</p>
    </div>
);

// A simple spinner component
const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

/**
 * Dashboard component displaying key metrics and AI-powered staff briefing.
 */
const Dashboard: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [briefing, setBriefing] = useState<string>('');
    const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTodaysReservations = useCallback(async () => {
        try {
            setError(null);
            const today = new Date().toISOString().split('T')[0];
            const data = await getReservations({ date: today });
            setReservations(data);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load reservations.';
            console.error("Dashboard fetch error:", errorMessage);
            setError(errorMessage);
        }
    }, []);

    useEffect(() => {
        fetchTodaysReservations();
    }, [fetchTodaysReservations]);

    const handleGenerateBriefing = async () => {
        setIsLoadingBriefing(true);
        setBriefing('');
        const briefingText = await generateStaffBriefing(reservations);
        setBriefing(briefingText);
        setIsLoadingBriefing(false);
    };
    
    // Calculate stats from reservations
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter(r => r.status === ReservationStatus.CONFIRMED);
    const totalCovers = confirmedReservations.reduce((sum, r) => sum + r.covers, 0);
    const avgCovers = totalReservations > 0 ? (totalCovers / confirmedReservations.length).toFixed(1) : 0;
    
    // Prepare data for the chart
    const chartData = reservations.reduce((acc, res) => {
        const hour = parseInt(res.time.split(':')[0], 10);
        const slot = `${hour}:00`;
        const existing = acc.find(item => item.time === slot);
        if (existing) {
            existing.covers += res.covers;
        } else {
            acc.push({ time: slot, covers: res.covers });
        }
        return acc;
    }, [] as {time: string, covers: number}[]).sort((a, b) => a.time.localeCompare(b.time));


    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-md mb-6"><strong>Error:</strong> {error}</div>}
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Reservations" value={totalReservations} description="For today" />
                <StatCard title="Confirmed Covers" value={totalCovers} description="Guests expected today" />
                <StatCard title="Avg. Party Size" value={avgCovers} description="Average covers per booking" />
                <StatCard title="Cancellations" value={reservations.filter(r => r.status === ReservationStatus.CANCELLED).length} description="For today" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AI Staff Briefing Section */}
                <div className="lg:col-span-1 bg-secondary p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Daily Staff Briefing</h3>
                    <p className="text-text-secondary mb-4 text-sm">Use Gemini to generate a summary of today's important reservation notes for your team.</p>
                    <button
                        onClick={handleGenerateBriefing}
                        disabled={isLoadingBriefing}
                        className="w-full bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-500"
                    >
                        {isLoadingBriefing ? <Spinner /> : 'Generate Briefing'}
                    </button>
                    {briefing && (
                        <div className="mt-4 p-4 bg-primary rounded-md whitespace-pre-wrap font-mono text-sm">
                            {briefing}
                        </div>
                    )}
                </div>

                {/* Bookings Chart */}
                <div className="lg:col-span-2 bg-secondary p-6 rounded-lg shadow-lg h-96">
                    <h3 className="text-xl font-semibold mb-4">Covers by Hour</h3>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="time" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a202c',
                                    borderColor: '#4a5568'
                                }}
                            />
                            <Legend wrapperStyle={{color: '#edf2f7'}}/>
                            <Bar dataKey="covers" fill="#38b2ac" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

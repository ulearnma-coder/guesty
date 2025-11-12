import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../services/apiService';
import type { Reservation } from '../types';
import { formatTime } from '../utils/time';

// A simple card component for displaying stats, similar to the dashboard
const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {description && <p className="text-xs text-text-secondary mt-2">{description}</p>}
    </div>
);

// Helper to format currency
const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || typeof amount === 'undefined') return 'Dh 0.00';
    return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
};


const Financials: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getFinancialReport({ startDate, endDate });
            setReportData(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch financial report");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        // Fetch report on initial load
        fetchReport();
    }, [fetchReport]);

    const financialStats = useMemo(() => {
        const totalRevenue = reportData.reduce((sum, res) => sum + (res.checkAmount || 0), 0);
        const totalChecks = reportData.length;
        const totalCovers = reportData.reduce((sum, res) => sum + res.covers, 0);
        const avgCheck = totalChecks > 0 ? totalRevenue / totalChecks : 0;
        const revPerCover = totalCovers > 0 ? totalRevenue / totalCovers : 0;

        return { totalRevenue, totalChecks, totalCovers, avgCheck, revPerCover };
    }, [reportData]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Financial Report</h2>

            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-4 bg-secondary p-4 rounded-lg mb-6">
                <div>
                    <label htmlFor="startDate" className="text-sm font-medium mr-2">Start Date:</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-primary border border-accent p-2 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="text-sm font-medium mr-2">End Date:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-primary border border-accent p-2 rounded-md"
                    />
                </div>
                <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 disabled:bg-gray-500"
                >
                    {loading ? 'Loading...' : 'Generate Report'}
                </button>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-md mb-6"><strong>Error:</strong> {error}</div>}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard title="Total Revenue" value={formatCurrency(financialStats.totalRevenue)} />
                <StatCard title="Total Checks" value={financialStats.totalChecks} />
                <StatCard title="Average Check" value={formatCurrency(financialStats.avgCheck)} />
                <StatCard title="Total Covers" value={financialStats.totalCovers} />
                <StatCard title="Revenue / Cover" value={formatCurrency(financialStats.revPerCover)} />
            </div>

            {/* Detailed Transaction List */}
            <div className="bg-secondary rounded-lg shadow-lg overflow-hidden">
                <h3 className="text-xl font-semibold p-4 border-b border-accent">Paid Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-accent">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Time</th>
                                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Guest</th>
                                <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider">Covers</th>
                                <th className="py-3 px-4 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8">Loading...</td></tr>
                            ) : reportData.length > 0 ? (
                                reportData.map(res => (
                                    <tr key={res.id} className="hover:bg-primary">
                                        <td className="py-4 px-4 whitespace-nowrap">{res.date}</td>
                                        <td className="py-4 px-4 whitespace-nowrap">{formatTime(res.time)}</td>
                                        <td className="py-4 px-4 whitespace-nowrap">{res.customerName}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-center">{res.covers}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-right font-mono">{formatCurrency(res.checkAmount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center p-8 text-text-secondary">No paid reservations found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Financials;
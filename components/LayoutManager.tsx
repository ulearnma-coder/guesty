import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import type { Floor, Section, Table } from '../types';

// Simple SVG icon components
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

// --- Modal Component ---
interface CrudModalProps {
    mode: 'add' | 'edit';
    type: 'floor' | 'section' | 'table';
    item?: Floor | Section | Table | null;
    onSubmit: (formData: { name: string; capacity?: number }) => void;
    onClose: () => void;
}

const CrudModal: React.FC<CrudModalProps> = ({ mode, type, item, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: mode === 'edit' ? item?.name || '' : '',
        capacity: mode === 'edit' && type === 'table' ? (item as Table).capacity : 2,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const title = `${mode === 'add' ? 'Add New' : 'Edit'} ${type}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 capitalize">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary"
                            required
                        />
                    </div>
                    {type === 'table' && (
                        <div>
                            <label htmlFor="capacity" className="block text-sm font-medium text-text-secondary mb-1">Capacity</label>
                            <input
                                id="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value, 10) }))}
                                className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary"
                                required
                                min="1"
                            />
                        </div>
                    )}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600">Cancel</button>
                        <button type="submit" className="bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const LayoutManager: React.FC = () => {
    const [floors, setFloors] = useState<Floor[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<Omit<CrudModalProps, 'onSubmit' | 'onClose'> | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [floorData, sectionData, tableData] = await Promise.all([
                api.getFloors(),
                api.getSections(),
                api.getTables()
            ]);
            setFloors(floorData);
            setSections(sectionData);
            setTables(tableData);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to fetch layout data.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (mode: 'add' | 'edit', type: 'floor' | 'section' | 'table', item?: Floor | Section | Table, parentId?: string) => {
        setModalConfig({ mode, type, item });
        if (parentId) setParentId(parentId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalConfig(null);
        setParentId(null);
    };

    const handleToggleTableReady = async (tableId: string, currentStatus: boolean) => {
        try {
            await api.updateTableReadyStatus(tableId, !currentStatus);
            setTables(prevTables => prevTables.map(t => t.id === tableId ? { ...t, isReady: !currentStatus } : t));
        } catch (err: any) {
            alert(`Error updating table status: ${err.message}`);
        }
    };

    // --- CRUD Handlers ---
    const handleModalSubmit = async (formData: { name: string; capacity?: number }) => {
        if (!modalConfig) return;
        const { mode, type, item } = modalConfig;

        try {
            if (mode === 'add') {
                if (type === 'floor') await api.createFloor({ name: formData.name });
                if (type === 'section' && parentId) await api.createSection({ name: formData.name, floorId: parentId });
                if (type === 'table' && parentId) await api.createTable({ name: formData.name, capacity: formData.capacity!, sectionId: parentId });
            } else if (mode === 'edit' && item) {
                if (type === 'floor') await api.updateFloor(item.id, { name: formData.name });
                if (type === 'section') await api.updateSection(item.id, { name: formData.name });
                if (type === 'table') await api.updateTable(item.id, { name: formData.name, capacity: formData.capacity! });
            }
            fetchData();
        } catch (err: any) {
            alert(`Error saving ${type}: ${err.message}`);
        } finally {
            closeModal();
        }
    };

    const handleDelete = async (type: 'floor' | 'section' | 'table', id: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}? This action and all its contents will be permanently removed.`)) return;
        try {
            if (type === 'floor') await api.deleteFloor(id);
            if (type === 'section') await api.deleteSection(id);
            if (type === 'table') await api.deleteTable(id);
            fetchData();
        } catch (err: any) {
            alert(`Error deleting ${type}: ${err.message}`);
        }
    };

    if (error) return <div className="bg-red-900/50 text-red-300 p-4 rounded-md"><strong>Error:</strong> {error}</div>
    if (loading) return <p>Loading layout...</p>;

    return (
        <div>
            {isModalOpen && modalConfig && (
                <CrudModal
                    {...modalConfig}
                    onSubmit={handleModalSubmit}
                    onClose={closeModal}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Layout Manager</h2>
                <button onClick={() => openModal('add', 'floor')} className="flex items-center space-x-2 bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors">
                    <PlusIcon /> <span>Add Floor</span>
                </button>
            </div>
            
            <div className="space-y-8">
                {floors.map(floor => (
                    <div key={floor.id} className="bg-secondary p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center border-b border-accent pb-2 mb-4">
                            <h3 className="text-2xl font-semibold text-white">{floor.name}</h3>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => openModal('edit', 'floor', floor)} className="text-text-secondary hover:text-white"><EditIcon /></button>
                                <button onClick={() => handleDelete('floor', floor.id)} className="text-text-secondary hover:text-red-500"><DeleteIcon /></button>
                                <button onClick={() => openModal('add', 'section', undefined, floor.id)} className="flex items-center space-x-2 text-sm bg-accent text-white py-1 px-3 rounded-md hover:bg-highlight">
                                    <PlusIcon /> <span>Add Section</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {sections.filter(s => s.floorId === floor.id).map(section => (
                                <div key={section.id}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xl font-bold text-highlight">{section.name}</h4>
                                        <div className="flex items-center space-x-4">
                                            <button onClick={() => openModal('edit', 'section', section)} className="text-text-secondary hover:text-white"><EditIcon /></button>
                                            <button onClick={() => handleDelete('section', section.id)} className="text-text-secondary hover:text-red-500"><DeleteIcon /></button>
                                            <button onClick={() => openModal('add', 'table', undefined, section.id)} className="flex items-center space-x-2 text-xs bg-primary text-white py-1 px-2 rounded-md hover:bg-highlight">
                                                <PlusIcon /> <span>Add Table</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {tables.filter(t => t.sectionId === section.id).map(table => (
                                            <div key={table.id} className={`relative group bg-primary p-4 rounded-md text-center border-b-4 ${table.isReady ? 'border-green-500' : 'border-red-500'}`}>
                                                <p className="font-bold text-lg">Table {table.name}</p>
                                                <p className="text-sm text-text-secondary">{table.capacity} Seats</p>
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                     <button onClick={() => openModal('edit', 'table', table)} className="p-1 bg-accent rounded-full text-white hover:bg-highlight"><EditIcon /></button>
                                                     <button onClick={() => handleDelete('table', table.id)} className="p-1 bg-accent rounded-full text-white hover:bg-red-500"><DeleteIcon /></button>
                                                </div>
                                                <div className="mt-2">
                                                    <label className="flex items-center justify-center cursor-pointer">
                                                        <span className={`text-xs mr-2 ${table.isReady ? 'text-green-400' : 'text-red-400'}`}>{table.isReady ? 'Ready' : 'Not Ready'}</span>
                                                        <div className="relative">
                                                            <input type="checkbox" className="sr-only" checked={table.isReady} onChange={() => handleToggleTableReady(table.id, table.isReady)} />
                                                            <div className={`block ${table.isReady ? 'bg-highlight' : 'bg-gray-600'} w-10 h-6 rounded-full`}></div>
                                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${table.isReady ? 'transform translate-x-4' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LayoutManager;

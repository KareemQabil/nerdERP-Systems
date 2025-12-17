import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid3x3 } from 'lucide-react';
import type { Table } from '../types/pos.types';
import { useState, useEffect } from 'react';

interface TableSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTable: (table: Table) => void;
}

// Mock table data - replace with API call
const MOCK_TABLES: Table[] = [
    { id: '1', name: 'طاولة 1', number: '1', capacity: 4, status: 'available' },
    { id: '2', name: 'طاولة 2', number: '2', capacity: 2, status: 'occupied', currentOrderId: 'ORD-123' },
    { id: '3', name: 'طاولة 3', number: '3', capacity: 6, status: 'available' },
    { id: '4', name: 'طاولة 4', number: '4', capacity: 4, status: 'available' },
    { id: '5', name: 'طاولة 5', number: '5', capacity: 2, status: 'reserved' },
    { id: '6', name: 'طاولة 6', number: '6', capacity: 8, status: 'available' },
    { id: '7', name: 'طاولة 7', number: '7', capacity: 4, status: 'occupied', currentOrderId: 'ORD-456' },
    { id: '8', name: 'طاولة 8', number: '8', capacity: 2, status: 'available' },
];

export function TableSelectorModal({
    isOpen,
    onClose,
    onSelectTable,
}: TableSelectorModalProps) {
    const [tables, setTables] = useState<Table[]>([]);

    useEffect(() => {
        if (isOpen) {
            // TODO: Load tables from API
            setTables(MOCK_TABLES);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'available':
                return 'bg-green-500/20 border-green-500/50 text-green-400';
            case 'occupied':
                return 'bg-red-500/20 border-red-500/50 text-red-400';
            case 'reserved':
                return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
        }
    };

    const getStatusLabel = (status: Table['status']) => {
        switch (status) {
            case 'available':
                return 'متاحة';
            case 'occupied':
                return 'محجوزة';
            case 'reserved':
                return 'محجوز';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[80vh] bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center">
                                <Grid3x3 className="w-5 h-5 text-[#00373a]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    اختيار الطاولة
                                </h2>
                                <p className="text-sm text-[var(--on-surface-variant)]">
                                    اختر طاولة متاحة
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Tables Grid */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {tables.map((table, index) => (
                                <motion.button
                                    key={table.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={table.status === 'available' ? { scale: 1.05 } : {}}
                                    whileTap={table.status === 'available' ? { scale: 0.95 } : {}}
                                    onClick={() => {
                                        if (table.status === 'available') {
                                            onSelectTable(table);
                                            onClose();
                                        }
                                    }}
                                    disabled={table.status !== 'available'}
                                    className={`relative h-32 rounded-xl border-2 transition-all ${getStatusColor(table.status)} ${table.status === 'available'
                                            ? 'cursor-pointer hover:shadow-lg'
                                            : 'cursor-not-allowed opacity-60'
                                        }`}
                                >
                                    <div className="h-full flex flex-col items-center justify-center p-4">
                                        <div className="text-4xl font-['Arial'] font-bold mb-2">
                                            {table.number}
                                        </div>
                                        <div className="text-xs font-['Almarai'] mb-1" dir="auto">
                                            {table.name}
                                        </div>
                                        <div className="text-xs opacity-75">
                                            {table.capacity} أشخاص
                                        </div>
                                        <div className="mt-2 text-xs font-['Almarai'] font-bold">
                                            {getStatusLabel(table.status)}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {tables.filter((t) => t.status === 'available').length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-[var(--surface-variant)] flex items-center justify-center mb-3">
                                    <Grid3x3 className="w-10 h-10 text-[var(--on-surface-variant)] opacity-50" />
                                </div>
                                <h3 className="text-base font-['Almarai'] font-bold text-[var(--on-surface)] mb-1" dir="auto">
                                    لا توجد طاولات متاحة
                                </h3>
                                <p className="text-sm font-['Almarai'] text-[var(--on-surface-variant)]" dir="auto">
                                    جميع الطاولات محجوزة حالياً
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

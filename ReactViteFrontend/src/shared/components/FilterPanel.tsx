/**
 * Filter Panel Component - Advanced filtering UI
 * Usage: Multi-criteria filtering with date ranges, categories, status, etc.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter, X, ChevronDown, Check, Search,
    SlidersHorizontal, RefreshCw
} from 'lucide-react';

export interface FilterOption {
    id: string;
    label: string;
    labelEn?: string;
    value: any;
    color?: string;
    icon?: React.ReactNode;
    count?: number;
}

export interface FilterGroup {
    id: string;
    label: string;
    labelEn?: string;
    type: 'checkbox' | 'radio' | 'date' | 'range' | 'search';
    options?: FilterOption[];
    multiple?: boolean;
}

export interface FilterPanelProps {
    groups: FilterGroup[];
    onApply: (filters: Record<string, any>) => void;
    onReset: () => void;
    defaultFilters?: Record<string, any>;
    position?: 'left' | 'right';
    className?: string;
}

export function FilterPanel({
    groups,
    onApply,
    onReset,
    defaultFilters = {},
    position = 'right',
    className = ''
}: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>(defaultFilters);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)));

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleFilterChange = (groupId: string, value: any, multiple: boolean = false) => {
        setFilters(prev => {
            if (multiple) {
                const current = prev[groupId] || [];
                const isSelected = current.includes(value);
                return {
                    ...prev,
                    [groupId]: isSelected
                        ? current.filter((v: any) => v !== value)
                        : [...current, value]
                };
            }
            return { ...prev, [groupId]: value };
        });
    };

    const handleApply = () => {
        onApply(filters);
        setIsOpen(false);
    };

    const handleReset = () => {
        setFilters({});
        onReset();
    };

    const activeFiltersCount = Object.values(filters).filter(v =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''
    ).length;

    return (
        <>
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] hover:border-cyan-400 text-[#e2e2e6] rounded-xl font-['Almarai'] font-bold transition-colors ${className}`}
            >
                <SlidersHorizontal className="w-5 h-5" />
                <span>فلاتر</span>
                {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-400 text-[#00373a] rounded-full text-xs font-['Inter']">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: position === 'right' ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: position === 'right' ? '100%' : '-100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className={`fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} h-full w-96 bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] border-l border-[rgba(255,255,255,0.1)] shadow-2xl z-50 flex flex-col`}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-400/20 flex items-center justify-center">
                                            <Filter className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-['Almarai'] font-bold text-[#e2e2e6]" dir="rtl">
                                                الفلاتر
                                            </h2>
                                            <p className="text-sm text-[#c2c7ce] font-['Almarai']" dir="rtl">
                                                {activeFiltersCount} نشط
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                                    >
                                        <X className="w-6 h-6 text-[#c2c7ce]" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-xl text-[#c2c7ce] font-['Almarai'] transition-colors w-full justify-center"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    إعادة تعيين الكل
                                </button>
                            </div>

                            {/* Filter Groups */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {groups.map((group) => (
                                    <div key={group.id} className="space-y-3">
                                        {/* Group Header */}
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="w-full flex items-center justify-between p-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] rounded-xl transition-colors"
                                        >
                                            <div className="text-right">
                                                <p className="font-['Almarai'] font-bold text-[#e2e2e6]" dir="rtl">
                                                    {group.label}
                                                </p>
                                                {group.labelEn && (
                                                    <p className="text-xs text-[#c2c7ce] font-['Inter'] mt-0.5">
                                                        {group.labelEn}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronDown
                                                className={`w-5 h-5 text-[#c2c7ce] transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        {/* Group Options */}
                                        <AnimatePresence>
                                            {expandedGroups.has(group.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="space-y-2 pr-4">
                                                        {group.type === 'search' && (
                                                            <div className="relative">
                                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c7ce]" />
                                                                <input
                                                                    type="text"
                                                                    placeholder={`${group.label}...`}
                                                                    value={filters[group.id] || ''}
                                                                    onChange={(e) => handleFilterChange(group.id, e.target.value)}
                                                                    className="w-full pr-10 pl-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#e2e2e6] font-['Almarai'] placeholder:text-[#6b7280] text-sm focus:outline-none focus:border-cyan-400"
                                                                    dir="rtl"
                                                                />
                                                            </div>
                                                        )}

                                                        {group.type === 'date' && (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="date"
                                                                    value={filters[`${group.id}_from`] || ''}
                                                                    onChange={(e) => handleFilterChange(`${group.id}_from`, e.target.value)}
                                                                    className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#e2e2e6] font-['Inter'] text-sm focus:outline-none focus:border-cyan-400"
                                                                />
                                                                <input
                                                                    type="date"
                                                                    value={filters[`${group.id}_to`] || ''}
                                                                    onChange={(e) => handleFilterChange(`${group.id}_to`, e.target.value)}
                                                                    className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#e2e2e6] font-['Inter'] text-sm focus:outline-none focus:border-cyan-400"
                                                                />
                                                            </div>
                                                        )}

                                                        {(group.type === 'checkbox' || group.type === 'radio') && group.options?.map((option) => {
                                                            const isSelected = group.multiple
                                                                ? (filters[group.id] || []).includes(option.value)
                                                                : filters[group.id] === option.value;

                                                            return (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => handleFilterChange(group.id, option.value, group.multiple)}
                                                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${isSelected
                                                                            ? 'bg-cyan-400/20 border-2 border-cyan-400'
                                                                            : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.08)]'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {option.icon}
                                                                        <div className="text-right">
                                                                            <p className={`text-sm font-['Almarai'] ${isSelected ? 'text-cyan-400 font-bold' : 'text-[#e2e2e6]'}`} dir="rtl">
                                                                                {option.label}
                                                                            </p>
                                                                            {option.labelEn && (
                                                                                <p className="text-xs text-[#c2c7ce] font-['Inter']">
                                                                                    {option.labelEn}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        {option.count !== undefined && (
                                                                            <span className="text-xs text-[#c2c7ce] font-['Inter']">
                                                                                ({option.count})
                                                                            </span>
                                                                        )}
                                                                        {isSelected && (
                                                                            <Check className="w-5 h-5 text-cyan-400" />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-[rgba(255,255,255,0.1)]">
                                <button
                                    onClick={handleApply}
                                    className="w-full px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-[#00373a] rounded-xl font-['Almarai'] font-bold transition-colors"
                                >
                                    تطبيق الفلاتر
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

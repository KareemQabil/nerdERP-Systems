/**
 * PendingApprovalsList Component
 *
 * Lists all pending stock transfers and movements awaiting manager approval.
 *
 * Features:
 * - Filterable list of pending approvals
 * - Show transfer/movement details
 * - Approve/Reject buttons
 * - Batch approve multiple items
 * - Filter by warehouse, user, date range
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Calendar,
    Warehouse,
    AlertTriangle,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { TransferStatus } from './StockTransferModal';

export interface PendingApproval {
    id: string;
    type: 'TRANSFER' | 'MOVEMENT';
    status: TransferStatus;
    createdAt: string;
    requestedBy: string;
    fromWarehouse?: string;
    toWarehouse?: string;
    items: Array<{
        productName: string;
        quantity: number;
        unit: string;
    }>;
    notes?: string;
}

export interface PendingApprovalsListProps {
    warehouseId?: string;
    onApprove?: (id: string) => Promise<void>;
    onReject?: (id: string, reason: string) => Promise<void>;
}

/**
 * Pending Approvals List
 */
export function PendingApprovalsList({
    warehouseId,
    onApprove,
    onReject,
}: PendingApprovalsListProps) {
    const { language } = useSettingsStore();
    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT'>('PENDING');
    const [processing, setProcessing] = useState<Set<string>>(new Set());

    // Fetch pending approvals
    useEffect(() => {
        const fetchApprovals = async () => {
            setLoading(true);
            try {
                // TODO: Implement API call
                // For now, using mock data
                const mockApprovals: PendingApproval[] = [
                    {
                        id: '1',
                        type: 'TRANSFER',
                        status: 'PENDING',
                        createdAt: new Date().toISOString(),
                        requestedBy: 'John Doe',
                        fromWarehouse: 'Main Warehouse',
                        toWarehouse: 'Restaurant',
                        items: [
                            { productName: 'Chicken Breast', quantity: 10, unit: 'kg' },
                            { productName: 'Tomato', quantity: 5, unit: 'kg' },
                        ],
                        notes: 'Urgent - Restaurant running low',
                    },
                    {
                        id: '2',
                        type: 'MOVEMENT',
                        status: 'PENDING',
                        createdAt: new Date(Date.now() - 3600000).toISOString(),
                        requestedBy: 'Jane Smith',
                        items: [
                            { productName: 'Olive Oil', quantity: 2, unit: 'L' },
                        ],
                        notes: 'Damaged stock disposal',
                    },
                ];

                setApprovals(mockApprovals);
            } catch (err) {
                console.error('Failed to fetch approvals:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovals();
    }, [warehouseId]);

    // Handle approve
    const handleApprove = useCallback(
        async (id: string) => {
            if (!onApprove) return;

            setProcessing((prev) => new Set(prev).add(id));
            try {
                await onApprove(id);
                setApprovals((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
                console.error('Failed to approve:', err);
            } finally {
                setProcessing((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        },
        [onApprove],
    );

    // Handle reject
    const handleReject = useCallback(
        async (id: string) => {
            if (!onReject) return;

            const reason = prompt(language === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
            if (!reason) return;

            setProcessing((prev) => new Set(prev).add(id));
            try {
                await onReject(id, reason);
                setApprovals((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
                console.error('Failed to reject:', err);
            } finally {
                setProcessing((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        },
        [onReject, language],
    );

    // Filter approvals
    const filteredApprovals = approvals.filter((approval) => {
        if (filterStatus === 'ALL') return true;
        return approval.status === filterStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Filters */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                    {language === 'ar' ? 'الموافقات المعلقة' : 'Pending Approvals'}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            filterStatus === 'ALL'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                        )}
                    >
                        {language === 'ar' ? 'الكل' : 'All'}
                    </button>
                    <button
                        onClick={() => setFilterStatus('PENDING')}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            filterStatus === 'PENDING'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                        )}
                    >
                        {language === 'ar' ? 'معلق' : 'Pending'}
                    </button>
                    <button
                        onClick={() => setFilterStatus('IN_TRANSIT')}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            filterStatus === 'IN_TRANSIT'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                        )}
                    >
                        {language === 'ar' ? 'قيد النقل' : 'In Transit'}
                    </button>
                </div>
            </div>

            {/* Approvals List */}
            {filteredApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <CheckCircle className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">
                        {language === 'ar' ? 'لا توجد موافقات معلقة' : 'No pending approvals'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredApprovals.map((approval) => {
                        const isProcessing = processing.has(approval.id);

                        return (
                            <motion.div
                                key={approval.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Type Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className={cn(
                                                    'px-2 py-1 rounded text-xs font-medium',
                                                    approval.type === 'TRANSFER'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-amber-500/20 text-amber-400',
                                                )}
                                            >
                                                {approval.type === 'TRANSFER'
                                                    ? (language === 'ar' ? 'نقل' : 'TRANSFER')
                                                    : (language === 'ar' ? 'حركة' : 'MOVEMENT')}
                                            </span>
                                            <span
                                                className={cn(
                                                    'px-2 py-1 rounded text-xs font-medium',
                                                    approval.status === 'PENDING'
                                                        ? 'bg-amber-500/20 text-amber-400'
                                                        : 'bg-blue-500/20 text-blue-400',
                                                )}
                                            >
                                                {approval.status}
                                            </span>
                                        </div>

                                        {/* Details */}
                                        {approval.type === 'TRANSFER' && (
                                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                                <Warehouse className="w-4 h-4" />
                                                <span>
                                                    {approval.fromWarehouse} {language === 'ar' ? '←' : '→'}{' '}
                                                    {approval.toWarehouse}
                                                </span>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div className="text-sm text-slate-300 mb-2">
                                            {approval.items.map((item, index) => (
                                                <div key={index}>
                                                    • {item.productName} ({item.quantity} {item.unit})
                                                </div>
                                            ))}
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>{approval.requestedBy}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {new Date(approval.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {approval.notes && (
                                            <div className="mt-2 p-2 bg-slate-700/30 rounded text-xs text-slate-400">
                                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                                {approval.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleApprove(approval.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                'p-2 rounded-lg transition-colors',
                                                'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
                                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                            )}
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(approval.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                'p-2 rounded-lg transition-colors',
                                                'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                            )}
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PendingApprovalsList;

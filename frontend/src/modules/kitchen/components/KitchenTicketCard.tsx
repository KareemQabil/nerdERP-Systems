/**
 * KitchenTicketCard Component
 *
 * Displays a single kitchen ticket with its items
 * Allows updating item status (PENDING → PREPARING → READY)
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, ChefHat, Utensils, Printer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KitchenTicketWithId, KitchenStatus, KitchenTicketItem } from '@/stores/kitchen.store';
import { usePrintReceipt } from '@/modules/pos/components/printing/hooks/usePrintReceipt';
import type { KitchenTicketData } from '@/modules/pos/components/printing/KitchenTicketTemplate';

// =============================================================================
// TYPES
// =============================================================================

interface KitchenTicketCardProps {
    ticket: KitchenTicketWithId;
    onUpdateStatus: (itemId: string, status: KitchenStatus) => void;
    onBump?: (ticketId: string) => void;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<
    KitchenStatus,
    { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
    PENDING: {
        label: 'Pending',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
        icon: Clock,
    },
    PREPARING: {
        label: 'Preparing',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30',
        icon: ChefHat,
    },
    READY: {
        label: 'Ready',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500/30',
        icon: Check,
    },
    SERVED: {
        label: 'Served',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20 border-gray-500/30',
        icon: Utensils,
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function KitchenTicketCard({ ticket, onUpdateStatus, onBump }: KitchenTicketCardProps) {
    const { printReceipt, isPrinting } = usePrintReceipt({ format: 'KITCHEN_TICKET' });

    // Calculate ticket age
    const ticketAge = Math.floor(
        (Date.now() - new Date(ticket.firedAt).getTime()) / 60000
    ); // minutes

    // Handle status click (cycle through statuses)
    const handleStatusClick = (itemId: string, currentStatus: KitchenStatus) => {
        let nextStatus: KitchenStatus;
        switch (currentStatus) {
            case 'PENDING':
                nextStatus = 'PREPARING';
                break;
            case 'PREPARING':
                nextStatus = 'READY';
                break;
            case 'READY':
                nextStatus = 'SERVED';
                break;
            default:
                nextStatus = 'PREPARING';
        }
        onUpdateStatus(itemId, nextStatus);
    };

    // Handle print
    const handlePrint = async () => {
        const ticketData: KitchenTicketData = {
            orderNumber: `#${ticket.orderId.slice(-6)}`,
            tableNumber: ticket.tableNumber,
            station: 'KITCHEN',
            priority: false,
            timestamp: new Date(ticket.firedAt).toLocaleTimeString(),
            items: ticket.items.map((item: KitchenTicketItem) => ({
                name: item.name,
                quantity: item.quantity,
                notes: item.notes,
                modifiers: item.modifiers?.map((m: { name: string; quantity: number }) => m.name) || []
            }))
        };

        try {
            await printReceipt(ticketData as any);
        } catch (error) {
            console.error('Print failed:', error);
        }
    };

    // Check if all items are ready/served
    const allComplete = ticket.items.every(
        (item: KitchenTicketItem) => item.status === 'READY' || item.status === 'SERVED'
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                'rounded-xl border-2 overflow-hidden',
                allComplete
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-slate-700/50 bg-slate-800/50',
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    'p-4 border-b flex items-center justify-between',
                    'border-slate-700/50',
                )}
            >
                <div className="flex items-center gap-4">
                    {/* Order Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">
                                {ticket.orderType}
                            </span>
                            {ticket.tableNumber && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-sm text-slate-300">
                                    Table {ticket.tableNumber}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-slate-400">
                            Order #{ticket.orderId.slice(-6)}
                        </div>
                    </div>

                    {/* Ticket Age */}
                    <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg',
                        ticketAge > 15 ? 'bg-red-500/20 text-red-400' :
                            ticketAge > 10 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-slate-700 text-slate-300'
                    )}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{ticketAge}m</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                        disabled={isPrinting}
                        title="Print Ticket"
                    >
                        {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    </button>

                    {onBump && allComplete && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onBump(ticket.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium"
                        >
                            Bump
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-2">
                {ticket.items.map((item: KitchenTicketItem) => {
                    const StatusIcon = STATUS_CONFIG[item.status].icon;
                    return (
                        <motion.div
                            key={item.id}
                            layout
                            className={cn(
                                'p-3 rounded-lg border cursor-pointer transition-all',
                                STATUS_CONFIG[item.status].bgColor,
                                'border-transparent',
                            )}
                            onClick={() => handleStatusClick(item.id, item.status)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                {/* Item Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-white">
                                            {item.quantity}x
                                        </span>
                                        <span className="font-medium text-white">
                                            {item.name}
                                        </span>
                                    </div>

                                    {/* Modifiers */}
                                    {item.modifiers && item.modifiers.length > 0 && (
                                        <div className="mt-1 text-sm text-slate-400">
                                            {item.modifiers.map((mod: { name: string; quantity: number }, i: number) => (
                                                <span key={i} className="mr-2">
                                                    + {mod.name}
                                                    {mod.quantity > 1 && ` (${mod.quantity})`}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {item.notes && (
                                        <div className="mt-1 text-sm text-yellow-400 italic">
                                            "{item.notes}"
                                        </div>
                                    )}

                                    {/* Station Badge */}
                                    <div className="mt-2">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-300">
                                            {item.station.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg border-2',
                                        STATUS_CONFIG[item.status].color,
                                        'border-current',
                                    )}
                                >
                                    <StatusIcon className="w-5 h-5" />
                                    <span className="text-sm font-bold">
                                        {STATUS_CONFIG[item.status].label}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer - Timestamp */}
            <div
                className={cn(
                    'px-4 py-2 border-t text-xs text-slate-500',
                    'border-slate-700/50',
                )}
            >
                Fired: {new Date(ticket.firedAt).toLocaleTimeString()}
            </div>
        </motion.div>
    );
}

export default KitchenTicketCard;

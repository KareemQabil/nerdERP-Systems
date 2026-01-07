/**
 * KDS Page - Kitchen Display System
 *
 * Main kitchen screen for displaying and managing orders
 * Shows tickets by station with real-time updates
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ChefHat, Snowflake, Glasses, Cookie, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useKitchenStore } from '@/stores/kitchen.store';
import { useKitchenSocket } from '@/hooks/useKitchenSocket';
import { kitchenService } from '@/services/kitchen.service';
import type { KitchenStation, KitchenStatus } from '@/lib/kitchen-socket';
import { KitchenTicketCard } from '../components/KitchenTicketCard';
import { cn } from '@/lib/utils';

// =============================================================================
// STATION CONFIG
// =============================================================================

const STATIONS: Array<{
    id: KitchenStation;
    label: string;
    labelAr: string;
    icon: typeof ChefHat;
    color: string;
}> = [
        {
            id: 'ALL',
            label: 'All Stations',
            labelAr: 'جميع المحطات',
            icon: ChefHat,
            color: 'from-slate-500 to-slate-600',
        },
        {
            id: 'HOT_KITCHEN',
            label: 'Hot Kitchen',
            labelAr: 'المطبخ الساخن',
            icon: Flame,
            color: 'from-orange-500 to-red-600',
        },
        {
            id: 'COLD_KITCHEN',
            label: 'Cold Kitchen',
            labelAr: 'المطبخ البارد',
            icon: Snowflake,
            color: 'from-blue-500 to-cyan-600',
        },
        {
            id: 'BAR',
            label: 'Bar',
            labelAr: 'البار',
            icon: Glasses,
            color: 'from-purple-500 to-pink-600',
        },
        {
            id: 'DESSERT',
            label: 'Dessert',
            labelAr: 'الحلويات',
            icon: Cookie,
            color: 'from-amber-500 to-yellow-600',
        },
    ];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface KDSPageProps {
    embedded?: boolean;
}

export default function KDSPage({ embedded = false }: KDSPageProps) {
    const { t, i18n } = useTranslation();
    const { theme } = useSettingsStore();
    const language = i18n.language;

    // Store state
    const {
        tickets,
        selectedStation,
        isConnected,
        setSelectedStation,
        addTicket,
        updateItemStatus,
        removeTicket,
        getTicketsByStation,
        getPendingCount,
        getPreparingCount,
        getReadyCount,
    } = useKitchenStore();

    // WebSocket connection
    useKitchenSocket({
        autoConnect: true,
        onTicketCreated: (event) => {
            // Add ticket to store
            addTicket({
                id: event.ticketId,
                orderId: event.orderId,
                orderType: event.orderType,
                tableNumber: event.tableNumber,
                items: event.items,
                createdAt: event.createdAt,
                firedAt: event.firedAt,
            });

            // Show notification sound (optional)
            playNotificationSound();
        },
        onItemUpdated: (event) => {
            updateItemStatus(event.ticketId, event.itemId, event.status);
        },
        onConnected: () => {
            console.log('[KDS] Connected to kitchen WebSocket');
        },
        onDisconnected: () => {
            console.log('[KDS] Disconnected from kitchen WebSocket');
        },
    });

    // Play notification sound
    const playNotificationSound = () => {
        // You can add a sound here if needed
        const audio = new Audio('/sounds/kitchen-bell.mp3');
        audio.play().catch(() => {
            // Ignore if audio not available or blocked
        });
    };

    // Handle item status update
    const handleUpdateStatus = async (itemId: string, status: KitchenStatus) => {
        // Update local state immediately for responsiveness
        const ticket = tickets.find((t) => t.items.some((item) => item.id === itemId));
        if (ticket) {
            updateItemStatus(ticket.id, itemId, status);

            // Send to server
            try {
                await kitchenService.updateItemStatus({
                    ticketId: ticket.id,
                    itemId,
                    status,
                });
            } catch (error) {
                console.error('[KDS] Failed to update item status:', error);
                // Revert on error
                const originalStatus = ticket.items.find((i) => i.id === itemId)?.status;
                if (originalStatus) {
                    updateItemStatus(ticket.id, itemId, originalStatus);
                }
            }
        }
    };

    // Handle ticket bump (remove completed tickets)
    const handleBumpTicket = (ticketId: string) => {
        removeTicket(ticketId);
    };

    // Filter tickets by selected station
    const filteredTickets = getTicketsByStation(selectedStation);

    // Calculate counts
    const pendingCount = getPendingCount(selectedStation);
    const preparingCount = getPreparingCount(selectedStation);
    const readyCount = getReadyCount(selectedStation);

    // Content component (extracted for embedded mode)
    const KDSContent = (
        <>
            {/* Header */}
            <header
                className={cn(
                    'sticky top-0 z-10 border-b backdrop-blur-xl',
                    'bg-slate-900/80 border-slate-700/50',
                )}
            >
                <div className="flex items-center justify-between px-6 py-4">
                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <ChefHat className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Kitchen Display System
                            </h1>
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'w-2 h-2 rounded-full',
                                        isConnected ? 'bg-green-500' : 'bg-red-500',
                                    )}
                                />
                                <span className="text-sm text-slate-400">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>

                            {/* Test Mode Ticket Injection Button */}
                            <button
                                data-testid="inject-test-ticket"
                                onClick={() => {
                                    const now = new Date();
                                    addTicket({
                                        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        orderId: `test-order-${Date.now()}`,
                                        orderType: 'DINE_IN',
                                        tableNumber: `T-${Math.floor(Math.random() * 20) + 1}`,
                                        items: [
                                            {
                                                id: `item-${Date.now()}-1`,
                                                name: 'Test Burger',
                                                quantity: 2,
                                                status: 'PENDING',
                                                notes: 'Medium rare, no onions',
                                                station: 'HOT_KITCHEN',
                                                elapsedTime: 0,
                                            },
                                            {
                                                id: `item-${Date.now()}-2`,
                                                name: 'Test Fries',
                                                quantity: 1,
                                                status: 'PENDING',
                                                notes: '',
                                                station: 'HOT_KITCHEN',
                                                elapsedTime: 0,
                                            },
                                        ],
                                        createdAt: now,
                                        firedAt: now,
                                        station: 'HOT_KITCHEN',
                                    });
                                    playNotificationSound();
                                }}
                                className="ml-4 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/20"
                                title="Inject a test ticket for demonstration or testing purposes"
                            >
                                + Test Ticket
                            </button>
                        </div>
                    </div>

                    {/* Counts */}
                    <div className="flex items-center gap-4">
                        <div data-testid="kds-pending-count" className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                            <span className="text-yellow-400 font-bold">{pendingCount}</span>
                            <span className="text-yellow-400 text-sm ml-2">Pending</span>
                        </div>
                        <div data-testid="kds-preparing-count" className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                            <span className="text-blue-400 font-bold">{preparingCount}</span>
                            <span className="text-blue-400 text-sm ml-2">Preparing</span>
                        </div>
                        <div data-testid="kds-ready-count" className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                            <span className="text-green-400 font-bold">{readyCount}</span>
                            <span className="text-green-400 text-sm ml-2">Ready</span>
                        </div>
                    </div>
                </div>

                {/* Station Selector */}
                <div className="px-6 pb-4">
                    <div className="flex gap-2">
                        {STATIONS.map((station) => {
                            const Icon = station.icon;
                            const isSelected = selectedStation === station.id;
                            const count = getPendingCount(station.id);

                            return (
                                <motion.button
                                    key={station.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedStation(station.id)}
                                    data-testid={`kds-station-${station.id.toLowerCase()}`}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all',
                                        isSelected
                                            ? `bg-gradient-to-r ${station.color} border-transparent text-white`
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600',
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">
                                        {language === 'ar' ? station.labelAr : station.label}
                                    </span>
                                    {count > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">
                                            {count}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Content - Tickets Grid */}
            <main className="p-6">
                <AnimatePresence mode="popLayout">
                    {filteredTickets.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-96 text-slate-500"
                        >
                            <Bell className="w-16 h-16 mb-4" />
                            <p className="text-xl font-medium">{t('kitchen.noPendingOrders', 'No pending orders')}</p>
                            <p className="text-sm mt-2">{t('kitchen.ordersWillAppear', 'New orders will appear here automatically')}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tickets"
                            layout
                            data-testid="kds-tickets-grid"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            {filteredTickets.map((ticket) => (
                                <KitchenTicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    onUpdateStatus={handleUpdateStatus}
                                    onBump={handleBumpTicket}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );

    return embedded ? (
        KDSContent
    ) : (
        <div className="min-h-screen bg-slate-900" data-testid="kds-page" data-theme={theme}>
            {KDSContent}
        </div>
    );
}


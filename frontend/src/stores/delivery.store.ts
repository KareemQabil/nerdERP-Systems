/**
 * Delivery Store
 * Zustand store for delivery dashboard state management
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { deliveryService, type DashboardData, type DeliveryDriver, type DeliveryOrder } from '@/services/delivery.service';

// =============================================================================
// Mock Data (for fallback/demo mode)
// =============================================================================

const MOCK_DRIVERS: DeliveryDriver[] = [
    { id: 'driver-1', name: 'Ahmed Ali', phone: '+966501234567', status: 'AVAILABLE', activeOrdersCount: 0, completedTodayCount: 5 },
    { id: 'driver-2', name: 'Mohammed Hassan', phone: '+966507654321', status: 'BUSY', activeOrdersCount: 2, completedTodayCount: 8 },
    { id: 'driver-3', name: 'Kareem Ibrahim', phone: '+966509876543', status: 'AVAILABLE', activeOrdersCount: 0, completedTodayCount: 3 },
];

const MOCK_DASHBOARD: DashboardData = {
    summary: {
        totalPendingOrders: 3,
        totalAssignedOrders: 2,
        totalOutForDelivery: 1,
        totalReadyForPickup: 0,
        totalActiveOrders: 6,
        availableDrivers: 2,
        busyDrivers: 1,
        totalDrivers: 3,
        avgDeliveryTimeMinutes: 25,
        onTimeDeliveryPercentage: 92.5,
    },
    pendingOrders: [
        {
            id: 'del-1',
            orderNumber: 'ORD-2024-001',
            orderType: 'DELIVERY',
            status: 'PENDING',
            orderTotal: 150,
            deliveryFee: 20,
            customerName: 'John Doe',
            customerPhone: '+966501111111',
            deliveryAddress: {
                lat: 24.7136,
                lng: 46.6753,
                address: 'Riyadh, Olaya St, Building 123',
            },
            zoneId: 'zone-1',
            zoneCode: 'NORTH',
            zoneName: 'North Riyadh',
            createdAt: new Date().toISOString(),
            estimatedDeliveryMinutes: 30,
            isRushOrder: false,
            timeInStatus: 5,
        },
        {
            id: 'del-2',
            orderNumber: 'ORD-2024-002',
            orderType: 'DELIVERY',
            status: 'PENDING',
            orderTotal: 85,
            deliveryFee: 15,
            customerName: 'Sarah Smith',
            customerPhone: '+966502222222',
            deliveryAddress: {
                lat: 24.7236,
                lng: 46.6853,
                address: 'Riyadh, King Fahd Rd, Tower A',
            },
            zoneId: 'zone-2',
            zoneCode: 'CENTRAL',
            zoneName: 'Central Riyadh',
            createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
            estimatedDeliveryMinutes: 25,
            isRushOrder: true,
            timeInStatus: 10,
        },
    ],
    assignedOrders: [
        {
            id: 'del-3',
            orderNumber: 'ORD-2024-003',
            orderType: 'DELIVERY',
            status: 'ASSIGNED',
            orderTotal: 200,
            deliveryFee: 25,
            customerName: 'Mike Johnson',
            customerPhone: '+966503333333',
            deliveryAddress: {
                lat: 24.7336,
                lng: 46.6953,
                address: 'Riyadh, Makkah Rd, Plaza 5',
            },
            zoneId: 'zone-1',
            zoneCode: 'NORTH',
            zoneName: 'North Riyadh',
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            estimatedDeliveryMinutes: 35,
            isRushOrder: false,
            driverInfo: {
                driverId: 'driver-2',
                driverName: 'Mohammed Hassan',
                driverPhone: '+966507654321',
                driverStatus: 'BUSY',
            },
            assignmentId: 'assign-1',
            timeInStatus: 5,
        },
    ],
    outForDeliveryOrders: [
        {
            id: 'del-4',
            orderNumber: 'ORD-2024-004',
            orderType: 'DELIVERY',
            status: 'OUT_FOR_DELIVERY',
            orderTotal: 120,
            deliveryFee: 20,
            customerName: 'Emily Davis',
            customerPhone: '+966504444444',
            deliveryAddress: {
                lat: 24.7436,
                lng: 46.7053,
                address: 'Riyadh, Olaya St, Tower 15',
            },
            zoneId: 'zone-2',
            zoneCode: 'CENTRAL',
            zoneName: 'Central Riyadh',
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
            estimatedDeliveryMinutes: 15,
            isRushOrder: false,
            driverInfo: {
                driverId: 'driver-2',
                driverName: 'Mohammed Hassan',
                driverPhone: '+966507654321',
                driverStatus: 'BUSY',
                currentLocation: {
                    lat: 24.7336,
                    lng: 46.6953,
                },
            },
            assignmentId: 'assign-2',
            timeInStatus: 10,
        },
    ],
    readyForPickupOrders: [],
    completedOrders: [],
    availableDrivers: MOCK_DRIVERS.filter((d) => d.status === 'AVAILABLE'),
    busyDrivers: MOCK_DRIVERS.filter((d) => d.status === 'BUSY'),
    offDutyDrivers: [],
    zoneStats: [],
};

// =============================================================================
// Types
// =============================================================================

interface DeliveryState {
    // Data
    dashboard: DashboardData | null;
    drivers: DeliveryDriver[];

    // Loading states
    isLoadingDashboard: boolean;
    isLoadingDrivers: boolean;

    // Errors
    error: string | null;

    // Actions
    fetchDashboard: (storeId: string) => Promise<void>;
    fetchDrivers: (storeId: string) => Promise<void>;
    assignDriver: (orderId: string, driverId: string) => Promise<void>;
    updateStatus: (params: { orderId: string; status: string }) => Promise<void>;

    clearError: () => void;
    reset: () => void;
}

type DeliveryStore = DeliveryState;

// =============================================================================
// Initial State
// =============================================================================

const initialState: Pick<
    DeliveryState,
    'dashboard' | 'drivers' | 'isLoadingDashboard' | 'isLoadingDrivers' | 'error'
> = {
    dashboard: null,
    drivers: [],
    isLoadingDashboard: false,
    isLoadingDrivers: false,
    error: null,
};

// =============================================================================
// Store
// =============================================================================

export const useDeliveryStore = create<DeliveryStore>()(
    devtools(
        (set, _get) => ({
            ...initialState,

            // =================================================================
            // Data Fetching
            // =================================================================

            fetchDashboard: async (storeId) => {
                set({ isLoadingDashboard: true, error: null });
                try {
                    const data = await deliveryService.getDashboard(storeId);
                    set({ dashboard: data, drivers: data.availableDrivers, isLoadingDashboard: false });
                } catch (error) {
                    console.warn('[Delivery] Failed to fetch dashboard, using mock data:', error);
                    set({ dashboard: MOCK_DASHBOARD, drivers: MOCK_DRIVERS, isLoadingDashboard: false });
                }
            },

            fetchDrivers: async (storeId) => {
                set({ isLoadingDrivers: true, error: null });
                try {
                    const data = await deliveryService.getDrivers(storeId);
                    set({ drivers: data, isLoadingDrivers: false });
                } catch (error) {
                    console.warn('[Delivery] Failed to fetch drivers, using mock data:', error);
                    set({ drivers: MOCK_DRIVERS, isLoadingDrivers: false });
                }
            },

            // =================================================================
            // Actions
            // =================================================================

            assignDriver: async (orderId, driverId) => {
                try {
                    await deliveryService.assignDriver(orderId, driverId);
                    // Refresh dashboard
                    const { dashboard } = _get();
                    if (dashboard) {
                        // Update local state immediately for optimistic UI
                        const pendingOrder = dashboard.pendingOrders.find((o) => o.id === orderId);
                        if (pendingOrder) {
                            const driver = MOCK_DRIVERS.find((d) => d.id === driverId);
                            if (driver) {
                                const updatedOrder = {
                                    ...pendingOrder,
                                    status: 'ASSIGNED',
                                    driverInfo: {
                                        driverId: driver.id,
                                        driverName: driver.name,
                                        driverPhone: driver.phone,
                                        driverStatus: driver.status,
                                    },
                                };
                                set({
                                    dashboard: {
                                        ...dashboard,
                                        pendingOrders: dashboard.pendingOrders.filter((o) => o.id !== orderId),
                                        assignedOrders: [...dashboard.assignedOrders, updatedOrder as any],
                                    },
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error('[Delivery] Failed to assign driver:', error);
                    set({ error: 'Failed to assign driver' });
                    throw error;
                }
            },

            updateStatus: async ({ orderId, status }) => {
                try {
                    await deliveryService.updateStatus({ orderId, status });
                    // Refresh dashboard to reflect changes
                    const storeId = 'default'; // Get from auth or config
                    const data = await deliveryService.getDashboard(storeId);
                    set({ dashboard: data });
                } catch (error) {
                    console.error('[Delivery] Failed to update status:', error);
                    set({ error: 'Failed to update status' });
                    throw error;
                }
            },

            // =================================================================
            // UI Actions
            // =================================================================

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'delivery-store' }
    )
);

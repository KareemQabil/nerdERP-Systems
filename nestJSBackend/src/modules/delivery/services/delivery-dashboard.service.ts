import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { SalesOrder, OrderStatus, OrderType } from '../../sales/entities/sales-order.entity';
import { DeliveryDriver, DriverStatus } from '../entities/delivery-driver.entity';
import { DeliveryAssignment, AssignmentStatus } from '../entities/delivery-assignment.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';

/**
 * =============================================================================
 * DELIVERY DASHBOARD SERVICE
 * =============================================================================
 *
 * Aggregates data for the delivery dashboard UI.
 *
 * Provides real-time view of:
 * - Orders by delivery status (pending, assigned, out for delivery, etc.)
 * - Driver availability and status
 * - Delivery zone statistics
 * - Summary metrics (active orders, available drivers, etc.)
 *
 * This service is used by the DeliveryDashboardController to provide
 * data to the frontend delivery dashboard.
 */
@Injectable()
export class DeliveryDashboardService {
    private readonly logger = new Logger(DeliveryDashboardService.name);

    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(DeliveryDriver)
        private readonly driverRepo: Repository<DeliveryDriver>,
        @InjectRepository(DeliveryAssignment)
        private readonly assignmentRepo: Repository<DeliveryAssignment>,
        @InjectRepository(DeliveryZone)
        private readonly zoneRepo: Repository<DeliveryZone>,
    ) { }

    /**
     * Get comprehensive dashboard data
     *
     * Returns all data needed for the delivery dashboard in a single call.
     */
    async getDashboardData(storeId: string): Promise<{
        summary: DashboardSummary;
        pendingOrders: DeliveryOrderCard[];
        assignedOrders: DeliveryOrderCard[];
        outForDeliveryOrders: DeliveryOrderCard[];
        readyForPickupOrders: DeliveryOrderCard[];
        completedOrders: DeliveryOrderCard[];
        availableDrivers: DriverCard[];
        busyDrivers: DriverCard[];
        offDutyDrivers: DriverCard[];
        zoneStats: ZoneStats[];
    }> {
        const [
            summary,
            pendingOrders,
            assignedOrders,
            outForDeliveryOrders,
            readyForPickupOrders,
            completedOrders,
            availableDrivers,
            busyDrivers,
            offDutyDrivers,
            zoneStats,
        ] = await Promise.all([
            this.getSummary(storeId),
            this.getOrdersByStatus(storeId, 'PENDING'),
            this.getOrdersByStatus(storeId, 'ASSIGNED'),
            this.getOrdersByStatus(storeId, 'OUT_FOR_DELIVERY'),
            this.getOrdersByStatus(storeId, 'READY'),
            this.getCompletedOrders(storeId, 20),
            this.getDriversByStatus(storeId, DriverStatus.AVAILABLE),
            this.getDriversByStatus(storeId, DriverStatus.BUSY),
            this.getDriversByStatus(storeId, DriverStatus.OFF_DUTY),
            this.getZoneStatistics(storeId),
        ]);

        return {
            summary,
            pendingOrders,
            assignedOrders,
            outForDeliveryOrders,
            readyForPickupOrders,
            completedOrders,
            availableDrivers,
            busyDrivers,
            offDutyDrivers,
            zoneStats,
        };
    }

    /**
     * Get dashboard summary statistics
     */
    async getSummary(storeId: string): Promise<DashboardSummary> {
        const [
            totalPending,
            totalAssigned,
            totalOutForDelivery,
            totalReady,
            availableDriversCount,
            busyDriversCount,
            totalDrivers,
        ] = await Promise.all([
            this.orderRepo.count({
                where: {
                    orderType: OrderType.DELIVERY,
                    status: OrderStatus.SAVED, // Use status for pending  
                },
            }),
            this.assignmentRepo.count({
                where: {
                    storeId,
                    status: AssignmentStatus.ASSIGNED,
                },
            }),
            this.assignmentRepo.count({
                where: {
                    storeId,
                    status: AssignmentStatus.OUT_FOR_DELIVERY,
                },
            }),
            this.assignmentRepo.count({
                where: {
                    storeId,
                    status: In([AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP]),
                },
            }),
            this.driverRepo.count({
                where: {
                    storeId,
                    status: DriverStatus.AVAILABLE,
                    isActive: true,
                },
            }),
            this.driverRepo.count({
                where: {
                    storeId,
                    status: DriverStatus.BUSY,
                    isActive: true,
                },
            }),
            this.driverRepo.count({
                where: {
                    storeId,
                    isActive: true,
                },
            }),
        ]);

        // Calculate average delivery time (from completed assignments today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const completedAssignments = await this.assignmentRepo.find({
            where: {
                storeId,
                status: AssignmentStatus.COMPLETED,
                completedAt: todayStart as any,
            },
            take: 100,
        });

        const avgDeliveryTime = completedAssignments.length > 0
            ? completedAssignments.reduce((sum, a) => sum + a.getDuration(), 0) / completedAssignments.length
            : 0;

        // Calculate on-time delivery percentage
        const onTimeDeliveries = completedAssignments.filter(a => !a.isLate()).length;
        const onTimePercentage = completedAssignments.length > 0
            ? (onTimeDeliveries / completedAssignments.length) * 100
            : 100;

        return {
            totalPendingOrders: totalPending,
            totalAssignedOrders: totalAssigned,
            totalOutForDelivery: totalOutForDelivery,
            totalReadyForPickup: totalReady,
            totalActiveOrders: totalPending + totalAssigned + totalOutForDelivery + totalReady,
            availableDrivers: availableDriversCount,
            busyDrivers: busyDriversCount,
            totalDrivers,
            avgDeliveryTimeMinutes: Math.round(avgDeliveryTime),
            onTimeDeliveryPercentage: Math.round(onTimePercentage * 10) / 10,
        };
    }

    /**
     * Get orders grouped by delivery status
     */
    async getOrdersByStatus(
        storeId: string,
        status: string,
    ): Promise<DeliveryOrderCard[]> {
        const statusMap: Record<string, AssignmentStatus[]> = {
            'ASSIGNED': [AssignmentStatus.ASSIGNED],
            'READY': [AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP],
            'OUT_FOR_DELIVERY': [AssignmentStatus.OUT_FOR_DELIVERY],
        };

        if (status === 'PENDING') {
            // Get pending orders (not yet assigned)
            const orders = await this.orderRepo.find({
                where: {
                    orderType: OrderType.DELIVERY,
                    status: In([OrderStatus.SAVED, OrderStatus.PAID]),
                },
                relations: ['table'],
                order: { createdAt: 'ASC' },
            });

            return await Promise.all(
                orders.map(order => this.mapOrderToCard(order, null))
            );
        } else {
            // Get assigned orders by assignment status
            const assignmentStatuses = statusMap[status] || [AssignmentStatus.ASSIGNED];
            const assignments = await this.assignmentRepo.find({
                where: {
                    storeId,
                    status: In(assignmentStatuses),
                },
                relations: ['order'],
                order: { assignedAt: 'ASC' },
            });

            const cards: DeliveryOrderCard[] = [];
            for (const assignment of assignments) {
                const order = await this.orderRepo.findOne({
                    where: { id: assignment.orderId },
                    relations: ['table'],
                });
                if (order) {
                    cards.push(await this.mapOrderToCard(order, assignment));
                }
            }

            return cards;
        }
    }

    /**
     * Get recently completed orders
     */
    async getCompletedOrders(storeId: string, limit: number = 20): Promise<DeliveryOrderCard[]> {
        const assignments = await this.assignmentRepo.find({
            where: {
                storeId,
                status: AssignmentStatus.COMPLETED,
            },
            relations: ['order'],
            order: { completedAt: 'DESC' },
            take: limit,
        });

        const cards: DeliveryOrderCard[] = [];
        for (const assignment of assignments) {
            const order = await this.orderRepo.findOne({
                where: { id: assignment.orderId },
                relations: ['table'],
            });
            if (order) {
                cards.push(await this.mapOrderToCard(order, assignment));
            }
        }

        return cards;
    }

    /**
     * Get drivers by status
     */
    async getDriversByStatus(
        storeId: string,
        status: DriverStatus,
    ): Promise<DriverCard[]> {
        const drivers = await this.driverRepo.find({
            where: {
                storeId,
                status,
                isActive: true,
            },
            order: { driverName: 'ASC' },
        });

        return await Promise.all(
            drivers.map(driver => this.mapDriverToCard(driver))
        );
    }

    /**
     * Get delivery zone statistics
     */
    async getZoneStatistics(storeId: string): Promise<ZoneStats[]> {
        const zones = await this.zoneRepo.find({
            where: {
                storeId,
                isActive: true,
            },
            order: { displayOrder: 'ASC' },
        });

        const stats: ZoneStats[] = [];

        for (const zone of zones) {
            // Get active orders for this zone
            const activeAssignments = await this.assignmentRepo.find({
                where: {
                    zoneId: zone.id,
                    status: In([
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.PICKED_UP,
                        AssignmentStatus.OUT_FOR_DELIVERY,
                    ]),
                },
            });

            // Get completed orders today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const completedToday = await this.assignmentRepo.count({
                where: {
                    zoneId: zone.id,
                    status: AssignmentStatus.COMPLETED,
                    completedAt: todayStart as any,
                },
            });

            stats.push({
                zoneId: zone.id,
                zoneCode: zone.zoneCode,
                zoneName: zone.zoneName,
                deliveryFee: parseFloat(zone.deliveryFee.toString()),
                estimatedMinutes: zone.estimatedDeliveryMinutes || 30,
                activeOrders: activeAssignments.length,
                completedToday,
                availableDrivers: 0, // Will be calculated
            });
        }

        return stats;
    }

    /**
     * Search orders by order number
     */
    async searchOrders(storeId: string, query: string): Promise<DeliveryOrderCard[]> {
        const orders = await this.orderRepo.find({
            where: {
                orderType: OrderType.DELIVERY,
                orderNumber: Like(`%${query}%`),
            },
            relations: ['table'],
            take: 20,
        });

        const cards: DeliveryOrderCard[] = [];
        for (const order of orders) {
            const assignment = await this.assignmentRepo.findOne({
                where: {
                    orderId: order.id,
                    status: In([
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.PICKED_UP,
                        AssignmentStatus.OUT_FOR_DELIVERY,
                    ]),
                },
            });
            cards.push(await this.mapOrderToCard(order, assignment));
        }

        return cards;
    }

    // =========================================================================
    // MAPPING HELPERS
    // =========================================================================

    /**
     * Map order to delivery order card format
     */
    private async mapOrderToCard(
        order: SalesOrder,
        assignment: DeliveryAssignment | null,
    ): Promise<DeliveryOrderCard> {
        let zone: DeliveryZone | null = null;
        let zoneName = '';
        let zoneCode = '';
        let deliveryFee = 0;

        if (order.deliveryZoneId) {
            zone = await this.zoneRepo.findOne({ where: { id: order.deliveryZoneId } });
            if (zone) {
                zoneName = zone.zoneName;
                zoneCode = zone.zoneCode;
                deliveryFee = parseFloat(zone.deliveryFee.toString());
            }
        }

        let driverInfo: typeof returnValue.driverInfo = undefined;
        if (assignment?.driverId) {
            const driver = await this.driverRepo.findOne({ where: { id: assignment.driverId } });
            if (driver) {
                driverInfo = {
                    driverId: driver.id,
                    driverName: driver.driverName,
                    driverPhone: driver.phoneNumber,
                    driverStatus: driver.status,
                    currentLocation: driver.currentLocation ? {
                        lat: driver.currentLocation.lat,
                        lng: driver.currentLocation.lng,
                        address: undefined, // DriverLocation doesn't have address
                    } : undefined,
                };
            }
        }

        const returnValue: DeliveryOrderCard = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            status: assignment?.status || 'PENDING',
            orderTotal: order.totalNet,
            deliveryFee,
            customerName: order.metadata?.customerName || 'Walk-in',
            customerPhone: order.metadata?.customerPhone,
            deliveryAddress: order.deliveryAddress?.coordinates ? {
                lat: order.deliveryAddress.coordinates.lat,
                lng: order.deliveryAddress.coordinates.lng,
                address: `${order.deliveryAddress.building}, ${order.deliveryAddress.street}`,
            } : undefined,
            zoneId: order.deliveryZoneId,
            zoneCode,
            zoneName,
            createdAt: order.createdAt,
            estimatedDeliveryMinutes: zone?.estimatedDeliveryMinutes || 30,
            isRushOrder: order.tags?.includes('rush_order') || false,
            driverInfo,
            assignmentId: assignment?.id,
            timeInStatus: assignment?.assignedAt
                ? Math.floor((Date.now() - assignment.assignedAt.getTime()) / 60000)
                : Math.floor((Date.now() - order.createdAt.getTime()) / 60000),
        };

        return returnValue;
    }

    /**
     * Map driver to driver card format
     */
    private async mapDriverToCard(driver: DeliveryDriver): Promise<DriverCard> {
        // Get active assignments
        const assignments = await this.assignmentRepo.find({
            where: {
                driverId: driver.id,
                status: In([
                    AssignmentStatus.ASSIGNED,
                    AssignmentStatus.ACCEPTED,
                    AssignmentStatus.PICKED_UP,
                    AssignmentStatus.OUT_FOR_DELIVERY,
                ]),
            },
            take: 5,
        });

        const activeOrders = assignments.map(a => ({
            orderId: a.orderId,
            orderNumber: a.orderNumber,
            status: a.status,
            assignedAt: a.assignedAt,
            zoneCode: a.zoneCode,
        }));

        return {
            driverId: driver.id,
            driverName: driver.driverName,
            driverPhone: driver.phoneNumber,
            status: driver.status,
            currentLocation: driver.currentLocation ? {
                lat: driver.currentLocation.lat,
                lng: driver.currentLocation.lng,
                address: undefined,
                lastUpdate: driver.currentLocation.updatedAt,
            } : undefined,
            maxConcurrentOrders: driver.maxConcurrentOrders,
            currentOrdersCount: driver.currentOrderCount,
            activeOrders,
            metrics: driver.metrics ? {
                totalDeliveries: driver.metrics.totalDeliveries || 0,
                completedDeliveries: driver.metrics.onTimeDeliveries || 0,
                avgDeliveryTime: driver.metrics.averageDeliveryTime || 0,
                onTimeRate: driver.metrics.totalDeliveries > 0
                    ? (driver.metrics.onTimeDeliveries / driver.metrics.totalDeliveries) * 100
                    : 0,
            } : {
                totalDeliveries: 0,
                completedDeliveries: 0,
                avgDeliveryTime: 0,
                onTimeRate: 0,
            },
        };
    }
}

// =============================================================================
// DASHBOARD DATA TYPES
// =============================================================================

export interface DashboardSummary {
    totalPendingOrders: number;
    totalAssignedOrders: number;
    totalOutForDelivery: number;
    totalReadyForPickup: number;
    totalActiveOrders: number;
    availableDrivers: number;
    busyDrivers: number;
    totalDrivers: number;
    avgDeliveryTimeMinutes: number;
    onTimeDeliveryPercentage: number;
}

export interface DeliveryOrderCard {
    orderId: string;
    orderNumber: string;
    orderType: OrderType;
    status: string;
    orderTotal: number;
    deliveryFee: number;
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: {
        lat: number;
        lng: number;
        address: string;
    };
    zoneId?: string;
    zoneCode: string;
    zoneName: string;
    createdAt: Date;
    estimatedDeliveryMinutes: number;
    isRushOrder: boolean;
    driverInfo?: {
        driverId: string;
        driverName: string;
        driverPhone?: string;
        driverStatus: DriverStatus;
        currentLocation?: {
            lat: number;
            lng: number;
            address?: string;
        };
    };
    assignmentId?: string;
    timeInStatus: number; // Minutes since entered current status
}

export interface DriverCard {
    driverId: string;
    driverName: string;
    driverPhone?: string;
    status: DriverStatus;
    currentLocation?: {
        lat: number;
        lng: number;
        address?: string;
        lastUpdate: Date;
    };
    maxConcurrentOrders: number;
    currentOrdersCount: number;
    activeOrders: Array<{
        orderId: string;
        orderNumber: string;
        status: AssignmentStatus;
        assignedAt: Date;
        zoneCode: string;
    }>;
    metrics: {
        totalDeliveries: number;
        completedDeliveries: number;
        avgDeliveryTime: number;
        onTimeRate: number;
    };
}

export interface ZoneStats {
    zoneId: string;
    zoneCode: string;
    zoneName: string;
    deliveryFee: number;
    estimatedMinutes: number;
    activeOrders: number;
    completedToday: number;
    availableDrivers: number;
}

import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SalesOrder, OrderStatus, OrderType } from '../../sales/entities/sales-order.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { DeliveryDriver, DriverStatus } from '../entities/delivery-driver.entity';
import { DeliveryAssignment, AssignmentStatus, DeclineReason, PaymentCollection, TripData } from '../entities/delivery-assignment.entity';
import { OrderStateMachineService } from '../../sales/services/order-state-machine.service';
import { User } from '../../users/entities/user.entity';
import { DeliveryGateway } from '../delivery.gateway';

/**
 * =============================================================================
 * DELIVERY SERVICE TYPES
 * =============================================================================
 */

export enum DeliveryStatus {
    PENDING = 'PENDING',           // Order created, awaiting kitchen
    ASSIGNED = 'ASSIGNED',         // Driver assigned
    PREPARING = 'PREPARING',       // Kitchen preparing
    READY = 'READY',               // Order ready, awaiting pickup
    PICKED_UP = 'PICKED_UP',       // Driver picked up
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',  // Driver en route
    DELIVERED = 'DELIVERED',       // Order delivered
    FAILED = 'FAILED',             // Delivery failed
    CANCELLED = 'CANCELLED',       // Order cancelled
}

export interface DeliveryFeeCalculation {
    baseFee: number;
    distanceFee?: number;
    peakSurcharge: number;
    totalFee: number;
    estimatedMinutes: number;
    isFreeDelivery: boolean;
    freeDeliveryThreshold?: number;
}

export interface DriverAssignmentParams {
    orderId: string;
    driverId: string;
    assignedBy: User;
    priorityLevel?: number;
    notes?: string;
}

export interface DeliveryStatusUpdate {
    orderId: string;
    status: DeliveryStatus | AssignmentStatus;
    updatedBy: User;
    location?: { lat: number; lng: number };
    notes?: string;
    deliveryProof?: {
        photoUrl?: string;
        signatureUrl?: string;
        deliveredToPerson?: string;
        customerNote?: string;
    };
    paymentCollection?: PaymentCollection;
}

export interface AutoAssignmentResult {
    success: boolean;
    driver?: DeliveryDriver;
    reason?: string;
}

/**
 * =============================================================================
 * DELIVERY SERVICE
 * =============================================================================
 *
 * Comprehensive delivery management service handling:
 * - Driver assignment (automatic and manual)
 * - Delivery status tracking and updates
 * - Delivery fee calculation with peak hours
 * - Capacity management for drivers
 * - Real-time delivery dashboard data
 *
 * Workflow:
 * 1. Order created (DELIVERY type) → calculateDeliveryFee()
 * 2. Order ready for delivery → assignDriver() or autoAssignDriver()
 * 3. Driver accepts assignment → updateDeliveryStatus(ASSIGNED)
 * 4. Kitchen completes → updateDeliveryStatus(READY)
 * 5. Driver picks up → updateDeliveryStatus(PICKED_UP)
 * 6. Driver delivers → updateDeliveryStatus(DELIVERED) with proof
 * 7. COD payment → recordPaymentCollection()
 *
 * Configuration stored in StoreConfiguration with key 'delivery.zone_config'
 *
 * @example
 * // Calculate fee
 * const fee = await deliveryService.calculateDeliveryFee({
 *   zoneId: 'zone-uuid',
 *   orderTotal: 150,
 *   orderDate: new Date(),
 * });
 *
 * // Assign driver
 * await deliveryService.assignDriver({
 *   orderId: 'order-uuid',
 *   driverId: 'driver-uuid',
 *   assignedBy: managerUser,
 * });
 */
@Injectable()
export class DeliveryService {
    private readonly logger = new Logger(DeliveryService.name);

    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(DeliveryZone)
        private readonly zoneRepo: Repository<DeliveryZone>,
        @InjectRepository(DeliveryDriver)
        private readonly driverRepo: Repository<DeliveryDriver>,
        @InjectRepository(DeliveryAssignment)
        private readonly assignmentRepo: Repository<DeliveryAssignment>,
        private readonly dataSource: DataSource,
        private readonly stateMachineService: OrderStateMachineService,
        // TODO: Inject actual StoreConfigurationService when available
        // private readonly storeConfigService: StoreConfigurationService,
        @Inject(forwardRef(() => DeliveryGateway))
        private readonly deliveryGateway: DeliveryGateway,
    ) { }

    // =========================================================================
    // DELIVERY FEE CALCULATION
    // =========================================================================

    /**
     * Calculate delivery fee based on zone, order total, and time
     *
     * Factors:
     * - Base zone fee
     * - Distance tiers (if applicable)
     * - Peak hours surcharge
     * - Free delivery threshold
     */
    async calculateDeliveryFee(params: {
        zoneId: string;
        orderTotal: number;
        orderDate: Date;
        distanceKm?: number;
        storeId?: string;
    }): Promise<DeliveryFeeCalculation> {
        // Fetch zone
        const zone = await this.zoneRepo.findOne({ where: { id: params.zoneId } });
        if (!zone) {
            throw new NotFoundException(`Delivery zone not found: ${params.zoneId}`);
        }

        // Get zone configuration from StoreConfiguration
        const zoneConfig = await this.getZoneConfiguration(params.storeId || zone.storeId);

        let baseFee = parseFloat(zone.deliveryFee.toString());
        let estimatedMinutes = zone.estimatedDeliveryMinutes || 30;
        let distanceFee = 0;

        // Calculate distance-based fee if configured
        if (zoneConfig.distanceTiers && params.distanceKm) {
            const applicableTier = this.getDistanceTier(params.distanceKm, zoneConfig.distanceTiers);
            if (applicableTier) {
                baseFee = applicableTier.fee;
                estimatedMinutes = applicableTier.estimatedMinutes || estimatedMinutes;
            }
        }

        // Calculate peak hours surcharge
        const peakSurcharge = this.calculatePeakSurcharge(params.orderDate, zoneConfig);

        // Check for free delivery
        const freeDeliveryThreshold = zoneConfig.freeDeliveryThreshold || zone.freeDeliveryMinimum;
        const isFreeDelivery = freeDeliveryThreshold && params.orderTotal >= parseFloat(freeDeliveryThreshold.toString());

        const totalFee = isFreeDelivery ? 0 : baseFee + peakSurcharge;

        return {
            baseFee,
            distanceFee,
            peakSurcharge,
            totalFee: Math.round(totalFee * 100) / 100, // Round to 2 decimals
            estimatedMinutes,
            isFreeDelivery: isFreeDelivery ? true : false,
            freeDeliveryThreshold: freeDeliveryThreshold ? parseFloat(freeDeliveryThreshold.toString()) : undefined,
        };
    }

    /**
     * Get zone configuration from StoreConfiguration
     */
    private async getZoneConfiguration(storeId: string): Promise<{
        distanceTiers?: any[];
        freeDeliveryThreshold?: number;
        peakHoursPricing?: {
            enabled: boolean;
            surcharge: number;
            schedules: Array<{
                daysOfWeek: number[];
                startTime: string;
                endTime: string;
            }>;
        };
    }> {
        // TODO: Re-enable when StoreConfigurationService is available
        // try {
        //     const config = await this.storeConfigService.get('delivery.zone_config');
        //     return config || {};
        // } catch (error) {
        //     return {};
        // }
        return {};
    }

    /**
     * Get applicable distance tier
     */
    private getDistanceTier(distanceKm: number, tiers: any[]): any {
        // Sort tiers by fee ascending
        const sortedTiers = [...tiers].sort((a, b) => a.fee - b.fee);

        for (const tier of sortedTiers) {
            if (distanceKm <= tier.maxDistanceKm || !tier.maxDistanceKm) {
                return tier;
            }
        }

        return sortedTiers[sortedTiers.length - 1]; // Return highest tier
    }

    /**
     * Calculate peak hours surcharge
     */
    private calculatePeakSurcharge(orderDate: Date, zoneConfig: any): number {
        if (!zoneConfig.peakHoursPricing?.enabled) {
            return 0;
        }

        const surcharge = zoneConfig.peakHoursPricing.surcharge || 0;
        const schedules = zoneConfig.peakHoursPricing.schedules || [];

        const orderDay = orderDate.getDay(); // 0 = Sunday, 6 = Saturday
        const orderTime = orderDate.getHours() * 60 + orderDate.getMinutes(); // Minutes from midnight

        for (const schedule of schedules) {
            if (schedule.daysOfWeek.includes(orderDay)) {
                const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;

                if (orderTime >= startTime && orderTime <= endTime) {
                    return surcharge;
                }
            }
        }

        return 0;
    }

    // =========================================================================
    // DRIVER ASSIGNMENT
    // =========================================================================

    /**
     * Manually assign a driver to a delivery order
     *
     * Creates a DeliveryAssignment entity and updates order status.
     * Driver will be notified via WebSocket (if gateway is available).
     */
    async assignDriver(params: DriverAssignmentParams): Promise<{
        assignment: DeliveryAssignment;
        order: SalesOrder;
    }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Fetch order
            const order = await queryRunner.manager.findOne(SalesOrder, {
                where: { id: params.orderId },
            });

            if (!order) {
                throw new NotFoundException(`Order not found: ${params.orderId}`);
            }

            if (order.orderType !== OrderType.DELIVERY) {
                throw new BadRequestException('Only delivery orders can have drivers assigned');
            }

            // Fetch driver
            const driver = await queryRunner.manager.findOne(DeliveryDriver, {
                where: { id: params.driverId },
            });

            if (!driver) {
                throw new NotFoundException(`Driver not found: ${params.driverId}`);
            }

            if (!driver.isActive) {
                throw new BadRequestException('Driver is not active');
            }

            if (!driver.canAcceptOrder()) {
                throw new BadRequestException('Driver is at maximum capacity');
            }

            // Check for existing assignment
            const existingAssignment = await queryRunner.manager.findOne(DeliveryAssignment, {
                where: {
                    orderId: params.orderId,
                    status: In([AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP]),
                },
            });

            if (existingAssignment) {
                throw new BadRequestException('Order already has an active driver assignment');
            }

            // Get zone info
            let zoneCode = '';
            if (order.deliveryZoneId) {
                const zone = await queryRunner.manager.findOne(DeliveryZone, {
                    where: { id: order.deliveryZoneId },
                });
                zoneCode = zone?.zoneCode || '';
            }

            // Create assignment
            const assignment = queryRunner.manager.create(DeliveryAssignment, {
                driverId: params.driverId,
                driverName: driver.driverName,
                orderId: params.orderId,
                orderNumber: order.orderNumber,
                zoneId: order.deliveryZoneId || '',
                zoneCode,
                status: AssignmentStatus.ASSIGNED,
                priorityLevel: params.priorityLevel || 3,
                isRush: order.tags?.includes('rush_order') || false,
                storeId: order.registerSession?.storeId || 'default',
                driverNotes: params.notes,
                startLocation: driver.currentLocation ? {
                    lat: driver.currentLocation.lat,
                    lng: driver.currentLocation.lng,
                    address: '',
                } : { lat: 0, lng: 0, address: '' },
                destinationLocation: order.deliveryAddress?.coordinates ? {
                    lat: order.deliveryAddress.coordinates.lat,
                    lng: order.deliveryAddress.coordinates.lng,
                    address: `${order.deliveryAddress.building}, ${order.deliveryAddress.street}`,
                } : { lat: 0, lng: 0, address: 'N/A' },
                tripData: {
                    distanceKm: 0,
                    estimatedMinutes: 0,
                    actualMinutes: 0,
                },
            });

            const savedAssignment = await queryRunner.manager.save(assignment);

            // Update driver
            driver.assignOrder();
            await queryRunner.manager.save(driver);

            // Update order metadata to track driver
            if (!order.metadata) order.metadata = {};
            order.metadata.driverId = params.driverId;
            await queryRunner.manager.save(order);

            await queryRunner.commitTransaction();

            this.logger.log(
                `Driver assigned: ${params.driverId} → order ${params.orderId} (${order.orderNumber})`
            );

            // Notify driver via WebSocket
            this.emitDriverAssignedEvent(savedAssignment, order);

            return {
                assignment: savedAssignment,
                order,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Auto-assign best available driver for an order
     *
     * Algorithm considers:
     * - Driver availability (status, capacity)
     * - Distance from store/restaurant
     * - Current workload
     * - Driver ratings (if available)
     */
    async autoAssignDriver(orderId: string): Promise<AutoAssignmentResult> {
        // Fetch order
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        if (order.orderType !== OrderType.DELIVERY) {
            return { success: false, reason: 'Not a delivery order' };
        }

        // Get available drivers
        const availableDrivers = await this.driverRepo.find({
            where: {
                status: DriverStatus.AVAILABLE,
                isActive: true,
            },
        });

        // Filter by capacity
        const driversWithCapacity = availableDrivers.filter(
            driver => driver.canAcceptOrder()
        );

        if (driversWithCapacity.length === 0) {
            return { success: false, reason: 'No available drivers with capacity' };
        }

        // Score each driver (lower score = better)
        const scoredDrivers = await Promise.all(
            driversWithCapacity.map(async driver => ({
                driver,
                score: await this.scoreDriverForOrder(driver, order),
            }))
        );

        // Sort by score
        scoredDrivers.sort((a, b) => a.score - b.score);

        const bestDriver = scoredDrivers[0].driver;

        // Assign driver
        await this.assignDriver({
            orderId,
            driverId: bestDriver.id,
            assignedBy: { id: 'system', firstName: 'System', lastName: 'Auto-Assign' } as any,
            priorityLevel: order.tags?.includes('rush_order') ? 2 : 3,
        });

        return {
            success: true,
            driver: bestDriver,
        };
    }

    /**
     * Score driver for order assignment
     *
     * Lower score = better match
     */
    private async scoreDriverForOrder(
        driver: DeliveryDriver,
        order: SalesOrder,
    ): Promise<number> {
        let score = 0;

        // Current orders (lower is better)
        score += driver.currentOrderCount * 10;

        // Distance from destination (if location available)
        if (driver.currentLocation && order.deliveryAddress?.coordinates) {
            const distance = this.calculateDistance(
                driver.currentLocation.lat,
                driver.currentLocation.lng,
                order.deliveryAddress.coordinates.lat,
                order.deliveryAddress.coordinates.lng,
            );
            score += distance * 2;
        }

        // Efficiency metric (deliveries on time / total assigned)
        if (driver.metrics?.totalDeliveries) {
            const efficiency = driver.metrics.onTimeDeliveries / driver.metrics.totalDeliveries;
            score -= efficiency * 5; // Bonus for high efficiency
        }

        return score;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // =========================================================================
    // DELIVERY STATUS UPDATES
    // =========================================================================

    /**
     * Update delivery status
     *
     * Handles all delivery status transitions:
     * - PENDING → ASSIGNED → READY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
     *
     * Also handles:
     * - Driver location updates
     * - Delivery proof recording
     * - COD payment collection
     */
    async updateDeliveryStatus(params: DeliveryStatusUpdate): Promise<{
        assignment: DeliveryAssignment;
        order: SalesOrder;
    }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Fetch active assignment
            const assignment = await queryRunner.manager.findOne(DeliveryAssignment, {
                where: {
                    orderId: params.orderId,
                    status: In([
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.PICKED_UP,
                        AssignmentStatus.OUT_FOR_DELIVERY,
                    ]),
                },
            });

            if (!assignment) {
                throw new NotFoundException('No active delivery assignment found for this order');
            }

            // Map delivery status to assignment status
            const statusMap: Record<DeliveryStatus, AssignmentStatus> = {
                [DeliveryStatus.ASSIGNED]: AssignmentStatus.ASSIGNED,
                [DeliveryStatus.READY]: AssignmentStatus.ACCEPTED,
                [DeliveryStatus.PICKED_UP]: AssignmentStatus.PICKED_UP,
                [DeliveryStatus.OUT_FOR_DELIVERY]: AssignmentStatus.OUT_FOR_DELIVERY,
                [DeliveryStatus.DELIVERED]: AssignmentStatus.DELIVERED,
                [DeliveryStatus.FAILED]: AssignmentStatus.FAILED,
                [DeliveryStatus.CANCELLED]: AssignmentStatus.CANCELLED,
                [DeliveryStatus.PENDING]: AssignmentStatus.ASSIGNED,
                [DeliveryStatus.PREPARING]: AssignmentStatus.ACCEPTED,
            };

            const newStatus = statusMap[params.status as DeliveryStatus];

            // Update assignment based on status
            switch (newStatus) {
                case AssignmentStatus.ACCEPTED:
                    assignment.accept();
                    break;

                case AssignmentStatus.PICKED_UP:
                    assignment.markPickedUp();
                    break;

                case AssignmentStatus.OUT_FOR_DELIVERY:
                    assignment.markOutForDelivery();
                    break;

                case AssignmentStatus.DELIVERED:
                    assignment.markDelivered(params.deliveryProof);
                    if (params.paymentCollection) {
                        assignment.recordPayment(params.paymentCollection);
                    }
                    assignment.markCompleted();
                    break;

                case AssignmentStatus.FAILED:
                    // TODO: Handle failed delivery
                    break;

                case AssignmentStatus.CANCELLED:
                    // TODO: Handle cancellation
                    break;
            }

            // Update location if provided
            if (params.location && assignment.driverId) {
                await this.updateDriverLocation(
                    queryRunner,
                    assignment.driverId,
                    params.location.lat,
                    params.location.lng,
                );
            }

            // Add notes
            if (params.notes) {
                assignment.internalNotes = params.notes;
            }

            const savedAssignment = await queryRunner.manager.save(assignment);

            // Fetch and update order
            const order = await queryRunner.manager.findOne(SalesOrder, {
                where: { id: params.orderId },
            });

            if (order) {
                order.deliveryStatus = params.status as any;

                // Sync order status with delivery status
                if (params.status === DeliveryStatus.DELIVERED) {
                    await this.stateMachineService.transition(
                        order.id,
                        OrderStatus.COMPLETED,
                        {
                            order,
                            user: params.updatedBy,
                            reason: 'Order delivered',
                            metadata: {
                                deliveryCompleted: true,
                                assignmentId: assignment.id,
                            },
                        },
                    );
                }

                await queryRunner.manager.save(order);
            }

            await queryRunner.commitTransaction();

            this.logger.log(
                `Delivery status updated: ${params.orderId} → ${params.status}`
            );

            // Emit status change event
            if (order) {
                this.emitDeliveryStatusEvent(savedAssignment, order, params.status);
            }

            return {
                assignment: savedAssignment,
                order: order!,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Update driver location
     */
    private async updateDriverLocation(
        queryRunner: any,
        driverId: string,
        lat: number,
        lng: number,
    ): Promise<void> {
        const driver = await queryRunner.manager.findOne(DeliveryDriver, { where: { id: driverId } });
        if (driver) {
            driver.updateLocation({ lat, lng, updatedAt: new Date() });
            await queryRunner.manager.save(driver);
        }
    }

    /**
     * Driver declines assignment
     */
    async declineAssignment(params: {
        assignmentId: string;
        driverId: string;
        reason: DeclineReason;
        notes?: string;
    }): Promise<DeliveryAssignment> {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: params.assignmentId },
        });

        if (!assignment) {
            throw new NotFoundException(`Assignment not found: ${params.assignmentId}`);
        }

        if (assignment.driverId !== params.driverId) {
            throw new ForbiddenException('You can only decline your own assignments');
        }

        assignment.decline(params.reason, params.notes);

        // Free up driver capacity
        const driver = await this.driverRepo.findOne({ where: { id: params.driverId } });
        if (driver) {
            driver.completeOrder();
            await this.driverRepo.save(driver);
        }

        return await this.assignmentRepo.save(assignment);
    }

    // =========================================================================
    // DRIVER MANAGEMENT
    // =========================================================================

    /**
     * Update driver status
     */
    async updateDriverStatus(params: {
        driverId: string;
        status: DriverStatus;
        location?: { lat: number; lng: number; address?: string };
    }): Promise<DeliveryDriver> {
        const driver = await this.driverRepo.findOne({
            where: { id: params.driverId },
        });

        if (!driver) {
            throw new NotFoundException(`Driver not found: ${params.driverId}`);
        }

        driver.status = params.status;

        if (params.location) {
            driver.updateLocation({
                lat: params.location.lat,
                lng: params.location.lng,
                updatedAt: new Date(),
            });
        }

        return await this.driverRepo.save(driver);
    }

    /**
     * Get driver's active assignments
     */
    async getDriverAssignments(driverId: string): Promise<DeliveryAssignment[]> {
        return await this.assignmentRepo.find({
            where: {
                driverId,
                status: In([
                    AssignmentStatus.ASSIGNED,
                    AssignmentStatus.ACCEPTED,
                    AssignmentStatus.PICKED_UP,
                    AssignmentStatus.OUT_FOR_DELIVERY,
                ]),
            },
            order: { assignedAt: 'ASC' },
        });
    }

    // =========================================================================
    // EVENT EMISSIONS (WebSocket)
    // =========================================================================

    private emitDriverAssignedEvent(assignment: DeliveryAssignment, order: SalesOrder): void {
        this.logger.log(
            `DRIVER_ASSIGNED: Order ${order.orderNumber} → Driver ${assignment.driverName}`
        );
        // Broadcast via WebSocket gateway
        this.deliveryGateway?.broadcastDriverAssigned({
            orderId: order.id,
            orderNumber: order.orderNumber,
            driverId: assignment.driverId,
            driverName: assignment.driverName,
            assignedAt: assignment.assignedAt,
        });
    }

    private emitDeliveryStatusEvent(
        assignment: DeliveryAssignment,
        order: SalesOrder,
        status: string,
    ): void {
        this.logger.log(
            `DELIVERY_STATUS: Order ${order.orderNumber} → ${status}`
        );
        // Broadcast via WebSocket gateway
        this.deliveryGateway?.broadcastStatusUpdated({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status,
            timestamp: new Date(),
        });
    }

    // =========================================================================
    // CRON JOBS
    // =========================================================================

    /**
     * Auto-assign pending orders every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async autoAssignPendingOrders(): Promise<void> {
        const pendingOrders = await this.orderRepo.find({
            where: {
                orderType: OrderType.DELIVERY,
                driverId: null as any,
                status: In([OrderStatus.SAVED, OrderStatus.PAID]),
            },
            take: 10,
        });

        for (const order of pendingOrders) {
            await this.autoAssignDriver(order.id);
        }
    }

    /**
     * Alert for long-pending deliveries
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async alertPendingDeliveries(): Promise<void> {
        const thresholdMinutes = 15;
        const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);

        const pendingAssignments = await this.assignmentRepo.find({
            where: {
                status: In([AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED]),
                assignedAt: LessThan(thresholdTime),
            },
        });

        if (pendingAssignments.length > 0) {
            this.logger.warn(
                `${pendingAssignments.length} delivery assignments pending > ${thresholdMinutes} minutes`
            );
            // TODO: Emit alert via WebSocket
        }
    }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { KitchenTicket, TicketStatus } from '../entities/kitchen-ticket.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';

/**
 * Station Assignment Strategy
 *
 * Defines how stations are selected for kitchen tickets
 */
export enum AssignmentStrategy {
    /** Round-robin distribution across stations */
    ROUND_ROBIN = 'ROUND_ROBIN',
    /** Assign to station with least current workload */
    LEAST_LOADED = 'LEAST_LOADED',
    /** Random assignment for load distribution */
    RANDOM = 'RANDOM',
    /** Use product-defined station IDs (default) */
    PRODUCT_DEFINED = 'PRODUCT_DEFINED',
}

/**
 * Station Workload
 *
 * Represents the current workload of a station
 */
interface StationWorkload {
    stationId: string;
    stationCode: string;
    stationName: string;
    activeTickets: number; // NEW + IN_PROGRESS tickets
    totalItems: number; // Total items across active tickets
    lastAssignedAt?: Date; // When this station was last assigned a ticket
}

/**
 * Dynamic Station Assignment Service
 *
 * Assigns kitchen tickets to stations based on real-time workload
 * rather than hardcoded product-to-station mappings.
 *
 * Benefits:
 * - Balances workload across stations
 * - Prevents bottlenecks when one station is overloaded
 * - Adapts to station availability (offline/busy chefs)
 * - Improves kitchen throughput
 */
@Injectable()
export class StationAssignmentService {
    private readonly logger = new Logger(StationAssignmentService.name);

    // Track round-robin state per station type
    private readonly roundRobinIndex = new Map<string, number>();

    constructor(
        @InjectRepository(KitchenStation)
        private readonly stationRepo: Repository<KitchenStation>,
        @InjectRepository(KitchenTicket)
        private readonly ticketRepo: Repository<KitchenTicket>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
    ) { }

    /**
     * Assign stations for an order item
     *
     * Uses the configured strategy to select the optimal station(s)
     * for a kitchen item based on current workload.
     *
     * @param orderItemId The order item to assign stations for
     * @param strategy The assignment strategy to use
     * @returns Array of station IDs assigned (one item can go to multiple stations)
     */
    async assignStationsForItem(
        orderItemId: string,
        strategy: AssignmentStrategy = AssignmentStrategy.LEAST_LOADED,
    ): Promise<string[]> {
        // Fetch order item with product
        const orderItem = await this.getOrderItemWithProduct(orderItemId);
        if (!orderItem?.product) {
            this.logger.warn(`Order item ${orderItemId} not found or has no product`);
            return [];
        }

        const product = orderItem.product;

        // Skip non-kitchen items
        if (!product.isKitchenItem) {
            return [];
        }

        // Get eligible stations for this product
        const productStations = product.kitchenStationIds || [];
        if (productStations.length === 0) {
            this.logger.warn(`Product ${product.id} has no station assignments`);
            return [];
        }

        // Fetch all eligible stations
        const stations = await this.stationRepo.find({
            where: {
                id: In(productStations),
                isActive: true,
            },
        });

        if (stations.length === 0) {
            this.logger.warn(`No active stations found for product ${product.id}`);
            return [];
        }

        // Use strategy to select station(s)
        const assignedStations = await this.selectStations(
            stations,
            product.id,
            strategy,
        );

        this.logger.log(
            `Assigned stations ${assignedStations.join(', ')} for item ${orderItemId} ` +
            `using strategy ${strategy}`
        );

        return assignedStations;
    }

    /**
     * Assign stations for multiple items (batch assignment)
     *
     * Optimized for firing entire orders to kitchen
     *
     * @param orderItemIds Array of order item IDs
     * @param strategy The assignment strategy to use
     * @returns Map of orderItemId -> assigned station IDs
     */
    async assignStationsForItems(
        orderItemIds: string[],
        strategy: AssignmentStrategy = AssignmentStrategy.LEAST_LOADED,
    ): Promise<Map<string, string[]>> {
        const assignments = new Map<string, string[]>();

        // Fetch all order items with products
        const orderItems = await this.getOrderItemsWithProducts(orderItemIds);

        // Group by eligible stations to optimize workload queries
        const stationGroups = new Map<string, string[]>();

        for (const orderItem of orderItems) {
            if (!orderItem.product?.isKitchenItem) continue;

            const productStations = orderItem.product.kitchenStationIds || [];
            if (productStations.length === 0) continue;

            // Store order item for this station group
            for (const stationId of productStations) {
                if (!stationGroups.has(stationId)) {
                    stationGroups.set(stationId, []);
                }
                stationGroups.get(stationId)!.push(orderItem.id);
            }
        }

        // For each station group, calculate workload and assign items
        for (const [stationId, itemIds] of stationGroups) {
            const station = await this.stationRepo.findOne({
                where: { id: stationId, isActive: true },
            });

            if (!station) continue;

            // Assign all items for this station
            for (const itemId of itemIds) {
                if (!assignments.has(itemId)) {
                    assignments.set(itemId, []);
                }
                assignments.get(itemId)!.push(stationId);
            }
        }

        return assignments;
    }

    /**
     * Get current workload for all stations
     *
     * @param storeId Optional store ID to filter by
     * @returns Array of station workloads
     */
    async getStationWorkloads(storeId?: string): Promise<StationWorkload[]> {
        // Get all active stations
        const stationsQuery = this.stationRepo.createQueryBuilder('station')
            .where('station.isActive = :isActive', { isActive: true });

        if (storeId) {
            stationsQuery.andWhere('station.storeId = :storeId', { storeId });
        }

        const stations = await stationsQuery.getMany();

        // Calculate workload for each station
        const workloads: StationWorkload[] = [];

        for (const station of stations) {
            // Count active tickets for this station
            const activeTickets = await this.ticketRepo
                .createQueryBuilder('ticket')
                .where('ticket.stationId = :stationId', { stationId: station.id })
                .andWhere('ticket.status IN (:...statuses)', {
                    statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
                })
                .getCount();

            // Count total items across active tickets
            const ticketsWithItems = await this.ticketRepo
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.items', 'items')
                .where('ticket.stationId = :stationId', { stationId: station.id })
                .andWhere('ticket.status IN (:...statuses)', {
                    statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
                })
                .getMany();

            const totalItems = ticketsWithItems.reduce(
                (sum, ticket) => sum + (ticket.items?.length || 0),
                0,
            );

            workloads.push({
                stationId: station.id,
                stationCode: station.stationCode,
                stationName: station.stationName,
                activeTickets,
                totalItems,
                lastAssignedAt: undefined, // Could be tracked separately
            });
        }

        return workloads;
    }

    /**
     * Select station(s) based on strategy
     *
     * @param stations Eligible stations for the product
     * @param productId Product ID being assigned
     * @param strategy Assignment strategy
     * @returns Selected station IDs
     */
    private async selectStations(
        stations: KitchenStation[],
        productId: string,
        strategy: AssignmentStrategy,
    ): Promise<string[]> {
        switch (strategy) {
            case AssignmentStrategy.LEAST_LOADED:
                return await this.selectLeastLoaded(stations);

            case AssignmentStrategy.ROUND_ROBIN:
                return this.selectRoundRobin(stations, productId);

            case AssignmentStrategy.RANDOM:
                return this.selectRandom(stations);

            case AssignmentStrategy.PRODUCT_DEFINED:
            default:
                // Return all stations from product definition
                return stations.map((s) => s.id);
        }
    }

    /**
     * Select station with least current workload
     *
     * @param stations Eligible stations
     * @returns Station with least active tickets
     */
    private async selectLeastLoaded(stations: KitchenStation[]): Promise<string[]> {
        if (stations.length === 1) {
            return [stations[0].id];
        }

        // Get workload for all stations
        const stationIds = stations.map((s) => s.id);
        const workloads = await this.getStationWorkloadsByIds(stationIds);

        // Sort by total items (primary) and active tickets (secondary)
        workloads.sort((a, b) => {
            if (a.totalItems !== b.totalItems) {
                return a.totalItems - b.totalItems;
            }
            return a.activeTickets - b.activeTickets;
        });

        // Return least loaded station
        const selected = workloads[0];
        return [selected.stationId];
    }

    /**
     * Select station using round-robin
     *
     * @param stations Eligible stations
     * @param productId Product ID for round-robin key
     * @returns Selected station ID
     */
    private selectRoundRobin(stations: KitchenStation[], productId: string): string[] {
        if (stations.length === 1) {
            return [stations[0].id];
        }

        // Use product ID as round-robin key (so different products rotate independently)
        const key = `product:${productId}`;
        const currentIndex = this.roundRobinIndex.get(key) || 0;
        const selectedStation = stations[currentIndex % stations.length];

        // Increment index for next call
        this.roundRobinIndex.set(key, currentIndex + 1);

        return [selectedStation.id];
    }

    /**
     * Select random station
     *
     * @param stations Eligible stations
     * @returns Random station ID
     */
    private selectRandom(stations: KitchenStation[]): string[] {
        if (stations.length === 1) {
            return [stations[0].id];
        }

        const randomIndex = Math.floor(Math.random() * stations.length);
        return [stations[randomIndex].id];
    }

    /**
     * Get workload for specific station IDs
     *
     * @param stationIds Station IDs to query
     * @returns Array of workloads
     */
    private async getStationWorkloadsByIds(stationIds: string[]): Promise<StationWorkload[]> {
        const workloads: StationWorkload[] = [];

        for (const stationId of stationIds) {
            const activeTickets = await this.ticketRepo
                .createQueryBuilder('ticket')
                .where('ticket.stationId = :stationId', { stationId })
                .andWhere('ticket.status IN (:...statuses)', {
                    statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
                })
                .getCount();

            const ticketsWithItems = await this.ticketRepo
                .createQueryBuilder('ticket')
                .leftJoinAndSelect('ticket.items', 'items')
                .where('ticket.stationId = :stationId', { stationId })
                .andWhere('ticket.status IN (:...statuses)', {
                    statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
                })
                .getMany();

            const totalItems = ticketsWithItems.reduce(
                (sum, ticket) => sum + (ticket.items?.length || 0),
                0,
            );

            workloads.push({
                stationId,
                stationCode: '', // Would need to fetch station for these
                stationName: '',
                activeTickets,
                totalItems,
            });
        }

        return workloads;
    }

    /**
     * Fetch order item with product relation
     *
     * @param orderItemId Order item ID
     * @returns Order item with product
     */
    private async getOrderItemWithProduct(orderItemId: string): Promise<OrderItem | null> {
        return await this.orderItemRepo.findOne({
            where: { id: orderItemId },
            relations: ['product'],
        });
    }

    /**
     * Fetch multiple order items with products
     *
     * @param orderItemIds Order item IDs
     * @returns Array of order items with products
     */
    private async getOrderItemsWithProducts(orderItemIds: string[]): Promise<OrderItem[]> {
        return await this.orderItemRepo
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.product', 'product')
            .where('item.id IN (:...ids)', { ids: orderItemIds })
            .getMany();
    }
}

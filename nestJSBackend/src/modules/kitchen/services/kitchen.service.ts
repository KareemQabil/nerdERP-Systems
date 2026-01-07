import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { KitchenTicket, KitchenTicketItem, TicketStatus, TicketPriority } from '../entities/kitchen-ticket.entity';
import { SalesOrder, OrderStatus } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import {
    CreateKitchenStationDto,
    UpdateKitchenStationDto,
    UpdateTicketStatusDto,
    BumpTicketDto,
} from '../dto/kitchen.dto';
import { KitchenGateway } from '../kitchen.gateway';
import { InventoryService } from '../../inventory/services/inventory.service';

@Injectable()
export class KitchenService {
    constructor(
        @InjectRepository(KitchenStation)
        private readonly stationRepo: Repository<KitchenStation>,
        @InjectRepository(KitchenTicket)
        private readonly ticketRepo: Repository<KitchenTicket>,
        @InjectRepository(KitchenTicketItem)
        private readonly ticketItemRepo: Repository<KitchenTicketItem>,
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
        @Inject(forwardRef(() => KitchenGateway))
        private readonly kitchenGateway: KitchenGateway,
        // Phase 1: Inventory integration for stock commitment on fire
        @Inject(forwardRef(() => InventoryService))
        private readonly inventoryService: InventoryService,
    ) { }

    // ==================== STATIONS ====================

    async findAllStations(storeId?: string): Promise<KitchenStation[]> {
        const query = this.stationRepo.createQueryBuilder('station')
            .where('station.isActive = :isActive', { isActive: true })
            .orderBy('station.displayOrder', 'ASC');

        if (storeId) {
            query.andWhere('station.storeId = :storeId', { storeId });
        }

        return await query.getMany();
    }

    async findStationById(id: string): Promise<KitchenStation> {
        const station = await this.stationRepo.findOne({ where: { id } });
        if (!station) {
            throw new NotFoundException(`Kitchen station with ID ${id} not found`);
        }
        return station;
    }

    @Transactional()
    async createStation(dto: CreateKitchenStationDto): Promise<KitchenStation> {
        const existing = await this.stationRepo.findOne({
            where: { stationCode: dto.stationCode, storeId: dto.storeId },
        });

        if (existing) {
            throw new BadRequestException('Station code already exists for this store');
        }

        const station = this.stationRepo.create(dto);
        return await this.stationRepo.save(station);
    }

    @Transactional()
    async updateStation(id: string, dto: UpdateKitchenStationDto): Promise<KitchenStation> {
        const station = await this.findStationById(id);
        Object.assign(station, dto);
        return await this.stationRepo.save(station);
    }

    // ==================== TICKETS ====================

    @Transactional()
    async createTicketsFromOrder(orderId: string): Promise<KitchenTicket[]> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Group items by station
        const stationGroups = new Map<string, any[]>();

        for (const item of order.items) {
            if (item.product?.isKitchenItem) {
                const stations = item.product.kitchenStationIds || [];

                if (stations.length === 0) {
                    // Skip items with no station assignment
                    continue;
                }

                for (const stationId of stations) {
                    if (!stationGroups.has(stationId)) {
                        stationGroups.set(stationId, []);
                    }
                    stationGroups.get(stationId)!.push(item);
                }
            }
        }

        // Create ticket for each station
        const tickets: KitchenTicket[] = [];

        for (const [stationId, items] of stationGroups) {
            // Load station to create proper relation
            const station = await this.stationRepo.findOne({ where: { id: stationId } });
            if (!station) continue;

            const ticket = this.ticketRepo.create({
                station,
                orderId,
                ticketNumber: `T-${order.orderNumber}-${stationId.substring(0, 4)}`,
                orderNumber: order.orderNumber,
                status: TicketStatus.NEW,
                priority: TicketPriority.NORMAL,
                sentAt: new Date(),
            });

            const savedTicket = await this.ticketRepo.save(ticket);

            // Create ticket items
            for (const item of items) {
                await this.ticketItemRepo.save({
                    ticket: savedTicket,
                    orderItemId: item.id,
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: parseFloat(item.quantity),
                    notes: item.notes || '',
                    isPrepared: false,
                });
            }

            tickets.push(savedTicket);
        }

        return tickets;
    }

    async getActiveTickets(stationId: string): Promise<KitchenTicket[]> {
        return await this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.station', 'station')
            .leftJoinAndSelect('ticket.items', 'items')
            .where('station.id = :stationId', { stationId })
            .andWhere('ticket.status IN (:...statuses)', {
                statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS]
            })
            .orderBy('ticket.sentAt', 'ASC')
            .getMany();
    }

    @Transactional()
    async updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<KitchenTicket> {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.status = dto.status;

        if (dto.status === TicketStatus.IN_PROGRESS && !ticket.startedAt) {
            ticket.startedAt = new Date();
        } else if (dto.status === TicketStatus.READY && !ticket.completedAt) {
            ticket.completedAt = new Date();

            // Calculate prep time
            if (ticket.startedAt) {
                const prepTime = Math.floor(
                    (ticket.completedAt.getTime() - ticket.startedAt.getTime()) / 1000
                );
                ticket.prepTimeSeconds = prepTime;
            }
        }

        return await this.ticketRepo.save(ticket);
    }

    @Transactional()
    async bumpTicket(id: string, dto: BumpTicketDto): Promise<KitchenTicket> {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.status = TicketStatus.BUMPED;
        ticket.bumpedAt = new Date();
        ticket.bumpedByUserId = dto.userId;

        return await this.ticketRepo.save(ticket);
    }

    async getStationTickets(stationId: string): Promise<KitchenTicket[]> {
        return await this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.station', 'station')
            .leftJoinAndSelect('ticket.items', 'items')
            .where('station.id = :stationId', { stationId })
            .orderBy('ticket.sentAt', 'DESC')
            .take(50)
            .getMany();
    }

    // ==================== POS INTEGRATION METHODS ====================

    /**
     * Fire order to kitchen - Main entry point for POS → Kitchen workflow
     *
     * This method:
     * 1. Validates the order exists and can be fired
     * 2. Filters items by kitchen items and optionally by specific item IDs
     * 3. Groups items by kitchen station
     * 4. Creates kitchen tickets for each station
     * 5. Updates order status to FIRED_TO_KITCHEN
     * 6. Updates order item kitchenStatus to PENDING
     * 7. Returns the created tickets for WebSocket broadcast
     *
     * @param orderId The order ID to fire
     * @param itemIds Optional specific item IDs to fire (for partial firing)
     * @returns Created kitchen tickets grouped by station
     */
    @Transactional()
    async fireOrderToKitchen(
        orderId: string,
        itemIds?: string[],
    ): Promise<KitchenTicket[]> {
        // Fetch order with relations
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product'],
        });

        if (!order) {
            throw new NotFoundException({
                code: 'KITCHEN_001',
                messageKey: 'ORDER_NOT_FOUND',
                message: 'Order not found',
            });
        }

        // Check if order can be fired to kitchen
        if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.VOID) {
            throw new BadRequestException({
                code: 'KITCHEN_002',
                messageKey: 'ORDER_CANNOT_BE_FIRED',
                message: `Cannot fire order with status ${order.status} to kitchen`,
            });
        }

        // Filter items to fire
        let itemsToFire = order.items.filter((item) => {
            // Skip voided items
            if (item.isVoided) return false;

            // Only fire kitchen items
            if (!item.product?.isKitchenItem) return false;

            // If specific item IDs provided, filter by them
            if (itemIds && itemIds.length > 0) {
                return itemIds.includes(item.id);
            }

            // Skip items already fired to kitchen
            if (item.kitchenStatus === 'FIRED' || item.kitchenStatus === 'PREPARING' || item.kitchenStatus === 'READY') {
                return false;
            }

            return true;
        });

        if (itemsToFire.length === 0) {
            throw new BadRequestException({
                code: 'KITCHEN_003',
                messageKey: 'NO_ITEMS_TO_FIRE',
                message: 'No kitchen items to fire - items may already be fired or all items are voided',
            });
        }

        // Group items by station
        const stationGroups = new Map<string, typeof itemsToFire>();

        for (const item of itemsToFire) {
            const stations = item.product?.kitchenStationIds || [];

            if (stations.length === 0) {
                // Skip items with no station assignment - log warning
                continue;
            }

            for (const stationId of stations) {
                if (!stationGroups.has(stationId)) {
                    stationGroups.set(stationId, []);
                }
                stationGroups.get(stationId)!.push(item);
            }
        }

        // Create ticket for each station
        const tickets: KitchenTicket[] = [];
        const now = new Date();

        for (const [stationId, items] of stationGroups) {
            // Load station
            const station = await this.stationRepo.findOne({ where: { id: stationId } });
            if (!station) continue;

            const ticket = this.ticketRepo.create({
                station,
                orderId,
                ticketNumber: `T-${order.orderNumber}-${station.stationCode}`,
                orderNumber: order.orderNumber,
                status: TicketStatus.NEW,
                priority: TicketPriority.NORMAL,
                sentAt: now,
            });

            const savedTicket = await this.ticketRepo.save(ticket);

            // Create ticket items with modifiers from order item
            for (const item of items) {
                const modifiers = Array.isArray(item.modifiers)
                    ? item.modifiers.map((m: any) => m.modifierName || String(m)).filter(Boolean)
                    : [];

                await this.ticketItemRepo.save({
                    ticket: savedTicket,
                    orderItemId: item.id,
                    productId: item.product!.id,
                    productName: item.productName,
                    quantity: parseFloat(String(item.quantity)),
                    modifiers,
                    notes: item.specialInstructions || '',
                    isPrepared: false,
                });

                // Update order item kitchen status
                item.kitchenStatus = 'FIRED';
                item.firedToKitchenAt = now;

                // Phase 1: Commit stock reservation on fire (hard deduct)
                if (item.stockReservationId && !item.stockCommitted) {
                    try {
                        await this.inventoryService.commitReservation(item.stockReservationId);
                        item.stockCommitted = true;
                    } catch (error: any) {
                        console.warn(`[KitchenService] Stock commit failed for item ${item.productName}: ${error.message}`);
                        // Continue anyway - don't block kitchen fire
                    }
                }

                await this.orderItemRepo.save(item);
            }

            tickets.push(savedTicket);
        }

        // Update order status
        if (order.status === OrderStatus.DRAFT || order.status === OrderStatus.PENDING) {
            order.status = OrderStatus.FIRED_TO_KITCHEN;
            order.firedToKitchenAt = now;
            await this.orderRepo.save(order);
        }

        // Broadcast ticket created events via WebSocket
        for (const ticket of tickets) {
            this.kitchenGateway.broadcastTicketCreated(ticket);
        }

        return tickets;
    }

    /**
     * Update ticket item status - Individual item preparation tracking
     *
     * This allows kitchen staff to mark individual items as PREPARING or READY
     * Updates both the ticket item and the corresponding order item
     *
     * @param ticketItemId The ticket item ID to update
     * @param status The new status ('PREPARING' or 'READY')
     * @param userId The user ID performing the action
     * @returns Updated ticket item
     */
    @Transactional()
    async updateTicketItemStatus(
        ticketItemId: string,
        status: 'PREPARING' | 'READY',
        userId: string,
    ): Promise<KitchenTicketItem> {
        // Fetch ticket item with relations
        const ticketItem = await this.ticketItemRepo.findOne({
            where: { id: ticketItemId },
            relations: ['ticket', 'ticket.orderId'],
        });

        if (!ticketItem) {
            throw new NotFoundException({
                code: 'KITCHEN_004',
                messageKey: 'TICKET_ITEM_NOT_FOUND',
                message: 'Ticket item not found',
            });
        }

        // Check if already prepared
        if (status === 'READY' && ticketItem.isPrepared) {
            throw new BadRequestException({
                code: 'KITCHEN_005',
                messageKey: 'ITEM_ALREADY_PREPARED',
                message: 'Item is already marked as prepared',
            });
        }

        // Update ticket item status
        ticketItem.isPrepared = status === 'READY';
        if (status === 'READY') {
            ticketItem.preparedAt = new Date();
        }

        const updatedTicketItem = await this.ticketItemRepo.save(ticketItem);

        // Broadcast item status update via WebSocket
        this.kitchenGateway.server.to(`station:${ticketItem.ticket.station?.id}`).emit('kitchen:item-updated', {
            ticketId: ticketItem.ticket.id,
            itemId: ticketItem.id,
            status: status,
            updatedAt: new Date().toISOString(),
        });

        // Update corresponding order item kitchen status
        await this.orderItemRepo.update(
            { id: ticketItem.orderItemId },
            { kitchenStatus: status },
        );

        // Update ticket status based on items
        await this.updateTicketStatusBasedOnItems(ticketItem.ticket.id);

        // Update order status if all items ready
        const order = await this.orderRepo.findOne({
            where: { id: ticketItem.ticket.orderId },
            relations: ['items'],
        });

        if (order) {
            const allReady = order.items.every(
                (item) => !item.product?.isKitchenItem || item.kitchenStatus === 'READY' || item.isVoided,
            );

            if (allReady && order.status === OrderStatus.FIRED_TO_KITCHEN) {
                order.status = OrderStatus.READY;
                await this.orderRepo.save(order);
            }
        }

        return updatedTicketItem;
    }

    /**
     * Get ticket for a specific order item
     * Used to check if an item has been sent to kitchen
     *
     * @param orderItemId The order item ID
     * @returns The kitchen ticket item or null if not found
     */
    async getTicketForOrderItem(orderItemId: string): Promise<KitchenTicketItem | null> {
        const ticketItem = await this.ticketItemRepo.findOne({
            where: { orderItemId },
            relations: ['ticket', 'ticket.station'],
        });

        return ticketItem || null;
    }

    /**
     * Update ticket status based on its items
     * Auto-updates ticket to READY when all items are prepared
     *
     * @param ticketId The ticket ID to update
     */
    private async updateTicketStatusBasedOnItems(ticketId: string): Promise<void> {
        const ticket = await this.ticketRepo.findOne({
            where: { id: ticketId },
            relations: ['items'],
        });

        if (!ticket) return;

        const allPrepared = ticket.items.every((item) => item.isPrepared);
        const anyPrepared = ticket.items.some((item) => item.isPrepared);

        if (allPrepared && ticket.status !== TicketStatus.READY) {
            ticket.status = TicketStatus.READY;
            ticket.completedAt = new Date();
            if (ticket.startedAt) {
                ticket.prepTimeSeconds = Math.floor(
                    (ticket.completedAt.getTime() - ticket.startedAt.getTime()) / 1000,
                );
            }
            await this.ticketRepo.save(ticket);
        } else if (anyPrepared && ticket.status === TicketStatus.NEW) {
            ticket.status = TicketStatus.IN_PROGRESS;
            ticket.startedAt = new Date();
            await this.ticketRepo.save(ticket);
        }
    }

    /**
     * Get tickets for a specific station (KDS view)
     * Filters by active status by default
     *
     * @param stationId The station ID
     * @param activeOnly Whether to return only active tickets
     * @returns Array of tickets for the station
     */
    async getTicketsForStation(stationId: string, activeOnly = true): Promise<KitchenTicket[]> {
        const query = this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.station', 'station')
            .leftJoinAndSelect('ticket.items', 'items')
            .where('station.id = :stationId', { stationId });

        if (activeOnly) {
            query.andWhere('ticket.status IN (:...statuses)', {
                statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
            });
        }

        return await query.orderBy('ticket.sentAt', 'ASC').getMany();
    }

    // ==================== TICKET MODIFICATION ====================

    /**
     * Modify existing kitchen ticket with added/removed/modified items
     *
     * Handles post-fire order modifications:
     * - Adding items to an existing ticket
     * - Removing/voiding items from a ticket
     * - Modifying item quantities or notes
     *
     * @param orderId The order ID to modify tickets for
     * @param modifications The modifications to apply
     * @returns Updated tickets
     */
    @Transactional()
    async modifyOrderTicket(
        orderId: string,
        modifications: {
            addedItems: Array<{ orderItemId: string; quantity: number }>;
            removedItems: Array<{ orderItemId: string; reason: string }>;
            modifiedItems: Array<{ orderItemId: string; newQuantity: number; newNotes?: string }>;
        },
    ): Promise<KitchenTicket[]> {
        const updatedTickets: KitchenTicket[] = [];

        // Handle removed items - send VOID notification to kitchen
        for (const removed of modifications.removedItems) {
            const ticketItem = await this.ticketItemRepo.findOne({
                where: { orderItemId: removed.orderItemId },
                relations: ['ticket', 'ticket.station'],
            });

            if (ticketItem && ticketItem.ticket) {
                const ticket = ticketItem.ticket;

                // Check if item is already being prepared
                if (ticketItem.isPrepared) {
                    throw new BadRequestException({
                        code: 'KITCHEN_006',
                        messageKey: 'CANNOT_VOID_PREPARED_ITEM',
                        message: 'Cannot void item that is already prepared. Recall from kitchen first.',
                    });
                }

                // Mark ticket item as voided
                ticketItem.isVoided = true;
                ticketItem.voidedAt = new Date();
                ticketItem.voidReason = removed.reason;
                await this.ticketItemRepo.save(ticketItem);

                // Broadcast item voided to kitchen display
                this.kitchenGateway.server.to(`station:${ticket.station?.id}`).emit('kitchen:item-voided', {
                    ticketId: ticket.id,
                    ticketItemId: ticketItem.id,
                    orderItemId: removed.orderItemId,
                    reason: removed.reason,
                    voidedAt: ticketItem.voidedAt,
                });

                // Update ticket status if all items voided
                await this.updateTicketStatusBasedOnItems(ticket.id);

                updatedTickets.push(ticket);
            }
        }

        // Handle added items - send ADD notification to kitchen
        for (const added of modifications.addedItems) {
            // Fetch order item with product info
            const orderItem = await this.orderItemRepo.findOne({
                where: { id: added.orderItemId },
                relations: ['product'],
            });

            if (!orderItem || !orderItem.product) {
                continue;
            }

            // Get stations for this product
            const stations = orderItem.product.kitchenStationIds || [];
            if (stations.length === 0) {
                continue;
            }

            // For each station, find or create ticket
            for (const stationId of stations) {
                // Find existing active ticket for this order and station
                let ticket = await this.ticketRepo.findOne({
                    where: {
                        orderId,
                        status: In([TicketStatus.NEW, TicketStatus.IN_PROGRESS]),
                    },
                    relations: ['station'],
                });

                if (!ticket) {
                    // Create new ticket for this station
                    const station = await this.stationRepo.findOne({ where: { id: stationId } });
                    if (!station) continue;

                    const order = await this.orderRepo.findOne({ where: { id: orderId } });
                    if (!order) continue;

                    ticket = this.ticketRepo.create({
                        station,
                        orderId,
                        ticketNumber: `T-${order.orderNumber}-${station.stationCode}`,
                        orderNumber: order.orderNumber,
                        status: TicketStatus.NEW,
                        priority: TicketPriority.NORMAL,
                        sentAt: new Date(),
                        isModified: true, // Mark as modified since items were added
                    });
                    ticket = await this.ticketRepo.save(ticket);
                }

                // Add ticket item
                const modifiers = Array.isArray(orderItem.modifiers)
                    ? orderItem.modifiers.map((m: any) => m.modifierName || String(m)).filter(Boolean)
                    : [];

                const ticketItem = this.ticketItemRepo.create({
                    ticket,
                    orderItemId: orderItem.id,
                    productId: orderItem.product.id,
                    productName: orderItem.productName,
                    quantity: added.quantity,
                    modifiers,
                    notes: orderItem.specialInstructions || '',
                    isPrepared: false,
                    isAdded: true, // Mark as added modification
                });

                await this.ticketItemRepo.save(ticketItem);

                // Update order item kitchen status
                orderItem.kitchenStatus = 'FIRED';
                orderItem.firedToKitchenAt = new Date();
                await this.orderItemRepo.save(orderItem);

                // Broadcast item added to kitchen display
                this.kitchenGateway.server.to(`station:${stationId}`).emit('kitchen:item-added', {
                    ticketId: ticket.id,
                    ticketItemId: ticketItem.id,
                    orderItemId: orderItem.id,
                    productName: orderItem.productName,
                    quantity: added.quantity,
                    modifiers,
                    notes: orderItem.specialInstructions,
                    addedAt: new Date(),
                });

                updatedTickets.push(ticket);
            }
        }

        // Handle modified items - update quantity or notes
        for (const modified of modifications.modifiedItems) {
            const ticketItem = await this.ticketItemRepo.findOne({
                where: { orderItemId: modified.orderItemId },
                relations: ['ticket', 'ticket.station'],
            });

            if (ticketItem && ticketItem.ticket) {
                // Check if item is already being prepared
                if (ticketItem.isPrepared) {
                    throw new BadRequestException({
                        code: 'KITCHEN_007',
                        messageKey: 'CANNOT_MODIFY_PREPARED_ITEM',
                        message: 'Cannot modify item that is already prepared.',
                    });
                }

                // Update quantity and/or notes
                ticketItem.quantity = modified.newQuantity;
                if (modified.newNotes !== undefined) {
                    ticketItem.notes = modified.newNotes;
                }
                ticketItem.isModified = true; // Mark as modified
                await this.ticketItemRepo.save(ticketItem);

                // Broadcast item modified to kitchen display
                this.kitchenGateway.server.to(`station:${ticketItem.ticket.station?.id}`).emit('kitchen:item-modified', {
                    ticketId: ticketItem.ticket.id,
                    ticketItemId: ticketItem.id,
                    orderItemId: modified.orderItemId,
                    newQuantity: modified.newQuantity,
                    newNotes: modified.newNotes,
                    modifiedAt: new Date(),
                });

                updatedTickets.push(ticketItem.ticket);
            }
        }

        return updatedTickets;
    }

    /**
     * Recall a ticket from kitchen (emergency stop)
     *
     * Used when an order needs to be cancelled after being fired.
     * Marks the ticket as RECALLED and notifies kitchen staff.
     *
     * @param orderId The order ID to recall
     * @param reason The reason for recall
     * @returns Updated tickets
     */
    @Transactional()
    async recallTicketFromKitchen(
        orderId: string,
        reason: string,
    ): Promise<KitchenTicket[]> {
        const tickets = await this.ticketRepo.find({
            where: { orderId },
            relations: ['station', 'items'],
        });

        if (tickets.length === 0) {
            throw new NotFoundException({
                code: 'KITCHEN_008',
                messageKey: 'NO_TICKETS_FOUND',
                message: 'No active kitchen tickets found for this order',
            });
        }

        const recalledTickets: KitchenTicket[] = [];

        for (const ticket of tickets) {
            // Only recall active tickets
            if (ticket.status === TicketStatus.NEW || ticket.status === TicketStatus.IN_PROGRESS) {
                ticket.status = TicketStatus.RECALLED;
                ticket.recalledAt = new Date();
                ticket.recallReason = reason;

                const savedTicket = await this.ticketRepo.save(ticket);

                // Broadcast recall notification to kitchen
                this.kitchenGateway.server.to(`station:${ticket.station?.id}`).emit('kitchen:ticket-recalled', {
                    ticketId: ticket.id,
                    orderNumber: ticket.orderNumber,
                    reason: reason,
                    recalledAt: ticket.recalledAt,
                });

                recalledTickets.push(savedTicket);
            }
        }

        // Update order items kitchen status back to PENDING
        await this.orderItemRepo
            .createQueryBuilder()
            .update(OrderItem)
            .set({ kitchenStatus: null as any, firedToKitchenAt: null as any })
            .where('order_id = :orderId', { orderId })
            .execute();

        return recalledTickets;
    }
}

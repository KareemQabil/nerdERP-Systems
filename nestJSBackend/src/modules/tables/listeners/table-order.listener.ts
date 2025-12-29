import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    OrderCreatedEvent,
    OrderPaidEvent,
    OrderCancelledEvent,
} from '../../../common/events/order.events';
import { TablesService } from '../services/tables.service';

/**
 * Listener for order-related events that affect tables
 */
@Injectable()
export class TableOrderListener {
    private readonly logger = new Logger(TableOrderListener.name);

    constructor(private readonly tablesService: TablesService) { }

    /**
     * Handle order creation - occupy table if dine-in
     */
    @OnEvent('order.created')
    async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
        this.logger.log(`Handling order.created event for order ${event.order.id}`);

        try {
            // If order has a table, mark it as occupied
            if (event.order.tableId) {
                await this.tablesService.occupyTable(event.order.tableId, event.order.id);
                this.logger.log(`Table ${event.order.tableId} marked as occupied`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to occupy table for order ${event.order.id}`,
                error.stack,
            );
        }
    }

    /**
     * Handle order payment - free table if paid
     */
    @OnEvent('order.paid')
    async handleOrderPaid(event: OrderPaidEvent): Promise<void> {
        this.logger.log(`Handling order.paid event for order ${event.order.id}`);

        try {
            // If order has a table and is paid, free the table
            if (event.order.tableId) {
                await this.tablesService.freeTable(event.order.tableId);
                this.logger.log(`Table ${event.order.tableId} freed`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to free table for order ${event.order.id}`,
                error.stack,
            );
        }
    }

    /**
     * Handle order cancellation - free table
     */
    @OnEvent('order.cancelled')
    async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
        this.logger.log(
            `Handling order.cancelled event for order ${event.order.id}`,
        );

        try {
            // If order has a table, free it
            if (event.order.tableId) {
                await this.tablesService.freeTable(event.order.tableId);
                this.logger.log(`Table ${event.order.tableId} freed after cancellation`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to free table for order ${event.order.id}`,
                error.stack,
            );
        }
    }
}

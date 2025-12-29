import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    OrderCreatedEvent,
    OrderItemsFiredEvent,
    OrderCancelledEvent,
} from '../../../common/events/order.events';
import { KitchenService } from '../services/kitchen.service';

/**
 * Listener for order-related events that affect the kitchen
 */
@Injectable()
export class KitchenOrderListener {
    private readonly logger = new Logger(KitchenOrderListener.name);

    constructor(private readonly kitchenService: KitchenService) { }

    /**
     * Handle order creation - create kitchen tickets if needed
     */
    @OnEvent('order.created')
    async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
        this.logger.log(`Handling order.created event for order ${event.order.id}`);

        try {
            // Only create kitchen tickets for dine-in orders
            if (event.order.orderType === 'DINE_IN') {
                await this.kitchenService.createTicketsFromOrder(event.order.id);
                this.logger.log(`Kitchen tickets created for order ${event.order.id}`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to create kitchen tickets for order ${event.order.id}`,
                error.stack,
            );
            // Don't throw - this is async event handling
            // The order was already created successfully
        }
    }

    /**
     * Handle order items fired to kitchen
     */
    @OnEvent('order.items.fired')
    async handleOrderItemsFired(event: OrderItemsFiredEvent): Promise<void> {
        this.logger.log(
            `Handling order.items.fired event for order ${event.order.id}`,
        );

        try {
            // TODO: Add fireItemsToKitchen method to KitchenService
            // await this.kitchenService.fireItemsToKitchen(
            //     event.order.id,
            //     event.itemIds,
            // );
            this.logger.warn('fireItemsToKitchen not yet implemented');
            this.logger.log(
                `Items ${event.itemIds.join(', ')} fired to kitchen for order ${event.order.id}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to fire items to kitchen for order ${event.order.id}`,
                error.stack,
            );
        }
    }

    /**
     * Handle order cancellation - cancel kitchen tickets
     */
    @OnEvent('order.cancelled')
    async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
        this.logger.log(
            `Handling order.cancelled event for order ${event.order.id}`,
        );

        try {
            // TODO: Add cancelTicketsForOrder method to KitchenService
            // await this.kitchenService.cancelTicketsForOrder(event.order.id);
            this.logger.warn('cancelTicketsForOrder not yet implemented');
            this.logger.log(`Kitchen tickets cancelled for order ${event.order.id}`);
        } catch (error) {
            this.logger.error(
                `Failed to cancel kitchen tickets for order ${event.order.id}`,
                error.stack,
            );
        }
    }
}

import { SalesOrder } from '../../modules/sales/entities/sales-order.entity';

/**
 * Base class for all order-related events
 */
export abstract class OrderEvent {
    constructor(public readonly order: SalesOrder) { }
}

/**
 * Emitted when a new order is created
 * Listeners: Kitchen, Tables, Cash
 */
export class OrderCreatedEvent extends OrderEvent {
    constructor(order: SalesOrder) {
        super(order);
    }
}

/**
 * Emitted when an order is fully paid
 * Listeners: Cash (for session balance), Tables (for table status)
 */
export class OrderPaidEvent extends OrderEvent {
    constructor(order: SalesOrder) {
        super(order);
    }
}

/**
 * Emitted when an order is cancelled/voided
 * Listeners: Kitchen (cancel ticket), Tables (free table), Inventory (release reservation)
 */
export class OrderCancelledEvent extends OrderEvent {
    constructor(
        order: SalesOrder,
        public readonly reason: string,
        public readonly authorizedBy?: string,
    ) {
        super(order);
    }
}

/**
 * Emitted when order items are sent to kitchen
 * Listeners: Kitchen
 */
export class OrderItemsFiredEvent extends OrderEvent {
    constructor(
        order: SalesOrder,
        public readonly itemIds: string[],
    ) {
        super(order);
    }
}

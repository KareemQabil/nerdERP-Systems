import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPaidEvent } from '../../../common/events/order.events';
import { RegisterSessionService } from '../services/register-session.service';

/**
 * Listener for order-related events that affect cash/register sessions
 */
@Injectable()
export class CashOrderListener {
    private readonly logger = new Logger(CashOrderListener.name);

    constructor(
        private readonly registerSessionService: RegisterSessionService,
    ) { }

    /**
     * Handle order payment - log that payment was received
     * Note: Session balance recalculation is done by calculateExpectedBalance
     * which already queries all payments for the session
     */
    @OnEvent('order.paid')
    async handleOrderPaid(event: OrderPaidEvent): Promise<void> {
        this.logger.log(`Handling order.paid event for order ${event.order.id}`);

        try {
            // The register session balance is calculated dynamically via calculateExpectedBalance
            // which queries all payments associated with the session
            // So we just log the event here
            const session = event.order.registerSession;
            if (session) {
                this.logger.log(
                    `Order ${event.order.id} paid - session ${session.id} will reflect updated balance`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Failed to process order.paid event for order ${event.order.id}`,
                (error as Error).stack,
            );
        }
    }
}

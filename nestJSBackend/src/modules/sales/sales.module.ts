import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { SalesOrder } from './entities/sales-order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { OrderSurcharge } from './entities/order-surcharge.entity';
import { OrderTax } from './entities/order-tax.entity';
import { OrderStateHistory } from './entities/order-state-history.entity';
import { Refund } from './entities/refund.entity';
import { CashTransaction, BankDrop } from './entities/cash-transaction.entity';
import { SalesService } from './services/sales.service';
import { VoidOperationService } from './services/void-operation.service';
import { CashManagementService } from './services/cash-management.service';
import { SalesController } from './controllers/sales.controller';
import { CashManagementController } from './controllers/cash-management.controller';
import { Product } from '../products/entities/product.entity';
import { RegisterSession } from '../cash/entities/register-session.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
// Phase 2 Integration Modules
import { KitchenModule } from '../kitchen/kitchen.module';
import { TablesModule } from '../tables/tables.module';
import { CashModule } from '../cash/cash.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SalesOrder,
            OrderItem,
            Payment,
            OrderSurcharge,
            OrderTax,
            OrderStateHistory,
            Refund,
            CashTransaction,
            BankDrop,
            Product,
            RegisterSession
        ]),
        InventoryModule,
        UsersModule, // For PinAuthorizationGuard access to User repository
        // Phase 2 Integration Modules (use forwardRef if needed)
        forwardRef(() => KitchenModule),
        forwardRef(() => TablesModule),
        forwardRef(() => CashModule),
    ],
    controllers: [SalesController, CashManagementController],
    providers: [SalesService, VoidOperationService, CashManagementService, AuditLogService],
    exports: [SalesService, VoidOperationService, CashManagementService],
})
export class SalesModule { }

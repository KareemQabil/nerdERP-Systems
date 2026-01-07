/**
 * Services Index
 * Re-export all services for convenient importing
 */

// Auth services
export { authService } from './auth.service';
export type {
    User as AuthUser,
    Role as AuthRole,
    LoginRequest,
    PinLoginRequest,
    VerifyPinRequest,
    VerifyPinResponse,
    ChangePinRequest,
    UnlockSessionRequest,
    AuthResponse,
} from './auth.service';

// Product services
export { categoryService, productService, modifierService } from './product.service';
export type { Category, Product, ProductVariant, ModifierGroup, Modifier } from './product.service';

// Order services
export { orderService } from './order.service';
export type {
    Order,
    OrderItem,
    OrderItemModifier,
    Payment,
    OrderDiscount,
    CreateOrderDto,
    CreateOrderItemDto,
    AddPaymentDto,
    UpdateOrderDto,
    OrderType,
    OrderStatus,
    PaymentStatus,
    PaymentMethod
} from './order.service';

// Customer services
export { customerService } from './customer.service';
export type {
    Customer,
    CreateCustomerDto,
    UpdateCustomerDto,
    CustomerOrder,
    LoyaltySummary,
    LoyaltyTransaction,
    CreditTransaction,
    LoyaltyTier
} from './customer.service';

// Store settings services
export { storeSettingsService } from './store-settings.service';
export type { StoreConfig, PaymentMethodConfig, TaxProfile, PrinterConfig } from './store-settings.service';

// ZATCA services
export { zatcaService } from './zatca.service';
export type {
    ZatcaQRData,
    InvoiceHashEntry,
    DailyTaxSummary,
    MonthlyTaxReport,
    VoidReportData as ZatcaVoidReportData,
    TaxExportData,
    HashChainStats,
} from './zatca.service';

// Audit services
export { auditService } from './audit.service';
export type {
    AuditLog,
    VoidReport,
    SecurityReport,
    AuditStatistics,
} from './audit.service';

// Inventory services
export { inventoryService } from './inventory.service';

// Kitchen services
export { kitchenService } from './kitchen.service';

// Printing services
export { printingService } from './printing.service';

// Reports services
export { reportsService } from './reports.service';

// Session services
export { registerSessionService as sessionService } from './session.service';

// Tables services
export { tablesService } from './tables.service';

// Delivery Zone services
export { deliveryZoneService } from './delivery-zone.service';

// Sync services
export { syncService } from './sync.service';

// Store Config services
export { storeConfigService } from './store-config.service';

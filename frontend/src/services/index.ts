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

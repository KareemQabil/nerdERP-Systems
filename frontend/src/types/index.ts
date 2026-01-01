/**
 * Type Definitions Index
 * Re-exports for backward compatibility and convenience
 */

// Export global API types
export * from './api.types';

// Export global config types
export * from './config.types';

// Re-export commonly used POS types from feature folder
export type {
    OrderType,
    OrderStatus,
    PaymentStatus,
    KitchenStatus,
    PaymentMethod,
    DiscountType,
    Order,
    CartItem,
    ProductInfo,
    CustomerInfo,
    TableInfo,
    DeliveryInfo,
    OrderDiscount,
    PaymentRecord,
    PinAuthorizationRequest,
    PinAuthorizationResult,
    VoidReason,
} from '@/features/pos/types';

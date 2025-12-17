// Customer (CRM) Types from nerdjson.md schema

/**
 * Customer Tier enum
 */
export type CustomerTier = 'REGULAR' | 'SILVER' | 'GOLD' | 'VIP';

/**
 * Address Type enum
 */
export type AddressType = 'BILLING' | 'SHIPPING';

/**
 * Loyalty Transaction Type enum
 */
export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';

/**
 * Customer entity
 * Maps to customers table in nerdjson.md
 */
export interface Customer {
    id: string;
    customerCode: string; // Unique
    phone: string; // Unique
    email?: string | null;
    name: string;
    nameAr?: string | null;
    taxId?: string | null;
    address?: string | null;

    // Financial
    creditLimit: string; // decimal(10,3)
    creditBalance: string; // decimal(10,3)

    // Loyalty
    loyaltyPoints: number;
    tier: CustomerTier;

    // Status
    isActive: boolean;
    createdAt: string; // ISO 8601

    // Relations
    addresses?: CustomerAddress[];
    loyaltyTransactions?: LoyaltyTransaction[];
}

/**
 * Loyalty Transaction entity
 * Maps to loyalty_transactions table in nerdjson.md
 */
export interface LoyaltyTransaction {
    id: string;
    customerId: string;
    orderId?: string | null;
    points: number;
    transactionType: LoyaltyTransactionType;
    createdAt: string; // ISO 8601
}

/**
 * Customer Address entity
 * Maps to customer_addresses table in nerdjson.md
 */
export interface CustomerAddress {
    id: string;
    customerId: string;
    addressType: AddressType;
    street: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
}

/**
 * Customer Filter DTO
 */
export interface CustomerFilterDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    tier?: CustomerTier;
    isActive?: boolean;
    search?: string; // Search by name, phone, email
}

/**
 * Create Customer DTO
 */
export interface CreateCustomerDto {
    phone: string;
    email?: string;
    name: string;
    nameAr?: string;
    taxId?: string;
    address?: string;
    creditLimit?: string; // Default 0
    tier?: CustomerTier; // Default REGULAR
}

/**
 * Update Customer DTO
 */
export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
    id: string;
}

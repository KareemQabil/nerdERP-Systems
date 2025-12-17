// Kitchen Management Types from nerdjson.md schema

/**
 * Kitchen Ticket Status enum
 */
export type KitchenTicketStatus =
    | 'PENDING'
    | 'PREPARING'
    | 'READY'
    | 'SERVED'
    | 'CANCELLED';

/**
 * Kitchen Ticket entity
 * Maps to kitchen_tickets table in nerdjson.md
 */
export interface KitchenTicket {
    id: string;
    ticketNumber: string; // Unique - K-261526
    orderId: string;
    orderItemId: string;

    // Routing
    stationId: string;
    printerId?: string | null;

    // Product info
    productName: string;
    quantity: string; // decimal(10,3)
    modifiersText?: string | null; // Readable version for kitchen
    specialInstructions?: string | null;

    // Status
    status: KitchenTicketStatus;
    priority: number; // Default 0, Higher = urgent

    // Timing
    sentToKitchenAt: string; // ISO 8601
    startedAt?: string | null; // ISO 8601
    completedAt?: string | null; // ISO 8601
    preparationTimeSeconds?: number | null;

    // Relations
    station?: KitchenStation;
    order?: any; // sales_orders
    orderItem?: any; // order_items
}

/**
 * Kitchen Station entity
 * Maps to kitchen_stations table in nerdjson.md
 */
export interface KitchenStation {
    id: string;
    name: string; // Grill, Salad Bar
    isActive: boolean; // Default true

    // Relations
    tickets?: KitchenTicket[];
    products?: any[]; // products with kitchen_station_id
}

/**
 * Printer entity
 * Maps to printers table in nerdjson.md
 */
export interface Printer {
    id: string;
    name: string;
    ipAddress: string;
    stationId: string;
    type: 'RECEIPT' | 'KITCHEN' | 'BAR' | 'LABEL';

    // Relations
    station?: KitchenStation;
}

/**
 * Create Kitchen Ticket DTO
 */
export interface CreateKitchenTicketDto {
    orderId: string;
    orderItemId: string;
    stationId: string;
    productName: string;
    quantity: string; // decimal(10,3)
    modifiersText?: string;
    specialInstructions?: string;
    priority?: number; // Default 0
}

/**
 * Update Ticket Status DTO
 */
export interface UpdateTicketStatusDto {
    ticketId: string;
    status: KitchenTicketStatus;
}

/**
 * Kitchen Ticket Filter DTO
 */
export interface KitchenTicketFilterDto {
    stationId?: string;
    status?: KitchenTicketStatus;
    dateFrom?: string; // ISO 8601
    dateTo?: string; // ISO 8601
}

/**
 * Kitchen Dashboard Stats (Calculated)
 */
export interface KitchenDashboardStats {
    pendingTickets: number;
    preparingTickets: number;
    readyTickets: number;
    averagePreparationTime: number; // seconds
    oldestTicketAge: number; // seconds
    ticketsCompletedToday: number;
}

/**
 * Kitchen Performance Metrics (Calculated)
 */
export interface KitchenPerformanceMetrics {
    stationId: string;
    stationName: string;
    ticketsCompleted: number;
    averageTime: number; // seconds
    fastestTime: number; // seconds
    slowestTime: number; // seconds
    currentLoad: number; // Active tickets
}

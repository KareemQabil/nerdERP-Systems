// Tables Management Types from nerdjson.md schema

/**
 * Table Zone entity
 * Maps to table_zones table in nerdjson.md
 */
export interface TableZone {
    id: string;
    name: string;
    nameAr?: string | null;
    displayOrder: number;
    colorHex: string; // UI color coding

    // Relations
    tables?: Table[];
}

/**
 * Table entity
 * Maps to tables table in nerdjson.md
 */
export interface Table {
    id: string;
    zoneId: string;
    name: string; // Table number/name
    capacity: number; // Number of seats
    isActive: boolean; // Default true
    qrCode?: string | null; // QR code for table

    // Relations
    zone?: TableZone;
    currentOrder?: any | null; // sales_orders (if occupied)

    // Computed
    status?: 'available' | 'occupied' | 'reserved' | 'inactive';
    currentOrderId?: string | null;
}

/**
 * Create Table DTO
 */
export interface CreateTableDto {
    zoneId: string;
    name: string;
    capacity: number;
    isActive?: boolean; // Default true
    qrCode?: string;
}

/**
 * Update Table DTO
 */
export interface UpdateTableDto extends Partial<CreateTableDto> {
    id: string;
}

/**
 * Create Table Zone DTO
 */
export interface CreateTableZoneDto {
    name: string;
    nameAr?: string;
    displayOrder: number;
    colorHex: string;
}

/**
 * Table Filter DTO
 */
export interface TableFilterDto {
    zoneId?: string;
    isActive?: boolean;
    status?: 'available' | 'occupied' | 'reserved' | 'inactive';
    search?: string; // Search by name
}

/**
 * Occupy Table DTO
 */
export interface OccupyTableDto {
    tableId: string;
    orderId: string;
    customerId?: string | null;
    guestCount?: number;
}

/**
 * Free Table DTO
 */
export interface FreeTableDto {
    tableId: string;
    orderId: string;
}

/**
 * Table with Status (Extended)
 */
export interface TableWithStatus extends Table {
    status: 'available' | 'occupied' | 'reserved' | 'inactive';
    currentOrderId?: string | null;
    currentOrderNumber?: string | null;
    occupiedSince?: string | null; // ISO 8601
    guestCount?: number | null;
    customerName?: string | null;
    orderTotal?: string | null; // decimal(10,3)
    duration?: number | null; // minutes
}

/**
 * Table Layout (For UI rendering)
 */
export interface TableLayout {
    zones: Array<{
        zone: TableZone;
        tables: TableWithStatus[];
    }>;
    summary: {
        totalTables: number;
        availableTables: number;
        occupiedTables: number;
        reservedTables: number;
        inactiveTables: number;
    };
}

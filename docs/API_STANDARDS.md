# NerdPOS API Standards & Conventions

## Project Context

**System:** NerdPOS Enterprise ERP  
**Architecture:** NestJS + TypeORM + PostgreSQL + typeorm-transactional  
**Compliance:** ZATCA (Saudi Arabia E-Invoicing Phase 2)  
**Version:** 2.0.0

---

## 1. Standardized Response Format

All API endpoints MUST return responses in this exact format.

### 1.1 Success Response Structure

```typescript
{
  "success": true,
  "data": T | T[] | PaginatedData<T>,
  "messageKey": "OPERATION_SUCCESS", // Optional
  "timestamp": "2025-01-26T14:30:00.000Z"
}
```

### 1.2 Paginated Response Structure

```typescript
{
  "success": true,
  "data": {
    "data": T[],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "totalPages": 16
    }
  },
  "timestamp": "2025-01-26T14:30:00.000Z"
}
```

### 1.3 Error Response Structure

```typescript
{
  "success": false,
  "error": {
    "code": "SALES_003",
    "messageKey": "ORDER_ALREADY_PAID",
    "message": "This order has already been paid and cannot be modified",
    "details": {
      "orderId": "uuid-here",
      "currentStatus": "PAID"
    }
  },
  "timestamp": "2025-01-26T14:30:00.000Z",
  "path": "/api/v1/sales/orders/abc-123/items"
}
```

---

## 2. NerdPOS Error Code Registry

### 2.1 Error Code Format

`MODULE_SEVERITY_SEQUENCE`

- **MODULE:** SALES, INV, ZATCA, CASH, KIT, PROD, CRM, AUTH, SYS
- **SEVERITY:** 0xx = Info, 1xx = Warning, 2xx = Error, 3xx = Critical
- **SEQUENCE:** 001-999

### 2.2 SALES Module (SALES_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| SALES_001 | ORDER_NOT_FOUND | Order does not exist | 404 | Invalid order_id |
| SALES_002 | ORDER_ALREADY_COMPLETED | Cannot modify completed order | 400 | order_status = COMPLETED |
| SALES_003 | ORDER_ALREADY_PAID | Order payment finalized | 400 | payment_status = PAID |
| SALES_004 | ORDER_ITEM_NOT_FOUND | Line item does not exist | 404 | Invalid order_item_id |
| SALES_005 | PAYMENT_AMOUNT_MISMATCH | Payment != order total | 400 | SUM(payments.amount) != total_gross |
| SALES_006 | REFUND_EXCEEDS_ORIGINAL | Refund > original payment | 400 | refund_amount > payment.amount |
| SALES_007 | ORDER_ALREADY_VOIDED | Order was voided | 400 | order_status = VOID |
| SALES_008 | INSUFFICIENT_MANAGER_AUTH | Manager approval required | 403 | Void/Refund without role |
| SALES_009 | REGISTER_SESSION_CLOSED | Session is closed | 400 | register_sessions.status = CLOSED |
| SALES_010 | INVALID_ORDER_TYPE | Unknown order type | 400 | Invalid enum value |
| SALES_011 | TABLE_ALREADY_OCCUPIED | Table has active order | 409 | Existing order with table_id |
| SALES_012 | SPLIT_PAYMENT_INCOMPLETE | Total payments < order total | 400 | SUM(payments) < total_gross |

### 2.3 INVENTORY Module (INV_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| INV_001 | BATCH_NOT_FOUND | Inventory batch missing | 404 | Invalid batch_id |
| INV_002 | INSUFFICIENT_STOCK | Not enough inventory | 400 | qty_required > available_stock |
| INV_003 | BATCH_EXPIRED | Batch past expiry_date | 400 | expiry_date < NOW() |
| INV_004 | NEGATIVE_STOCK | Stock cannot go negative | 400 | After move: stock < 0 |
| INV_005 | WAREHOUSE_INACTIVE | Warehouse disabled | 400 | warehouses.is_active = false |
| INV_006 | FIFO_CALCULATION_FAILED | Cost calculation error | 500 | No batches with stock |
| INV_007 | RECIPE_NOT_FOUND | BOM missing | 404 | No recipes for product_id |
| INV_008 | INGREDIENT_STOCK_LOW | Component shortage | 400 | Ingredient qty < required |
| INV_009 | PURCHASE_ORDER_LOCKED | PO cannot be modified | 400 | status = RECEIVED |
| INV_010 | STOCK_MOVE_IMMUTABLE | Cannot edit stock move | 403 | Audit trail violation |
| INV_011 | DUPLICATE_BATCH_CODE | Batch code exists | 409 | Unique constraint violation |
| INV_012 | INVALID_MOVE_TYPE | Unknown stock move type | 400 | Invalid enum value |

### 2.4 ZATCA Module (ZATCA_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| ZATCA_001 | HASH_CHAIN_BROKEN | Previous hash mismatch | 500 | Cryptographic chain invalid |
| ZATCA_002 | INVOICE_COUNTER_SKIP | Counter not sequential | 500 | Gap in invoice_counter |
| ZATCA_003 | XML_GENERATION_FAILED | Cannot create XML | 500 | UBL 2.1 format error |
| ZATCA_004 | QR_CODE_INVALID | QR TLV encoding failed | 500 | Base64 decode error |
| ZATCA_005 | SIGNATURE_MISSING | E-Invoice not signed | 400 | zatca_signature IS NULL |
| ZATCA_006 | SUBMISSION_FAILED | ZATCA API rejected | 502 | HTTP error from ZATCA |
| ZATCA_007 | UUID_DUPLICATE | Invoice UUID exists | 409 | zatca_xml_uuid constraint |
| ZATCA_008 | CUSTOMER_TAX_REQUIRED | B2B needs customer VAT | 400 | is_simplified_invoice = false AND customer.tax_id IS NULL |
| ZATCA_009 | CLEARANCE_TIMEOUT | ZATCA response delayed | 504 | Timeout > 30s |
| ZATCA_010 | INVOICE_ALREADY_CLEARED | Cannot resubmit | 400 | zatca_submission_status = APPROVED |

### 2.5 CASH Module (CASH_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| CASH_001 | SESSION_NOT_OPEN | Register not opened | 400 | status != OPEN |
| CASH_002 | SESSION_ALREADY_OPEN | Cannot open twice | 409 | Existing OPEN session for device |
| CASH_003 | CASH_DISCREPANCY | Cash count mismatch | 400 | \|actual - expected\| > tolerance |
| CASH_004 | NEGATIVE_FLOAT | Opening cash < 0 | 400 | opening_cash < 0 |
| CASH_005 | PAYOUT_EXCEEDS_CASH | Insufficient drawer cash | 400 | payout > available_cash |
| CASH_006 | SESSION_CLOSURE_LOCKED | Session already closed | 400 | closed_at IS NOT NULL |
| CASH_007 | BANK_DROP_INVALID | Drop > cash available | 400 | bank_drop > closing_cash |
| CASH_008 | DEVICE_SESSION_CONFLICT | Device has active session | 409 | Another session OPEN |

### 2.6 KITCHEN Module (KIT_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| KIT_001 | TICKET_NOT_FOUND | Kitchen ticket missing | 404 | Invalid ticket_id |
| KIT_002 | STATION_INACTIVE | Kitchen station offline | 400 | is_active = false |
| KIT_003 | TICKET_ALREADY_SERVED | Cannot modify served item | 400 | status = SERVED |
| KIT_004 | PRINTER_OFFLINE | Printer unreachable | 503 | Network timeout |
| KIT_005 | INVALID_STATUS_TRANSITION | Status change illegal | 400 | SERVED -> PREPARING |

### 2.7 PRODUCT Module (PROD_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| PROD_001 | PRODUCT_NOT_FOUND | Product does not exist | 404 | Invalid product_id |
| PROD_002 | SKU_DUPLICATE | SKU already exists | 409 | Unique constraint violation |
| PROD_003 | MODIFIER_REQUIRED | Must select modifier | 400 | is_required = true, none selected |
| PROD_004 | MODIFIER_MIN_NOT_MET | Too few selections | 400 | selected < min_selection |
| PROD_005 | MODIFIER_MAX_EXCEEDED | Too many selections | 400 | selected > max_selection |
| PROD_006 | PRODUCT_INACTIVE | Product disabled | 400 | is_active = false |
| PROD_007 | CATEGORY_NOT_FOUND | Category missing | 404 | Invalid category_id |
| PROD_008 | BARCODE_DUPLICATE | Barcode exists | 409 | Unique constraint violation |

### 2.8 CRM Module (CRM_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| CRM_001 | CUSTOMER_NOT_FOUND | Customer does not exist | 404 | Invalid customer_id |
| CRM_002 | CREDIT_LIMIT_EXCEEDED | Over credit limit | 400 | credit_balance > credit_limit |
| CRM_003 | PHONE_DUPLICATE | Phone already registered | 409 | Unique constraint violation |
| CRM_004 | INSUFFICIENT_LOYALTY_POINTS | Not enough points | 400 | redeem > loyalty_points |
| CRM_005 | CUSTOMER_INACTIVE | Customer account disabled | 400 | is_active = false |

### 2.9 AUTH Module (AUTH_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| AUTH_001 | INVALID_CREDENTIALS | Login failed | 401 | Wrong password |
| AUTH_002 | USER_NOT_FOUND | User does not exist | 404 | Invalid user_id |
| AUTH_003 | USER_INACTIVE | Account disabled | 403 | is_active = false |
| AUTH_004 | TOKEN_EXPIRED | JWT expired | 401 | exp < NOW() |
| AUTH_005 | INSUFFICIENT_PERMISSIONS | Role lacks permission | 403 | Permission check failed |
| AUTH_006 | PIN_CODE_INVALID | Wrong PIN | 401 | PIN mismatch |

### 2.10 SYSTEM Module (SYS_xxx)

| Code | Message Key | Description | HTTP Status | Trigger Condition |
|------|-------------|-------------|-------------|-------------------|
| SYS_001 | DEVICE_NOT_REGISTERED | Device unknown | 404 | Invalid device_id |
| SYS_002 | DEVICE_OFFLINE | Device unreachable | 503 | Last seen > 5 min |
| SYS_003 | TRANSACTION_DEADLOCK | Database deadlock | 409 | Concurrent transaction conflict |
| SYS_004 | TRANSACTION_ROLLBACK | Transaction failed | 500 | @Transactional rollback |
| SYS_005 | CONFIGURATION_MISSING | Setting not found | 500 | Invalid setting_key |

---

## 3. Filtering & Sorting Standards

### 3.1 Base Filter DTO (All Endpoints)

```typescript
export class BaseFilterDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

### 3.2 Module-Specific Filter DTOs

#### Sales Orders Filter

```typescript
export class SalesOrderFilterDto extends BaseFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  registerSessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNumber?: string; // Partial match
}
```

#### Inventory Filter

```typescript
export class StockMovesFilterDto extends BaseFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: MoveType })
  @IsOptional()
  @IsEnum(MoveType)
  moveType?: MoveType;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;
}
```

### 3.3 Mapping Filters to TypeORM

**Service Layer Implementation:**

```typescript
async findWithFilters(
  filterDto: SalesOrderFilterDto,
): Promise<PaginatedResult<OrderResponseDto>> {
  const findOptions: FindManyOptions<SalesOrder> = {
    where: {},
    order: {
      [filterDto.sortBy]: filterDto.sortOrder,
    },
  };

  // Build WHERE clause
  if (filterDto.registerSessionId) {
    findOptions.where['registerSessionId'] = filterDto.registerSessionId;
  }

  if (filterDto.orderStatus) {
    findOptions.where['orderStatus'] = filterDto.orderStatus;
  }

  if (filterDto.dateFrom || filterDto.dateTo) {
    findOptions.where['createdAt'] = Between(
      filterDto.dateFrom || new Date('1970-01-01'),
      filterDto.dateTo || new Date(),
    );
  }

  if (filterDto.orderNumber) {
    findOptions.where['orderNumber'] = Like(`%${filterDto.orderNumber}%`);
  }

  // Relations
  findOptions.relations = ['customer', 'items', 'payments'];

  return this.repository.findWithPagination(
    { page: filterDto.page, limit: filterDto.limit },
    findOptions,
  );
}
```

---

## 4. HTTP Status Code Usage

| Status Code | Usage in NerdPOS | Example |
|-------------|------------------|---------|
| **200 OK** | Successful GET, PUT | Get order details |
| **201 Created** | Successful POST | Create new order |
| **204 No Content** | Successful DELETE | Delete product |
| **400 Bad Request** | Validation error, Business logic violation | SALES_003, PROD_003 |
| **401 Unauthorized** | Authentication failed | AUTH_001, AUTH_004 |
| **403 Forbidden** | Insufficient permissions | AUTH_005, SALES_008 |
| **404 Not Found** | Resource does not exist | SALES_001, INV_001 |
| **409 Conflict** | Unique constraint violation, State conflict | SALES_011, PROD_002 |
| **422 Unprocessable Entity** | DTO validation failed | class-validator errors |
| **500 Internal Server Error** | Unexpected system error | Transaction rollback |
| **502 Bad Gateway** | External service failure | ZATCA_006 |
| **503 Service Unavailable** | Service temporarily down | KIT_004 |
| **504 Gateway Timeout** | External service timeout | ZATCA_009 |

---

## 5. Date/Time Standards

### 5.1 Format

- **Storage:** Always UTC in PostgreSQL `TIMESTAMP WITH TIME ZONE`
- **API:** ISO 8601 format `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example:** `2025-01-26T14:30:00.000Z`

### 5.2 Timezone Handling

```typescript
// Backend: Always convert to UTC before saving
const createdAt = new Date(); // Automatically UTC in PostgreSQL

// Frontend: Convert to local timezone for display
const localTime = new Date(order.createdAt).toLocaleString('ar-SA', {
  timeZone: 'Asia/Riyadh',
});
```

---

## 6. Decimal Precision Standards

### 6.1 Schema-Wide Standards

| Field Type | Precision | Example | Usage |
|------------|-----------|---------|-------|
| **Money** | `decimal(10,3)` | 1234.567 | Prices, amounts (3 decimals for SAR Halala) |
| **Quantity** | `decimal(10,3)` | 5.250 | Stock quantities, order quantities |
| **Tax Rate** | `decimal(5,2)` | 15.00 | Percentage (15.00%) |
| **Weight/Volume** | `decimal(10,3)` | 2.500 | kg, liters |

### 6.2 TypeORM Column Definitions

```typescript
@Column({ type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer() })
salePrice: number;

// Custom Transformer
class DecimalTransformer implements ValueTransformer {
  to(value: number): string {
    return value?.toFixed(3);
  }
  
  from(value: string): number {
    return parseFloat(value);
  }
}
```

### 6.3 Frontend Handling

```typescript
// Always use libraries for decimal math
import Decimal from 'decimal.js';

const subtotal = new Decimal(orderItem.unitPrice)
  .times(orderItem.quantity)
  .toDecimalPlaces(3);

// Display formatting
const displayPrice = subtotal.toFixed(2); // "1234.57" for UI
```

---

## 7. Request/Response Examples

### 7.1 Create Order (Success)

**Request:**
```http
POST /api/v1/sales/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "registerSessionId": "uuid-session",
  "deviceId": "uuid-device",
  "orderType": "DINE_IN",
  "tableId": "uuid-table",
  "items": [
    {
      "productId": "uuid-product",
      "quantity": 2,
      "selectedModifiers": [
        {
          "modifierId": "uuid-modifier",
          "optionId": "uuid-option"
        }
      ],
      "specialInstructions": "No onions"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-order",
    "orderNumber": "ORD-20250126-0042",
    "publicRef": "K-142",
    "orderStatus": "DRAFT",
    "paymentStatus": "UNPAID",
    "subtotal": 45.500,
    "totalTax": 6.825,
    "totalGross": 52.325,
    "items": [
      {
        "id": "uuid-item",
        "lineNumber": 1,
        "productName": "Beef Burger",
        "quantity": 2,
        "unitPrice": 20.000,
        "modifiersTotal": 2.750,
        "lineTotal": 45.500
      }
    ]
  },
  "messageKey": "ORDER_CREATED",
  "timestamp": "2025-01-26T14:30:00.000Z"
}
```

### 7.2 FIFO Stock Deduction (Error)

**Request:**
```http
POST /api/v1/sales/orders/uuid-order/complete
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "INV_002",
    "messageKey": "INSUFFICIENT_STOCK",
    "message": "Not enough inventory available to complete this order",
    "details": {
      "productId": "uuid-product",
      "productName": "Beef Patty",
      "requiredQuantity": 10,
      "availableQuantity": 3,
      "warehouseId": "uuid-warehouse"
    }
  },
  "timestamp": "2025-01-26T14:30:00.000Z",
  "path": "/api/v1/sales/orders/uuid-order/complete"
}
```

### 7.3 ZATCA Hash Chain Broken (Critical Error)

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "ZATCA_001",
    "messageKey": "HASH_CHAIN_BROKEN",
    "message": "Cryptographic hash chain is broken - invoice sequence compromised",
    "details": {
      "orderId": "uuid-order",
      "expectedPreviousHash": "abc123...",
      "actualPreviousHash": "def456...",
      "invoiceCounter": 42,
      "registerSessionId": "uuid-session",
      "action": "SYSTEM_HALT_REQUIRED"
    }
  },
  "timestamp": "2025-01-26T14:30:00.000Z",
  "path": "/api/v1/sales/orders/uuid-order/generate-invoice"
}
```

---

## 8. Validation Rules Summary

### 8.1 Required Business Validations

| Entity | Field | Validation Rule |
|--------|-------|----------------|
| **sales_orders** | total_gross | Must equal subtotal - discount + total_tax |
| **sales_orders** | invoice_counter | Must be sequential per register_session |
| **order_items** | line_subtotal | (unit_price + modifiers_total) * qty - line_discount |
| **order_items** | selected_modifiers | Must meet min_selection/max_selection |
| **payments** | SUM(amount) | Must equal or exceed order.total_gross |
| **inventory_batches** | qty_remaining | Calculated from stock_moves, never negative |
| **register_sessions** | closing_cash_expected | opening_cash + cash_in - cash_out |
| **kitchen_tickets** | status | Cannot go SERVED -> PREPARING |

### 8.2 DTO Validation Decorators

```typescript
export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  registerSessionId: string;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  items: CreateOrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
```

---

## 9. Audit & Compliance

### 9.1 Audit Log Entry Format

Every write operation MUST create an audit log entry:

```typescript
{
  "id": "uuid",
  "createdAt": "2025-01-26T14:30:00.000Z",
  "userId": "uuid-user",
  "action": "CREATE_ORDER",
  "entityType": "sales_orders",
  "entityId": "uuid-order",
  "oldValues": null,
  "newValues": {
    "orderNumber": "ORD-20250126-0042",
    "totalGross": 52.325
  },
  "ipAddress": "192.168.1.100",
  "deviceId": "uuid-device"
}
```

### 9.2 ZATCA Compliance Checklist

Every invoice (sales_order with payment) MUST have:

- ✅ `zatca_xml_uuid` (unique per invoice)
- ✅ `zatca_invoice_hash` (SHA256 of XML)
- ✅ `zatca_previous_hash` (links to previous invoice)
- ✅ `zatca_qr_code` (TLV-encoded Base64)
- ✅ `invoice_counter` (sequential per register_session)
- ✅ `is_simplified_invoice` (B2C=true, B2B=false)
- ✅ If B2B: `customer.tax_id` IS NOT NULL

---

## 10. Performance & Caching Guidelines

### 10.1 Indexes Required

```sql
-- Critical indexes from schema
CREATE INDEX idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX idx_sales_orders_register_session ON sales_orders(register_session_id);
CREATE INDEX idx_stock_moves_created_at ON stock_moves(created_at);
CREATE INDEX idx_stock_moves_product_id ON stock_moves(product_id);
CREATE INDEX idx_kitchen_tickets_station ON kitchen_tickets(station_id);
```

### 10.2 Cache Strategy

| Entity | TTL | Invalidation Trigger |
|--------|-----|---------------------|
| **Products** | 1 hour | Product update |
| **Product Categories** | 6 hours | Category update |
| **Modifiers** | 1 hour | Modifier update |
| **Kitchen Stations** | 1 day | Station update |
| **System Settings** | 5 minutes | Setting update |

**Do NOT cache:**
- Sales orders
- Inventory batches
- Register sessions
- Kitchen tickets

---

## 11. WebSocket Event Standards

### 11.1 Event Naming Convention

`module:entity:action`

Examples:
- `kitchen:ticket:created`
- `sales:order:paid`
- `inventory:stock:low`
- `cash:session:closed`

### 11.2 Event Payload Format

```typescript
{
  "event": "kitchen:ticket:created",
  "timestamp": "2025-01-26T14:30:00.000Z",
  "data": {
    "ticketId": "uuid",
    "ticketNumber": "K-142",
    "stationId": "uuid-grill",
    "productName": "Beef Burger",
    "quantity": 2,
    "priority": 0
  }
}
```

---

## 12. API Versioning

- **Current Version:** v1
- **Base Path:** `/api/v1`
- **Breaking Changes:** Require new version (v2)
- **Deprecation Notice:** 6 months before removal

---

## 13. Rate Limiting

| Endpoint Type | Rate Limit | Window |
|--------------|------------|--------|
| **Authentication** | 5 requests | 1 minute |
| **Read Operations** | 100 requests | 1 minute |
| **Write Operations** | 50 requests | 1 minute |
| **ZATCA Submission** | 10 requests | 1 minute |

---

## 14. Security Headers

All responses MUST include:

```
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

**Document Version:** 2.0.0  
**Last Updated:** 2025-01-26  
**Maintained By:** NerdPOS Backend Team
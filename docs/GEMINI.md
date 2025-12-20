# NerdPOS Master Development Guide (Gemini Edition)

**System:** NerdPOS Enterprise ERP  
**Stack:** NestJS + TypeORM + PostgreSQL + React + Vite + Zustand  
**Compliance:** ZATCA Phase 2 (Saudi Arabia E-Invoicing)  
**Version:** 2.0.0  
**Last Updated:** 2025-01-26

---

## 📋 Table of Contents

1. [Core Architecture Principles](#1-core-architecture-principles)
2. [API Standards & Error Codes](#2-api-standards--error-codes)
3. [Database Schema Rules](#3-database-schema-rules)
4. [Transaction Management](#4-transaction-management)
5. [Critical Algorithms](#5-critical-algorithms)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Testing Requirements](#7-testing-requirements)
8. [Security & Compliance](#8-security--compliance)
9. [Development Workflow](#9-development-workflow)
10. [Quick Reference](#10-quick-reference)

---

## 1. Core Architecture Principles

### 1.1 Backend Rules (NestJS)

1. **ALWAYS** use `@Transactional()` decorator on write operations (create, update, delete)
2. **NEVER** use `@Transactional()` on read operations (findAll, findById)
3. **ALWAYS** call `initializeTransactionalContext()` FIRST in `main.ts` before creating NestJS app
4. **ALWAYS** extend `GenericService<T, CreateDto, UpdateDto, ResponseDto>` for all services
5. **ALWAYS** extend `GenericRepository<T>` for all repositories
6. **ALWAYS** use `decimal(10,3)` for money and quantity fields
7. **ALWAYS** store dates in UTC using `TIMESTAMP WITH TIME ZONE`
8. **NEVER** modify data without creating audit log entries
9. **ALWAYS** validate business rules before database operations
10. **ALWAYS** use UUIDs for primary keys

### 1.2 Frontend Rules (React)

1. **ALWAYS** use `Decimal.js` for money calculations, NEVER use JavaScript `Number`
2. **ALWAYS** use Zustand stores per module (sales, inventory, cash, etc.)
3. **ALWAYS** use TanStack Query for server state management
4. **ALWAYS** use Shadcn/UI components, NEVER create custom UI from scratch
5. **ALWAYS** format backend decimals with `DecimalUtil` helper functions
6. **ALWAYS** handle loading and error states in components
7. **NEVER** store sensitive data in localStorage without encryption
8. **ALWAYS** use React.lazy() for route-based code splitting
9. **ALWAYS** validate forms using Zod schema + React Hook Form
10. **ALWAYS** use WebSocket for real-time kitchen display updates

### 1.3 Project Structure Rules

1. Backend modules MUST follow this structure:
   ```
   src/modules/{module}/
   ├── controllers/
   ├── services/
   ├── entities/
   ├── dto/
   └── types/
   ```

2. Frontend modules MUST follow this structure:
   ```
   src/modules/{module}/
   ├── components/
   ├── hooks/
   ├── store/
   ├── types/
   ├── utils/
   └── pages/
   ```

3. **NEVER** import from parent modules (avoid circular dependencies)
4. **ALWAYS** use absolute imports with `@/` prefix
5. **ALWAYS** co-locate tests next to source files (`*.spec.ts`, `*.test.tsx`)

---

## 2. API Standards & Error Codes

### 2.1 Response Format (ALL Endpoints)

**Success Response:**
```json
{
  "success": true,
  "data": { /* entity or array */ },
  "messageKey": "OPTIONAL_I18N_KEY",
  "timestamp": "2025-01-26T14:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "MODULE_XXX",
    "messageKey": "ERROR_KEY",
    "message": "Human-readable error",
    "details": { /* optional context */ }
  },
  "timestamp": "2025-01-26T14:30:00.000Z",
  "path": "/api/v1/endpoint"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "data": [ /* items */ ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "timestamp": "2025-01-26T14:30:00.000Z"
}
```

### 2.2 Critical Error Codes (Memorize These)

| Code | Meaning | Action Required |
|------|---------|-----------------|
| **ZATCA_001** | Hash chain broken | STOP all invoicing, investigate immediately |
| **INV_002** | Insufficient stock | Block order completion, alert user |
| **SALES_003** | Order already paid | Prevent modifications, show read-only view |
| **AUTH_004** | Token expired | Redirect to login, clear local storage |
| **CASH_001** | Session not open | Force register session open dialog |
| **SYS_004** | Transaction rollback | Log error, retry with exponential backoff |

### 2.3 Complete Error Code Registry

#### SALES Module (SALES_xxx)
- `SALES_001` - Order not found (404)
- `SALES_002` - Order already completed (400)
- `SALES_003` - Order already paid (400)
- `SALES_004` - Order item not found (404)
- `SALES_005` - Payment amount mismatch (400)
- `SALES_006` - Refund exceeds original (400)
- `SALES_007` - Order already voided (400)
- `SALES_008` - Insufficient manager auth (403)
- `SALES_009` - Register session closed (400)
- `SALES_010` - Invalid order type (400)
- `SALES_011` - Table already occupied (409)
- `SALES_012` - Split payment incomplete (400)

#### INVENTORY Module (INV_xxx)
- `INV_001` - Batch not found (404)
- `INV_002` - Insufficient stock (400)
- `INV_003` - Batch expired (400)
- `INV_004` - Negative stock (400)
- `INV_005` - Warehouse inactive (400)
- `INV_006` - FIFO calculation failed (500)
- `INV_007` - Recipe not found (404)
- `INV_008` - Ingredient stock low (400)
- `INV_009` - Purchase order locked (400)
- `INV_010` - Stock move immutable (403)

#### ZATCA Module (ZATCA_xxx)
- `ZATCA_001` - Hash chain broken (500) ⚠️ CRITICAL
- `ZATCA_002` - Invoice counter skip (500)
- `ZATCA_003` - XML generation failed (500)
- `ZATCA_004` - QR code invalid (500)
- `ZATCA_005` - Signature missing (400)
- `ZATCA_006` - Submission failed (502)
- `ZATCA_007` - UUID duplicate (409)
- `ZATCA_008` - Customer tax required (400)

#### CASH Module (CASH_xxx)
- `CASH_001` - Session not open (400)
- `CASH_002` - Session already open (409)
- `CASH_003` - Cash discrepancy (400)
- `CASH_004` - Negative float (400)
- `CASH_005` - Payout exceeds cash (400)

#### AUTH Module (AUTH_xxx)
- `AUTH_001` - Invalid credentials (401)
- `AUTH_002` - User not found (404)
- `AUTH_003` - User inactive (403)
- `AUTH_004` - Token expired (401)
- `AUTH_005` - Insufficient permissions (403)
- `AUTH_006` - PIN code invalid (401)

### 2.4 HTTP Status Code Rules

| Status | Usage | Example |
|--------|-------|---------|
| 200 | Successful GET/PUT | Get order details |
| 201 | Successful POST | Create order |
| 204 | Successful DELETE | Delete product |
| 400 | Validation/Business error | INV_002, SALES_003 |
| 401 | Authentication failed | AUTH_001, AUTH_004 |
| 403 | Authorization failed | AUTH_005, SALES_008 |
| 404 | Resource not found | SALES_001, INV_001 |
| 409 | Conflict | SALES_011 (table occupied) |
| 422 | DTO validation failed | class-validator errors |
| 500 | System error | ZATCA_001, transaction rollback |
| 502 | External service error | ZATCA_006 |
| 503 | Service unavailable | Printer offline |

---

## 3. Database Schema Rules

### 3.1 Column Naming Conventions

1. **Primary Keys:** Always `id` (UUID v4)
2. **Foreign Keys:** `{entity}_id` (e.g., `customer_id`, `product_id`)
3. **Booleans:** `is_{attribute}` or `has_{attribute}` (e.g., `is_active`, `has_tax`)
4. **Dates:** `{action}_at` (e.g., `created_at`, `closed_at`)
5. **Money/Decimals:** `{field}_amount` or `{field}_price` (e.g., `total_amount`, `sale_price`)
6. **Enums:** SCREAMING_SNAKE_CASE (e.g., `DINE_IN`, `PAID`, `PREPARING`)

### 3.2 Decimal Precision Standards

| Field Type | TypeORM Definition | Example Value |
|------------|-------------------|---------------|
| **Money (SAR)** | `decimal(10,3)` | `1234.567` |
| **Quantity** | `decimal(10,3)` | `5.250` |
| **Tax Rate** | `decimal(5,2)` | `15.00` |
| **Weight/Volume** | `decimal(10,3)` | `2.500` |

**TypeORM Column Example:**
```typescript
@Column({ 
  type: 'decimal', 
  precision: 10, 
  scale: 3, 
  transformer: new DecimalTransformer() 
})
salePrice: number;
```

### 3.3 Required Indexes

```sql
-- Critical Performance Indexes
CREATE INDEX idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX idx_sales_orders_session ON sales_orders(register_session_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_stock_moves_product ON stock_moves(product_id);
CREATE INDEX idx_stock_moves_batch ON stock_moves(batch_id);
CREATE INDEX idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX idx_kitchen_tickets_station ON kitchen_tickets(station_id);
CREATE INDEX idx_payments_order ON payments(order_id);
```

### 3.4 Audit Trail Requirements

**ALL write operations MUST log:**
```typescript
{
  entityName: string;       // "SalesOrder"
  entityId: string;          // "uuid-123"
  action: string;            // "CREATE" | "UPDATE" | "DELETE"
  oldValues: object | null;  // Previous state
  newValues: object;         // New state
  userId: string;            // Who performed action
  deviceId: string;          // Which device
  timestamp: Date;           // When
  ipAddress: string;         // From where
}
```

---

## 4. Transaction Management

### 4.1 When to Use @Transactional

**✅ ALWAYS USE on:**
- `create()`, `createBulk()`
- `update()`, `updateBulk()`
- `delete()`, `softDelete()`
- Any method that modifies database state
- Methods calling multiple write operations

**❌ NEVER USE on:**
- `findAll()`, `findById()`, `findOne()`
- Read-only query methods
- Simple SELECT operations

### 4.2 Transaction Example: Complete Order

```typescript
@Injectable()
export class OrderService {
  @Transactional() // 🔥 CRITICAL: Wraps entire method in transaction
  async completeOrder(orderId: string, deviceId: string): Promise<SalesOrder> {
    // 1. Validate order
    const order = await this.validateOrder(orderId);

    // 2. Validate payments
    await this.paymentService.validatePaymentSplit(orderId);

    // 3. Generate ZATCA hash
    await this.zatcaService.generateInvoiceHash(order, deviceId);

    // 4. Deduct inventory (FIFO + Recipes)
    for (const item of order.items) {
      await this.recipeService.deductRecipe(
        item.product.id,
        item.quantity,
        order.warehouseId,
        orderId
      );
    }

    // 5. Update register session
    await this.registerService.updateSessionBalance(order.registerSessionId);

    // 6. Award loyalty points
    if (order.customer) {
      await this.loyaltyService.awardPoints(order.customer.id, orderId, order.totalGross);
    }

    // 7. Finalize order
    order.paymentStatus = 'PAID';
    return await this.orderRepo.save(order);

    // If ANY step fails, ALL changes are automatically rolled back
  }
}
```

### 4.3 Nested Transactions

**Rule:** Nested `@Transactional` methods share the same transaction.

```typescript
@Transactional()
async outerMethod() {
  await this.step1(); // Shares transaction
  await this.step2(); // Shares transaction
  // If step2 throws, step1 is ALSO rolled back
}

@Transactional()
async step1() { /* ... */ }

@Transactional()
async step2() { /* ... */ }
```

### 4.4 Transaction Initialization (main.ts)

**⚠️ CRITICAL: This MUST be the FIRST line in bootstrap():**

```typescript
async function bootstrap() {
  // 🔥 MUST BE FIRST - Before creating NestJS app
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  // ... rest of setup
}
```

---

## 5. Critical Algorithms

### 5.1 ZATCA Hash Chain Algorithm

**Purpose:** Link all invoices cryptographically per ZATCA Phase 2 compliance.

**Rules:**
1. First invoice: `previous_hash = NULL`
2. Subsequent invoices: `previous_hash = last_invoice.invoice_hash`
3. Hash = SHA-256(`previous_hash + order_data`)
4. If chain breaks → HALT all invoicing

**Implementation:**
```typescript
@Transactional()
async generateInvoiceHash(order: SalesOrder, deviceId: string): Promise<void> {
  // Step 1: Get previous hash
  const previousHash = await this.getLastInvoiceHash(deviceId);

  // Step 2: Generate canonical string
  const canonicalString = [
    order.orderNumber,
    order.createdAt.toISOString(),
    order.totalGross.toFixed(3),
    order.totalTax.toFixed(3),
    previousHash || 'GENESIS',
  ].join('|');

  // Step 3: Calculate hash
  const invoiceHash = createHash('sha256')
    .update(canonicalString, 'utf8')
    .digest('hex');

  // Step 4: Generate QR code (TLV format)
  const qrCode = this.generateQRCode(order, invoiceHash);

  // Step 5: Update order
  order.previousHash = previousHash;
  order.invoiceHash = invoiceHash;
  order.zatcaQrCode = qrCode;
}
```

**Validation:**
```typescript
@Transactional()
async validateHashChain(deviceId: string): Promise<{ valid: boolean; brokenAt?: string }> {
  const orders = await this.getAllInvoices(deviceId);

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const expectedPreviousHash = i === 0 ? null : orders[i - 1].invoiceHash;

    if (order.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenAt: order.orderNumber };
    }

    // Recalculate and verify hash
    const calculatedHash = this.calculateHash(order);
    if (calculatedHash !== order.invoiceHash) {
      return { valid: false, brokenAt: order.orderNumber };
    }
  }

  return { valid: true };
}
```

### 5.2 FIFO Inventory Costing Algorithm

**Purpose:** Deduct oldest inventory batches first (First-In, First-Out).

**Rules:**
1. Sort batches by `received_date ASC` (oldest first)
2. Deduct from oldest batch until `qty_remaining = 0`
3. Move to next batch if more quantity needed
4. Create `stock_move` record for each batch consumed
5. Calculate weighted average COGS

**Implementation:**
```typescript
@Transactional()
async deductInventory(
  productId: string,
  warehouseId: string,
  requiredQty: string,
  referenceType: string,
  referenceId: string
): Promise<DeductionResult> {
  // Step 1: Get batches in FIFO order (oldest first)
  const batches = await this.batchRepo
    .createQueryBuilder('batch')
    .where('batch.product_id = :productId', { productId })
    .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
    .andWhere('batch.qty_remaining > :zero', { zero: '0.000' })
    .andWhere('(batch.expiry_date IS NULL OR batch.expiry_date > :now)', { now: new Date() })
    .orderBy('batch.received_date', 'ASC') // 🔥 FIFO: Oldest first
    .getMany();

  // Step 2: Check availability
  const totalAvailable = batches.reduce(
    (sum, batch) => sum.plus(batch.qtyRemaining),
    new Decimal(0)
  );

  if (totalAvailable.lessThan(requiredQty)) {
    throw new BadRequestException({ code: 'INV_002', message: 'Insufficient stock' });
  }

  // Step 3: Deduct from batches
  let remainingQty = new Decimal(requiredQty);
  const batchesUsed = [];

  for (const batch of batches) {
    if (remainingQty.isZero()) break;

    const batchQtyRemaining = new Decimal(batch.qtyRemaining);
    const qtyToDeduct = Decimal.min(remainingQty, batchQtyRemaining);
    const costPerUnit = new Decimal(batch.costPerUnit);
    const totalCost = qtyToDeduct.times(costPerUnit);

    // Update batch
    batch.qtyRemaining = batchQtyRemaining.minus(qtyToDeduct).toFixed(3);
    await this.batchRepo.save(batch);

    // Create stock move
    await this.stockMoveRepo.save({
      batchId: batch.id,
      productId,
      warehouseId,
      moveType: 'OUT',
      quantity: qtyToDeduct.toFixed(3),
      costPerUnit: costPerUnit.toFixed(3),
      referenceType,
      referenceId,
    });

    batchesUsed.push({
      batchId: batch.id,
      quantityUsed: qtyToDeduct.toFixed(3),
      costPerUnit: costPerUnit.toFixed(3),
      totalCost: totalCost.toFixed(3),
    });

    remainingQty = remainingQty.minus(qtyToDeduct);
  }

  // Step 4: Calculate weighted average cost
  const totalCost = batchesUsed.reduce(
    (sum, batch) => sum.plus(batch.totalCost),
    new Decimal(0)
  );
  const averageCost = totalCost.dividedBy(requiredQty);

  return {
    success: true,
    batchesUsed,
    totalCost: totalCost.toFixed(3),
    averageCost: averageCost.toFixed(3),
  };
}
```

### 5.3 Recipe Deduction Algorithm (Multi-Level BOM)

**Purpose:** Deduct recipe ingredients recursively for prepared products.

**Rules:**
1. Check if `product.is_prepared = TRUE`
2. Load all `recipes` for this product
3. For each ingredient:
   - If ingredient is ALSO prepared → recursively deduct its recipes
   - If ingredient is raw material → deduct using FIFO
4. All deductions must succeed or entire transaction rolls back

**Implementation:**
```typescript
@Transactional()
async deductRecipe(
  productId: string,
  quantity: string,
  warehouseId: string,
  referenceId: string
): Promise<RecipeDeductionLog[]> {
  const deductionLog: RecipeDeductionLog[] = [];

  await this.deductRecursive(
    productId,
    quantity,
    warehouseId,
    referenceId,
    0, // level
    deductionLog
  );

  return deductionLog;
}

@Transactional()
private async deductRecursive(
  productId: string,
  quantity: string,
  warehouseId: string,
  referenceId: string,
  level: number,
  deductionLog: RecipeDeductionLog[]
): Promise<void> {
  const product = await this.productRepo.findOneOrFail({ where: { id: productId } });

  // Base case: Raw material → deduct directly using FIFO
  if (!product.isPrepared || !product.trackInventory) {
    if (product.trackInventory) {
      await this.inventoryService.deductInventory(
        productId,
        warehouseId,
        quantity,
        'RECIPE',
        referenceId
      );

      deductionLog.push({
        productName: product.name,
        quantityUsed: quantity,
        level,
      });
    }
    return;
  }

  // Recursive case: Prepared product → load recipes and deduct each ingredient
  const recipes = await this.recipeRepo.find({
    where: { product: { id: productId } },
    relations: ['rawProduct'],
  });

  if (recipes.length === 0) {
    throw new BadRequestException({ 
      code: 'INV_007', 
      message: `No recipe defined for prepared product: ${product.name}` 
    });
  }

  for (const recipe of recipes) {
    // Calculate quantity needed for this ingredient
    const qtyPerUnit = new Decimal(recipe.quantityRequired);
    const orderQty = new Decimal(quantity);
    const totalQtyNeeded = qtyPerUnit.times(orderQty);

    // Recursively deduct (may trigger further recipe expansion)
    await this.deductRecursive(
      recipe.rawProduct.id,
      totalQtyNeeded.toFixed(3),
      warehouseId,
      referenceId,
      level + 1,
      deductionLog
    );
  }
}
```

**Example Multi-Level BOM:**
```
Chicken Burger (Prepared)
├── Burger Bun (Raw) → 1 unit
├── Grilled Chicken Patty (Prepared)
│   ├── Chicken Breast (Raw) → 150g
│   ├── Spice Mix (Raw) → 10g
│   └── Oil (Raw) → 5ml
├── Lettuce (Raw) → 20g
└── Tomato (Raw) → 30g

Selling 2x Chicken Burgers deducts:
- 2x Burger Bun
- 300g Chicken Breast (2 * 150g)
- 20g Spice Mix (2 * 10g)
- 10ml Oil (2 * 5ml)
- 40g Lettuce (2 * 20g)
- 60g Tomato (2 * 30g)
```

### 5.4 Payment Split Validation

**Purpose:** Validate that multiple payment methods sum to order total.

```typescript
@Transactional()
async validatePaymentSplit(orderId: string): Promise<boolean> {
  const order = await this.orderRepo.findOne({
    where: { id: orderId },
    relations: ['payments'],
  });

  const totalGross = new Decimal(order.totalGross);
  const totalPaid = order.payments.reduce(
    (sum, payment) => sum.plus(payment.amount),
    new Decimal(0)
  );

  const difference = totalGross.minus(totalPaid).abs();

  // Allow 0.01 SAR tolerance (1 Halala)
  return difference.lessThanOrEqualTo('0.01');
}
```

### 5.5 Register Session Balance Calculation

**Purpose:** Calculate expected cash balance in register session.

```typescript
@Transactional()
async calculateExpectedBalance(sessionId: string): Promise<string> {
  const session = await this.sessionRepo.findOne({
    where: { id: sessionId },
    relations: ['payments', 'cashTransactions'],
  });

  let balance = new Decimal(session.openingBalance);

  // Add cash sales
  const cashSales = session.payments
    .filter((p) => p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
  balance = balance.plus(cashSales);

  // Subtract drops to safe
  const drops = session.cashTransactions
    .filter((t) => t.transactionType === 'DROP_TO_SAFE')
    .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
  balance = balance.minus(drops);

  // Subtract petty cash
  const pettyCash = session.cashTransactions
    .filter((t) => t.transactionType === 'PETTY_CASH')
    .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
  balance = balance.minus(pettyCash);

  return balance.toFixed(3);
}
```

---

## 6. Frontend Architecture

### 6.1 Technology Stack

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.2",
    "decimal.js": "^10.4.3",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.2"
  }
}
```

### 6.2 Decimal Handling (CRITICAL)

**❌ NEVER use JavaScript Number for money:**
```typescript
// WRONG - Floating point errors
const total = 0.1 + 0.2; // 0.30000000000004
```

**✅ ALWAYS use Decimal.js:**
```typescript
import Decimal from 'decimal.js';

// Correct - Exact precision
const total = new Decimal(0.1).plus(0.2).toNumber(); // 0.3
```

**Decimal Utility Functions:**
```typescript
// src/shared/lib/decimal.ts
export class DecimalUtil {
  static add(a: number | string, b: number | string): Decimal {
    return new Decimal(a).plus(b);
  }

  static subtract(a: number | string, b: number | string): Decimal {
    return new Decimal(a).minus(b);
  }

  static multiply(a: number | string, b: number | string): Decimal {
    return new Decimal(a).times(b);
  }

  static divide(a: number | string, b: number | string): Decimal {
    return new Decimal(a).dividedBy(b);
  }

  static calculatePercentage(amount: number | string, percentage: number | string): Decimal {
    return new Decimal(amount).times(percentage).dividedBy(100);
  }

  static round(value: number | string, decimals = 3): string {
    return new Decimal(value).toFixed(decimals);
  }

  static formatForDisplay(value: number | string): string {
    return new Decimal(value).toFixed(2); // 2 decimals for UI
  }

  static sum(values: (number | string)[]): Decimal {
    return values.reduce((acc, val) => acc.plus(val), new Decimal(0));
  }
}
```

**Usage in Components:**
```typescript
const calculateOrderTotal = (items: OrderItem[]) => {
  const subtotal = DecimalUtil.sum(items.map((item) => item.lineTotal));
  const tax = DecimalUtil.calculatePercentage(subtotal, '15');
  const total = DecimalUtil.add(subtotal, tax);
  return total.toFixed(3); // "115.000"
};
```

### 6.3 State Management: Zustand Stores

**Cart Store Example:**
```typescript
// src/modules/sales/store/cartStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DecimalUtil } from '@/shared/lib/decimal';

export interface CartItem {
  id: string;
  product: Product;
  quantity: string; // Decimal as string
  selectedModifiers: ModifierSelection[];
  lineTotal: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, modifiers: ModifierSelection[], quantity?: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => string;
  getTotalTax: () => string;
  getGrandTotal: () => string;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      items: [],

      addItem: (product, modifiers, quantity = '1') => {
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          product,
          quantity,
          selectedModifiers: modifiers,
          lineTotal: calculateLineTotal(product, modifiers, quantity),
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        const items = get().items;
        return DecimalUtil.sum(items.map((item) => item.lineTotal)).toFixed(3);
      },

      getTotalTax: () => {
        const subtotal = get().getSubtotal();
        return DecimalUtil.calculatePercentage(subtotal, '15').toFixed(3);
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTotalTax();
        return DecimalUtil.add(subtotal, tax).toFixed(3);
      },
    }),
    { name: 'CartStore' }
  )
);
```

### 6.4 Data Fetching: TanStack Query Hooks

```typescript
// src/modules/sales/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export const useOrders = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/orders', { params: filters });
      return data.data;
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderDto) => {
      const { data } = await apiClient.post('/sales/orders', orderData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};
```

### 6.5 Module-Based Folder Structure

```
src/modules/
├── sales/               # SALES_CORE module
│   ├── components/
│   │   ├── OrderList.tsx
│   │   ├── OrderForm.tsx
│   │   └── PaymentDialog.tsx
│   ├── hooks/
│   │   ├── useOrders.ts
│   │   └── usePayments.ts
│   ├── store/
│   │   ├── orderStore.ts
│   │   └── cartStore.ts
│   ├── types/
│   │   └── order.types.ts
│   └── pages/
│       └── OrdersPage.tsx
│
├── kitchen/             # KITCHEN module
│   ├── components/
│   │   ├── TicketCard.tsx
│   │   └── StationBoard.tsx
│   ├── hooks/
│   │   ├── useKitchenTickets.ts
│   │   └── useWebSocket.ts
│   └── pages/
│       └── KitchenDisplayPage.tsx
│
├── inventory/           # INVENTORY module
│   ├── components/
│   │   ├── StockTable.tsx
│   │   └── BatchList.tsx
│   ├── hooks/
│   │   └── useInventory.ts
│   └── pages/
│       └── InventoryPage.tsx
│
├── cash/                # CASH_REGISTER module
│   ├── components/
│   │   ├── RegisterSessionCard.tsx
│   │   └── OpenSessionDialog.tsx
│   └── pages/
│       └── CashRegisterPage.tsx
│
└── products/            # PRODUCTS module
    ├── components/
    │   ├── ProductGrid.tsx
    │   └── ModifierSelector.tsx
    └── pages/
        └── ProductsPage.tsx
```

---

## 7. Testing Requirements

### 7.1 Test Coverage Rules

1. **Minimum Coverage:**
   - Critical modules (sales, inventory, ZATCA): 90%
   - Other modules: 80%
   - Overall: 80%

2. **Critical Paths MUST be 100% Covered:**
   - ✅ ZATCA hash generation
   - ✅ FIFO inventory deduction
   - ✅ Recipe deduction (multi-level)
   - ✅ Payment validation
   - ✅ Register session balance calculation
   - ✅ Transaction rollback scenarios

### 7.2 Test Pyramid

```
        /\
       /  \        E2E Tests (10%)
      /    \       - Complete order flow
     /------\      - ZATCA compliance
    /        \     - Hash chain validation
   /  Integration  \    Integration Tests (30%)
  /    Tests       \   - FIFO algorithm
 /                  \  - Recipe deduction
/--------------------\
    Unit Tests (60%)
    - Decimal calculations
    - Business logic
    - Validators
```

### 7.3 E2E Test: Complete Order Flow

```typescript
describe('Critical Path: Complete Order Flow (E2E)', () => {
  it('should complete full order flow with ZATCA hash generation', async () => {
    // 1. Open Register Session
    const sessionRes = await request(app.getHttpServer())
      .post('/api/v1/cash/register/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deviceId: 'DEVICE-001', openingBalance: '500.000' })
      .expect(201);

    const sessionId = sessionRes.body.data.id;

    // 2. Create Order
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/sales/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ orderType: 'DINE_IN', tableId: 'table-001', registerSessionId: sessionId })
      .expect(201);

    const orderId = orderRes.body.data.id;

    // 3. Add Order Items
    await request(app.getHttpServer())
      .post(`/api/v1/sales/orders/${orderId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: 'product-burger-001',
        quantity: '2.000',
        selectedModifiers: [{ modifierId: 'mod-cheese-001', optionId: 'opt-extra-001' }],
      })
      .expect(201);

    // 4. Get Order Total
    const getOrderRes = await request(app.getHttpServer())
      .get(`/api/v1/sales/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const orderTotal = getOrderRes.body.data.totalGross;

    // 5. Add Payment
    await request(app.getHttpServer())
      .post(`/api/v1/sales/orders/${orderId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: orderTotal, paymentMethod: 'CASH', registerSessionId: sessionId })
      .expect(201);

    // 6. Complete Order
    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/sales/orders/${orderId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deviceId: 'DEVICE-001' })
      .expect(200);

    const completedOrder = completeRes.body.data;

    // Verify ZATCA hash generated
    expect(completedOrder.invoiceHash).toBeDefined();
    expect(completedOrder.invoiceHash).toHaveLength(64); // SHA-256
    expect(completedOrder.zatcaQrCode).toBeDefined();

    // Verify inventory deducted
    const stockMovesRes = await request(app.getHttpServer())
      .get('/api/v1/inventory/stock-moves')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ referenceId: orderId })
      .expect(200);

    expect(stockMovesRes.body.data.data.length).toBeGreaterThan(0);

    // Verify hash chain intact
    const validateChainRes = await request(app.getHttpServer())
      .get('/api/v1/sales/orders/zatca/validate-chain')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ deviceId: 'DEVICE-001' })
      .expect(200);

    expect(validateChainRes.body.data.valid).toBe(true);
  });
});
```

### 7.4 Integration Test: FIFO Algorithm

```typescript
describe('InventoryService - FIFO (Integration)', () => {
  it('should deduct from oldest batch first', async () => {
    const batches = [
      { id: 'batch-1', qtyRemaining: '10.000', costPerUnit: '5.000', receivedDate: new Date('2025-01-20') },
      { id: 'batch-2', qtyRemaining: '20.000', costPerUnit: '6.000', receivedDate: new Date('2025-01-25') },
    ];

    jest.spyOn(batchRepo, 'createQueryBuilder').mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(batches),
    } as any);

    const result = await service.deductInventory('product-001', 'warehouse-001', '8.000', 'SALE', 'order-001');

    expect(result.batchesUsed).toHaveLength(1); // Only oldest batch used
    expect(result.batchesUsed[0].batchId).toBe('batch-1');
    expect(result.averageCost).toBe('5.000');
  });
});
```

### 7.5 Unit Test: Decimal Calculations

```typescript
describe('DecimalUtil (Unit)', () => {
  it('should add decimals correctly', () => {
    const result = DecimalUtil.add('10.500', '20.750');
    expect(result.toFixed(3)).toBe('31.250');
  });

  it('should handle floating point precision', () => {
    const result = DecimalUtil.add('0.1', '0.2');
    expect(result.toFixed(1)).toBe('0.3'); // Not 0.30000000000004
  });

  it('should calculate percentage', () => {
    const result = DecimalUtil.calculatePercentage('100.000', '15');
    expect(result.toFixed(3)).toBe('15.000');
  });
});
```

---

## 8. Security & Compliance

### 8.1 Authentication Rules

1. **ALWAYS** use JWT tokens for API authentication
2. **NEVER** store passwords in plain text (use bcrypt with salt rounds ≥ 10)
3. **ALWAYS** implement refresh token rotation
4. **ALWAYS** validate token expiration
5. **ALWAYS** use HTTPS in production
6. **NEVER** expose sensitive data in error messages

### 8.2 Authorization Rules

1. **ALWAYS** check user permissions before sensitive operations
2. **ALWAYS** implement role-based access control (RBAC)
3. **ALWAYS** require manager approval for refunds/voids
4. **NEVER** trust client-side validation alone

### 8.3 ZATCA Compliance Checklist

Every invoice MUST have:

- ✅ `zatca_xml_uuid` (unique per invoice)
- ✅ `zatca_invoice_hash` (SHA256 of canonical string)
- ✅ `zatca_previous_hash` (links to previous invoice)
- ✅ `zatca_qr_code` (TLV-encoded Base64)
- ✅ `invoice_counter` (sequential per register_session)
- ✅ `is_simplified_invoice` (B2C=true, B2B=false)
- ✅ If B2B: `customer.tax_id` IS NOT NULL

**Validation Schedule:**
- Run hash chain validation on system startup
- Run hash chain validation every 1 hour (scheduled job)
- If validation fails: HALT all invoicing, alert admin

### 8.4 Audit Trail Rules

1. **ALWAYS** log all write operations to `audit_logs` table
2. **NEVER** allow deletion of audit logs
3. **ALWAYS** log IP address and device ID
4. **ALWAYS** log old and new values for updates
5. **ALWAYS** retain audit logs for 7 years (ZATCA requirement)

---

## 9. Development Workflow

### 9.1 Git Workflow

```bash
# Branch naming conventions
feature/{ticket-number}-{short-description}    # feature/NP-123-add-loyalty-points
bugfix/{ticket-number}-{short-description}     # bugfix/NP-456-fix-fifo-calculation
hotfix/{ticket-number}-{short-description}     # hotfix/NP-789-zatca-hash-broken

# Commit message format
{type}({scope}): {subject}

# Examples:
feat(sales): implement split payment validation
fix(inventory): correct FIFO batch selection logic
docs(api): update error code registry
test(zatca): add hash chain validation tests
```

### 9.2 Code Review Checklist

**Before submitting PR:**
- [ ] All tests pass (`npm run test`)
- [ ] Test coverage ≥ 80% for new code
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] All `@Transactional` decorators properly placed
- [ ] Decimal calculations use `Decimal.js`
- [ ] Error codes documented in API_STANDARDS.md
- [ ] Audit logs created for write operations
- [ ] API documentation updated (Swagger)
- [ ] Database migrations created (if schema changed)

**Reviewer must verify:**
- [ ] Business logic correctness
- [ ] Transaction boundaries appropriate
- [ ] Error handling comprehensive
- [ ] Security vulnerabilities addressed
- [ ] Performance considerations (indexes, N+1 queries)
- [ ] ZATCA compliance maintained

### 9.3 Database Migration Workflow

```bash
# 1. Create migration
npm run migration:create src/migrations/AddLoyaltyPointsToCustomers

# 2. Write up() and down() methods
export class AddLoyaltyPointsToCustomers1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers 
      ADD COLUMN loyalty_points_balance INTEGER DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers 
      DROP COLUMN loyalty_points_balance
    `);
  }
}

# 3. Test migration
npm run migration:run

# 4. Test rollback
npm run migration:revert

# 5. Commit migration file
git add src/migrations/TIMESTAMP-AddLoyaltyPointsToCustomers.ts
git commit -m "migration(crm): add loyalty points balance to customers"
```

### 9.4 Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing in CI/CD
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] ZATCA certificates installed (production only)
- [ ] Backup database before migration
- [ ] Performance tests passed

**Deployment Steps:**
1. Enable maintenance mode
2. Run database migrations
3. Deploy backend code
4. Deploy frontend code
5. Validate hash chain integrity
6. Smoke test critical paths
7. Disable maintenance mode
8. Monitor error logs for 1 hour

**Post-Deployment:**
- [ ] Validate ZATCA hash chain
- [ ] Check register sessions can open
- [ ] Test order creation and completion
- [ ] Verify inventory deductions working
- [ ] Monitor API error rates
- [ ] Check database performance metrics

---

## 10. Quick Reference

### 10.1 Common Commands

```bash
# Backend
npm run start:dev              # Run in development mode
npm run build                  # Build for production
npm run test                   # Run all tests
npm run test:cov               # Run tests with coverage
npm run migration:create       # Create new migration
npm run migration:run          # Run pending migrations
npm run migration:revert       # Rollback last migration
npm run seed                   # Seed database with initial data

# Frontend
npm run dev                    # Run Vite dev server
npm run build                  # Build for production
npm run preview                # Preview production build
npm run test                   # Run Vitest
npm run lint                   # Run ESLint

# Database
psql -U postgres -d nerdpos    # Connect to database
\dt                            # List all tables
\d+ table_name                 # Describe table
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;  # Recent audit logs
```

### 10.2 Environment Variables Checklist

```env
# Required in all environments
NODE_ENV=production|development|test
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=***
DB_DATABASE=nerdpos
JWT_ACCESS_SECRET=***
JWT_REFRESH_SECRET=***

# Required in production only
ZATCA_CERTIFICATE_PATH=/path/to/cert.pem
ZATCA_PRIVATE_KEY_PATH=/path/to/key.pem
ZATCA_API_URL=https://gw-fatoora.zatca.gov.sa
REDIS_URL=redis://localhost:6379

# Optional
LOG_LEVEL=info|debug|warn|error
ALLOWED_ORIGINS=https://pos.example.com
```

### 10.3 PostgreSQL Decimal Column Template

```sql
-- Money/Price columns (3 decimals for SAR Halala)
column_name DECIMAL(10,3) NOT NULL DEFAULT 0.000

-- Tax rate columns (2 decimals for percentage)
tax_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00

-- Quantity columns (3 decimals)
quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000
```

### 10.4 TypeORM Entity Template

```typescript
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseTransactionEntity } from '../base/base-transaction.entity';

@Entity({ name: 'entity_name', schema: 'schema_name' })
@Index(['field1', 'field2'], { unique: true })
export class EntityName extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: false, default: '0.000' })
  amount: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @ManyToOne(() => RelatedEntity, (related) => related.entities)
  @JoinColumn({ name: 'related_id' })
  related: RelatedEntity;
}
```

### 10.5 NestJS Service Template

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericService } from '@/services/generic/generic.service';
import { Transactional } from 'typeorm-transactional';
import { EntityName } from '../entities/entity-name.entity';
import { CreateEntityDto, UpdateEntityDto, EntityResponseDto } from '../dto';

@Injectable()
export class EntityService extends GenericService<
  EntityName,
  CreateEntityDto,
  UpdateEntityDto,
  EntityResponseDto
> {
  constructor(
    @InjectRepository(EntityName)
    private readonly entityRepo: Repository<EntityName>,
  ) {
    super(
      new GenericRepository(entityRepo),
      'ENTITY_NOT_FOUND',
      'ENTITY_CONFLICT'
    );
  }

  // Custom business logic methods here
  @Transactional()
  async customBusinessLogic(id: string): Promise<EntityResponseDto> {
    // Implementation
  }
}
```

### 10.6 React Component Template

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DecimalUtil } from '@/shared/lib/decimal';
import { useEntityStore } from '../store/entityStore';
import { useEntity } from '../hooks/useEntity';

interface EntityCardProps {
  entity: Entity;
  onAction?: (id: string) => void;
}

export const EntityCard = ({ entity, onAction }: EntityCardProps) => {
  const { updateEntity } = useEntityStore();
  const { data, isLoading, error } = useEntity(entity.id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold">{entity.name}</h3>
        <p className="text-sm text-muted-foreground">
          {DecimalUtil.formatForDisplay(entity.amount)} SAR
        </p>
        <Button onClick={() => onAction?.(entity.id)}>Action</Button>
      </CardContent>
    </Card>
  );
};
```

### 10.7 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| **Transaction not rolling back** | Ensure `initializeTransactionalContext()` is FIRST in `main.ts` |
| **Decimal precision lost** | Use `decimal(10,3)` column type + `DecimalTransformer` |
| **Hash chain broken** | Run `validateHashChain()`, check for manual database edits |
| **FIFO not selecting oldest batch** | Verify `ORDER BY received_date ASC` in query |
| **Recipe deduction incomplete** | Check for missing `track_inventory = true` on products |
| **Payment split rejected** | Verify `SUM(payments.amount) === order.total_gross` |
| **Register session won't close** | Ensure no pending orders with `register_session_id` |
| **Frontend decimal display wrong** | Use `DecimalUtil.formatForDisplay()` not `.toFixed()` |
| **Tests failing in CI/CD** | Check database connection and migrations in test environment |
| **JWT token expired loop** | Implement refresh token rotation logic |

---

## 📌 Critical Reminders

### Backend (NestJS)

1. **`initializeTransactionalContext()` MUST be first line in `main.ts`**
2. **ALWAYS use `@Transactional()` on write operations**
3. **NEVER use `@Transactional()` on read operations**
4. **ALWAYS use `decimal(10,3)` for money/quantity fields**
5. **ALWAYS validate ZATCA hash chain on system startup**
6. **ALWAYS create audit logs for write operations**
7. **ALWAYS use UUIDs for primary keys**
8. **NEVER delete audit logs**
9. **ALWAYS test transaction rollbacks**
10. **ALWAYS use GenericService + GenericRepository patterns**

### Frontend (React)

1. **ALWAYS use `Decimal.js` for money calculations**
2. **NEVER use JavaScript `Number` for financial data**
3. **ALWAYS use Zustand for local state per module**
4. **ALWAYS use TanStack Query for server state**
5. **ALWAYS validate forms with Zod + React Hook Form**
6. **ALWAYS format backend decimals with `DecimalUtil`**
7. **ALWAYS use Shadcn/UI components**
8. **ALWAYS implement loading and error states**
9. **ALWAYS use React.lazy() for code splitting**
10. **ALWAYS use absolute imports with `@/` prefix**

### Testing

1. **Critical paths MUST be 100% covered**
2. **ALWAYS test transaction rollback scenarios**
3. **ALWAYS test ZATCA hash chain validation**
4. **ALWAYS test FIFO inventory algorithm**
5. **ALWAYS test recipe deduction (multi-level)**
6. **ALWAYS test payment split validation**
7. **ALWAYS test with realistic data volumes**
8. **ALWAYS run E2E tests before deployment**
9. **ALWAYS validate test coverage ≥ 80%**
10. **ALWAYS test edge cases (negative stock, expired batches, etc.)**

---

**Document Version:** 2.0.0  
**Maintained By:** NerdPOS Development Team  
**Review Frequency:** Monthly  
**Last Reviewed:** 2025-01-26

**Contributors:** AI Assistant (Claude Sonnet 4.5)  
**License:** Proprietary - NerdPOS Enterprise ERP

---

## 🚀 Getting Started Checklist

### New Developer Onboarding

- [ ] Clone repository
- [ ] Install Node.js 20+
- [ ] Install PostgreSQL 16+
- [ ] Copy `.env.example` to `.env` and configure
- [ ] Run `npm install` in backend
- [ ] Run `npm install` in frontend
- [ ] Run `npm run migration:run` to create database schema
- [ ] Run `npm run seed` to populate initial data
- [ ] Start backend: `npm run start:dev`
- [ ] Start frontend: `npm run dev`
- [ ] Login with default credentials (cashier1 / test123)
- [ ] Create first order and complete flow
- [ ] Review this document thoroughly

### Key Files to Review First

1. `src/main.ts` - Application entry point (transaction context)
2. `src/services/generic/generic.service.ts` - Base service pattern
3. `src/repositories/generic/generic.repository.ts` - Base repository pattern
4. `src/modules/sales/services/order.service.ts` - Order completion flow
5. `src/modules/inventory/services/inventory.service.ts` - FIFO algorithm
6. `frontend/src/shared/lib/decimal.ts` - Decimal utilities
7. `frontend/src/modules/sales/store/cartStore.ts` - Cart state management

---

**END OF GEMINI.MD**
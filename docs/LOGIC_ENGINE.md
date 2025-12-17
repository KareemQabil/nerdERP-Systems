# NerdPOS Logic Engine: Critical Algorithms

## Document Context

This document defines **specific, step-by-step algorithms** for critical business logic in NerdPOS ERP. These algorithms are implemented in NestJS services and MUST maintain data integrity through transactions (@Transactional decorator).

**Version:** 2.0.0  
**Last Updated:** 2025-01-26

---

## 1. ZATCA Hash Chain Algorithm (Saudi E-Invoicing Compliance)

### 1.1 Overview

ZATCA Phase 2 requires a **cryptographic hash chain** linking consecutive invoices. Each invoice's hash is calculated using the previous invoice's hash, making the chain tamper-proof.

**Tables Involved:**
- `sales_orders` (columns: `id`, `previous_hash`, `invoice_hash`, `zatca_qr_code`, `created_at`)

### 1.2 Hash Chain Rules

```
1. First invoice of the day: previous_hash = NULL
2. Subsequent invoices: previous_hash = last_invoice.invoice_hash
3. Hash calculation: SHA-256(previous_hash + invoice_data)
4. If hash chain breaks: System MUST halt invoice generation
```

### 1.3 Algorithm: Generate Invoice Hash

```typescript
/**
 * ZATCA Hash Chain Algorithm
 * Location: src/modules/sales/services/zatca.service.ts
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../entities/sales-order.entity';
import { createHash } from 'crypto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ZatcaService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,
  ) {}

  /**
   * Step 1: Get the last finalized invoice's hash
   * CRITICAL: Must be called within a transaction to prevent race conditions
   */
  @Transactional()
  async getLastInvoiceHash(deviceId: string): Promise<string | null> {
    const lastOrder = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.device_id = :deviceId', { deviceId })
      .andWhere('order.payment_status = :status', { status: 'PAID' })
      .andWhere('order.invoice_hash IS NOT NULL')
      .orderBy('order.created_at', 'DESC')
      .getOne();

    return lastOrder?.invoiceHash || null;
  }

  /**
   * Step 2: Generate canonical invoice string (Simplified Invoice)
   * Format per ZATCA Phase 2 Technical Specification v3.2
   */
  private generateCanonicalInvoiceString(order: SalesOrder, previousHash: string | null): string {
    // Fields MUST be in this exact order per ZATCA specs
    const fields = [
      order.orderNumber,                          // Invoice Number
      order.createdAt.toISOString(),              // Invoice Date
      order.totalGross.toFixed(3),                // Total Amount (3 decimals)
      order.totalTax.toFixed(3),                  // VAT Amount
      previousHash || 'GENESIS',                  // Previous Invoice Hash (or GENESIS for first)
    ];

    return fields.join('|');
  }

  /**
   * Step 3: Calculate SHA-256 hash
   */
  private calculateHash(data: string): string {
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Step 4: Generate QR Code content per ZATCA TLV Format
   * Tag-Length-Value (TLV) encoding
   */
  private generateQRCode(order: SalesOrder, invoiceHash: string): string {
    const tlvFields = [
      { tag: 1, value: 'NerdPOS Restaurant' },              // Seller Name
      { tag: 2, value: '310123456700003' },                 // VAT Registration Number
      { tag: 3, value: order.createdAt.toISOString() },     // Invoice Date
      { tag: 4, value: order.totalGross.toFixed(2) },       // Total with VAT
      { tag: 5, value: order.totalTax.toFixed(2) },         // VAT Amount
      { tag: 6, value: invoiceHash },                       // Invoice Hash (Hex)
    ];

    // Convert to TLV binary format, then Base64
    const tlvBuffer = this.encodeTLV(tlvFields);
    return tlvBuffer.toString('base64');
  }

  private encodeTLV(fields: Array<{ tag: number; value: string }>): Buffer {
    const buffers: Buffer[] = [];

    for (const field of fields) {
      const valueBuffer = Buffer.from(field.value, 'utf8');
      const tagBuffer = Buffer.from([field.tag]);
      const lengthBuffer = Buffer.from([valueBuffer.length]);

      buffers.push(tagBuffer, lengthBuffer, valueBuffer);
    }

    return Buffer.concat(buffers);
  }

  /**
   * MAIN ALGORITHM: Generate ZATCA-compliant invoice hash
   * Must be called BEFORE saving order as PAID
   */
  @Transactional()
  async generateInvoiceHash(order: SalesOrder, deviceId: string): Promise<void> {
    // Step 1: Get previous hash
    const previousHash = await this.getLastInvoiceHash(deviceId);

    // Step 2: Generate canonical string
    const canonicalString = this.generateCanonicalInvoiceString(order, previousHash);

    // Step 3: Calculate hash
    const invoiceHash = this.calculateHash(canonicalString);

    // Step 4: Generate QR code
    const qrCode = this.generateQRCode(order, invoiceHash);

    // Step 5: Update order with ZATCA fields
    order.previousHash = previousHash;
    order.invoiceHash = invoiceHash;
    order.zatcaQrCode = qrCode;

    // Order is saved by the caller (OrderService)
  }

  /**
   * VALIDATION: Verify hash chain integrity
   * Run this on system startup or as scheduled job
   */
  @Transactional()
  async validateHashChain(deviceId: string): Promise<{ valid: boolean; brokenAt?: string }> {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.device_id = :deviceId', { deviceId })
      .andWhere('order.payment_status = :status', { status: 'PAID' })
      .andWhere('order.invoice_hash IS NOT NULL')
      .orderBy('order.created_at', 'ASC')
      .getMany();

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const expectedPreviousHash = i === 0 ? null : orders[i - 1].invoiceHash;

      if (order.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          brokenAt: order.orderNumber,
        };
      }

      // Recalculate hash and verify
      const canonicalString = this.generateCanonicalInvoiceString(order, order.previousHash);
      const calculatedHash = this.calculateHash(canonicalString);

      if (calculatedHash !== order.invoiceHash) {
        return {
          valid: false,
          brokenAt: order.orderNumber,
        };
      }
    }

    return { valid: true };
  }
}
```

### 1.4 Usage in OrderService

```typescript
/**
 * Location: src/modules/sales/services/order.service.ts
 */

@Injectable()
export class OrderService {
  constructor(
    private readonly zatcaService: ZatcaService,
    private readonly orderRepo: Repository<SalesOrder>,
  ) {}

  /**
   * Complete order and generate ZATCA hash
   */
  @Transactional()
  async completeOrder(orderId: string, deviceId: string): Promise<SalesOrder> {
    const order = await this.orderRepo.findOneOrFail({ where: { id: orderId } });

    if (order.paymentStatus !== 'PENDING') {
      throw new BadRequestException('Order already completed');
    }

    // 1. Generate ZATCA hash BEFORE finalizing payment
    await this.zatcaService.generateInvoiceHash(order, deviceId);

    // 2. Update payment status
    order.paymentStatus = 'PAID';

    // 3. Save order (hash chain is now immutable)
    return await this.orderRepo.save(order);
  }
}
```

### 1.5 Error Handling

```typescript
// If hash chain breaks, throw critical error
if (!(await this.zatcaService.validateHashChain(deviceId)).valid) {
  throw new InternalServerErrorException({
    code: 'ZATCA_001',
    messageKey: 'ZATCA_HASH_CHAIN_BROKEN',
    message: 'Cryptographic hash chain is invalid - invoice generation halted',
  });
}
```

---

## 2. FIFO Inventory Costing Algorithm

### 2.1 Overview

**FIFO (First-In, First-Out)** ensures that the oldest inventory batches are consumed first. This is critical for:
- Perishable goods (food, beverages)
- Accurate COGS (Cost of Goods Sold) calculation
- Inventory valuation

**Tables Involved:**
- `inventory_batches` (columns: `id`, `product_id`, `qty_received`, `qty_remaining`, `cost_per_unit`, `received_date`, `expiry_date`)
- `stock_moves` (columns: `id`, `batch_id`, `move_type`, `quantity`, `cost_per_unit`, `reference_id`)

### 2.2 FIFO Rules

```
1. Sort batches by received_date ASC (oldest first)
2. Deduct from oldest batch until qty_remaining = 0
3. Move to next batch if quantity still needed
4. Create stock_move records for each batch consumed
5. Calculate weighted average COGS
```

### 2.3 Algorithm: Deduct Inventory (FIFO)

```typescript
/**
 * FIFO Inventory Deduction Algorithm
 * Location: src/modules/inventory/services/inventory.service.ts
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { InventoryBatch } from '../entities/inventory-batch.entity';
import { StockMove } from '../entities/stock-move.entity';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';

interface DeductionResult {
  success: boolean;
  batchesUsed: Array<{
    batchId: string;
    quantityUsed: string;
    costPerUnit: string;
    totalCost: string;
  }>;
  totalCost: string;
  averageCost: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    @InjectRepository(StockMove)
    private readonly stockMoveRepo: Repository<StockMove>,
  ) {}

  /**
   * Step 1: Get available batches (FIFO order)
   * Filters:
   * - product_id matches
   * - qty_remaining > 0
   * - expiry_date is NULL or in the future
   * - Order by received_date ASC (oldest first)
   */
  private async getAvailableBatches(productId: string, warehouseId: string): Promise<InventoryBatch[]> {
    const now = new Date();

    return await this.batchRepo
      .createQueryBuilder('batch')
      .where('batch.product_id = :productId', { productId })
      .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('batch.qty_remaining > :zero', { zero: '0.000' })
      .andWhere(
        '(batch.expiry_date IS NULL OR batch.expiry_date > :now)',
        { now }
      )
      .orderBy('batch.received_date', 'ASC') // FIFO: Oldest first
      .addOrderBy('batch.created_at', 'ASC')  // Tie-breaker
      .getMany();
  }

  /**
   * Step 2: Check if sufficient stock exists
   */
  private async checkStockAvailability(
    productId: string,
    warehouseId: string,
    requiredQty: Decimal
  ): Promise<boolean> {
    const batches = await this.getAvailableBatches(productId, warehouseId);

    const totalAvailable = batches.reduce(
      (sum, batch) => sum.plus(batch.qtyRemaining),
      new Decimal(0)
    );

    return totalAvailable.greaterThanOrEqualTo(requiredQty);
  }

  /**
   * MAIN ALGORITHM: Deduct inventory using FIFO
   * 
   * @param productId - Product to deduct
   * @param warehouseId - Warehouse to deduct from
   * @param requiredQty - Quantity needed (decimal string, e.g., "2.500")
   * @param referenceType - 'SALE' | 'RECIPE' | 'ADJUSTMENT'
   * @param referenceId - Order ID or Recipe ID
   * 
   * @returns DeductionResult with cost breakdown
   * @throws InsufficientStockException if not enough inventory
   */
  @Transactional()
  async deductInventory(
    productId: string,
    warehouseId: string,
    requiredQty: string,
    referenceType: string,
    referenceId: string
  ): Promise<DeductionResult> {
    const qtyNeeded = new Decimal(requiredQty);

    // Step 1: Check availability
    const hasStock = await this.checkStockAvailability(productId, warehouseId, qtyNeeded);
    if (!hasStock) {
      throw new BadRequestException({
        code: 'INV_002',
        messageKey: 'INSUFFICIENT_STOCK',
        message: `Not enough stock for product ${productId}`,
      });
    }

    // Step 2: Get batches in FIFO order
    const batches = await this.getAvailableBatches(productId, warehouseId);

    // Step 3: Deduct from batches
    let remainingQty = qtyNeeded;
    const batchesUsed: Array<{
      batchId: string;
      quantityUsed: string;
      costPerUnit: string;
      totalCost: string;
    }> = [];

    for (const batch of batches) {
      if (remainingQty.isZero()) break;

      const batchQtyRemaining = new Decimal(batch.qtyRemaining);
      const qtyToDeduct = Decimal.min(remainingQty, batchQtyRemaining);
      const costPerUnit = new Decimal(batch.costPerUnit);
      const totalCost = qtyToDeduct.times(costPerUnit);

      // Update batch
      batch.qtyRemaining = batchQtyRemaining.minus(qtyToDeduct).toFixed(3);
      await this.batchRepo.save(batch);

      // Create stock move record
      const stockMove = this.stockMoveRepo.create({
        batch: { id: batch.id },
        product: { id: productId },
        warehouse: { id: warehouseId },
        moveType: 'OUT',
        quantity: qtyToDeduct.toFixed(3),
        costPerUnit: costPerUnit.toFixed(3),
        referenceType,
        referenceId,
      });
      await this.stockMoveRepo.save(stockMove);

      // Track usage
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
    const averageCost = totalCost.dividedBy(qtyNeeded);

    return {
      success: true,
      batchesUsed,
      totalCost: totalCost.toFixed(3),
      averageCost: averageCost.toFixed(3),
    };
  }

  /**
   * REVERSE OPERATION: Restore inventory (for refunds)
   */
  @Transactional()
  async restoreInventory(stockMoveId: string): Promise<void> {
    const stockMove = await this.stockMoveRepo.findOneOrFail({
      where: { id: stockMoveId },
      relations: ['batch'],
    });

    if (stockMove.moveType !== 'OUT') {
      throw new BadRequestException('Can only restore OUT movements');
    }

    // Restore quantity to batch
    const batch = stockMove.batch;
    const qtyToRestore = new Decimal(stockMove.quantity);
    batch.qtyRemaining = new Decimal(batch.qtyRemaining).plus(qtyToRestore).toFixed(3);
    await this.batchRepo.save(batch);

    // Create reverse stock move
    const reverseMove = this.stockMoveRepo.create({
      batch: { id: batch.id },
      product: stockMove.product,
      warehouse: stockMove.warehouse,
      moveType: 'IN',
      quantity: stockMove.quantity,
      costPerUnit: stockMove.costPerUnit,
      referenceType: 'REFUND',
      referenceId: stockMove.referenceId,
    });
    await this.stockMoveRepo.save(reverseMove);
  }
}
```

### 2.4 Usage Example: Order Completion

```typescript
/**
 * When order is completed, deduct inventory for all items
 */
@Transactional()
async completeOrderWithInventory(orderId: string): Promise<void> {
  const order = await this.orderRepo.findOne({
    where: { id: orderId },
    relations: ['items', 'items.product'],
  });

  for (const item of order.items) {
    // Deduct using FIFO
    const deductionResult = await this.inventoryService.deductInventory(
      item.product.id,
      order.warehouseId,
      item.quantity,
      'SALE',
      orderId
    );

    // Store COGS on order item
    item.costOfGoodsSold = deductionResult.averageCost;
    await this.orderItemRepo.save(item);
  }
}
```

---

## 3. Recipe Deduction Algorithm (Multi-Level BOM)

### 3.1 Overview

When a **prepared product** (e.g., "Chicken Burger") is sold, its **recipe ingredients** must be deducted from inventory. Recipes can have **multi-level components** (e.g., burger patty → ground chicken).

**Tables Involved:**
- `recipes` (columns: `id`, `product_id`, `raw_product_id`, `quantity_required`)
- `products` (columns: `id`, `is_prepared`, `track_inventory`)
- `inventory_batches`, `stock_moves` (for FIFO deduction)

### 3.2 Recipe Deduction Rules

```
1. Check if product has is_prepared = TRUE
2. If yes, load all recipes for this product
3. For each raw_product_id in recipes:
   a. Calculate quantity_needed = order_qty * quantity_required
   b. If raw_product is ALSO prepared → recursively deduct its recipes (multi-level BOM)
   c. If raw_product is raw material → deduct using FIFO algorithm
4. All deductions must succeed or entire transaction rolls back
```

### 3.3 Algorithm: Recursive Recipe Deduction

```typescript
/**
 * Recipe Deduction Algorithm (Multi-Level BOM)
 * Location: src/modules/inventory/services/recipe.service.ts
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entities/recipe.entity';
import { Product } from '../../products/entities/product.entity';
import { InventoryService } from './inventory.service';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';

interface RecipeDeductionLog {
  productName: string;
  quantityUsed: string;
  level: number; // For multi-level tracking
}

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Step 1: Load all recipes for a product
   */
  private async getRecipes(productId: string): Promise<Recipe[]> {
    return await this.recipeRepo.find({
      where: { product: { id: productId } },
      relations: ['rawProduct'],
    });
  }

  /**
   * Step 2: Recursive deduction (handles multi-level BOM)
   * 
   * @param productId - Product sold (may be prepared or raw)
   * @param quantity - Quantity sold (decimal string)
   * @param warehouseId - Warehouse to deduct from
   * @param referenceId - Order ID or parent recipe ID
   * @param level - Recursion level (for logging)
   * @param deductionLog - Accumulator for tracking all deductions
   */
  @Transactional()
  private async deductRecursive(
    productId: string,
    quantity: string,
    warehouseId: string,
    referenceId: string,
    level: number,
    deductionLog: RecipeDeductionLog[]
  ): Promise<void> {
    const product = await this.productRepo.findOneOrFail({
      where: { id: productId },
    });

    // Base case: Raw material (not prepared) → deduct directly using FIFO
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
    const recipes = await this.getRecipes(productId);

    if (recipes.length === 0) {
      throw new BadRequestException({
        code: 'INV_003',
        messageKey: 'RECIPE_NOT_FOUND',
        message: `No recipe defined for prepared product: ${product.name}`,
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

  /**
   * MAIN ALGORITHM: Deduct inventory for a prepared product
   * 
   * @param productId - Product sold (may have recipes)
   * @param quantity - Quantity sold
   * @param warehouseId - Warehouse to deduct from
   * @param referenceId - Order ID
   * 
   * @returns RecipeDeductionLog[] showing all raw materials consumed
   */
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
      0,
      deductionLog
    );

    return deductionLog;
  }
}
```

### 3.4 Usage Example: Order Completion with Recipes

```typescript
/**
 * Complete order and deduct recipes
 * Location: src/modules/sales/services/order.service.ts
 */

@Transactional()
async completeOrder(orderId: string): Promise<SalesOrder> {
  const order = await this.orderRepo.findOne({
    where: { id: orderId },
    relations: ['items', 'items.product'],
  });

  for (const item of order.items) {
    const product = item.product;

    if (product.isPrepared && product.trackInventory) {
      // Deduct recipe ingredients
      const deductionLog = await this.recipeService.deductRecipe(
        product.id,
        item.quantity,
        order.warehouseId,
        orderId
      );

      // Log for audit trail
      console.log(`Recipe deduction for ${product.name}:`, deductionLog);
    } else if (product.trackInventory) {
      // Direct inventory deduction (raw product)
      await this.inventoryService.deductInventory(
        product.id,
        order.warehouseId,
        item.quantity,
        'SALE',
        orderId
      );
    }
  }

  order.paymentStatus = 'PAID';
  return await this.orderRepo.save(order);
}
```

### 3.5 Example: Multi-Level BOM

**Product Hierarchy:**
```
Chicken Burger (Prepared)
├── Burger Bun (Raw) → 1 unit
├── Grilled Chicken Patty (Prepared)
│   ├── Chicken Breast (Raw) → 150g
│   ├── Spice Mix (Raw) → 10g
│   └── Oil (Raw) → 5ml
├── Lettuce (Raw) → 20g
└── Tomato (Raw) → 30g
```

**When selling 2x Chicken Burgers:**
```typescript
// Deduction log output:
[
  { productName: 'Burger Bun', quantityUsed: '2.000', level: 1 },
  { productName: 'Chicken Breast', quantityUsed: '300.000', level: 2 }, // 2 * 150g
  { productName: 'Spice Mix', quantityUsed: '20.000', level: 2 },       // 2 * 10g
  { productName: 'Oil', quantityUsed: '10.000', level: 2 },             // 2 * 5ml
  { productName: 'Lettuce', quantityUsed: '40.000', level: 1 },         // 2 * 20g
  { productName: 'Tomato', quantityUsed: '60.000', level: 1 },          // 2 * 30g
]
```

---

## 4. Payment Split Algorithm (Multiple Payments per Order)

### 4.1 Overview

An order can be paid using **multiple payment methods** (e.g., 50 SAR cash + 20 SAR card). The system must validate that the sum of payments equals the order total.

**Tables Involved:**
- `sales_orders` (columns: `total_gross`, `payment_status`)
- `payments` (columns: `order_id`, `amount`, `payment_method`)

### 4.2 Algorithm: Validate Payment Split

```typescript
/**
 * Payment Split Validation
 * Location: src/modules/sales/services/payment.service.ts
 */

@Injectable()
export class PaymentService {
  /**
   * Validate that total payments match order total
   * Tolerance: 0.01 SAR (1 Halala) for rounding
   */
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

    // Allow 0.01 SAR tolerance
    return difference.lessThanOrEqualTo('0.01');
  }

  /**
   * Add payment to order
   */
  @Transactional()
  async addPayment(
    orderId: string,
    amount: string,
    method: string,
    registerSessionId: string
  ): Promise<Payment> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order already fully paid');
    }

    // Create payment record
    const payment = this.paymentRepo.create({
      order: { id: orderId },
      amount,
      paymentMethod: method,
      registerSession: { id: registerSessionId },
    });
    await this.paymentRepo.save(payment);

    // Check if order is now fully paid
    const isFullyPaid = await this.validatePaymentSplit(orderId);
    if (isFullyPaid) {
      order.paymentStatus = 'PAID';
      await this.orderRepo.save(order);
    }

    return payment;
  }
}
```

---

## 5. Register Session Balance Algorithm

### 5.1 Overview

Cash register sessions track all cash movements (sales, refunds, drop-to-safe). The **expected balance** must match the **actual cash count** at session close.

**Tables Involved:**
- `register_sessions` (columns: `opening_balance`, `expected_balance`, `actual_balance`, `status`)
- `payments` (columns: `amount`, `payment_method`, `register_session_id`)
- `cash_transactions` (columns: `amount`, `transaction_type`, `register_session_id`)

### 5.2 Algorithm: Calculate Expected Balance

```typescript
/**
 * Register Session Balance Calculation
 * Location: src/modules/cash/services/register.service.ts
 */

@Injectable()
export class RegisterService {
  /**
   * Calculate expected balance at any point in session
   */
  @Transactional()
  async calculateExpectedBalance(sessionId: string): Promise<string> {
    const session = await this.sessionRepo.findOneOrFail({
      where: { id: sessionId },
      relations: ['payments', 'cashTransactions'],
    });

    let balance = new Decimal(session.openingBalance);

    // Add cash sales
    const cashSales = session.payments
      .filter((p) => p.paymentMethod === 'CASH')
      .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    balance = balance.plus(cashSales);

    // Subtract cash refunds
    const cashRefunds = session.payments
      .filter((p) => p.paymentMethod === 'CASH' && p.amount.startsWith('-'))
      .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
    balance = balance.plus(cashRefunds); // Already negative

    // Subtract drops to safe
    const drops = session.cashTransactions
      .filter((t) => t.transactionType === 'DROP_TO_SAFE')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    balance = balance.minus(drops);

    // Add petty cash
    const pettyCash = session.cashTransactions
      .filter((t) => t.transactionType === 'PETTY_CASH')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
    balance = balance.minus(pettyCash);

    return balance.toFixed(3);
  }

  /**
   * Close session and calculate variance
   */
  @Transactional()
  async closeSession(sessionId: string, actualCashCount: string): Promise<void> {
    const session = await this.sessionRepo.findOneOrFail({ where: { id: sessionId } });

    const expectedBalance = await this.calculateExpectedBalance(sessionId);
    const actualBalance = new Decimal(actualCashCount);
    const variance = actualBalance.minus(expectedBalance);

    session.expectedBalance = expectedBalance;
    session.actualBalance = actualBalance.toFixed(3);
    session.variance = variance.toFixed(3);
    session.status = 'CLOSED';
    session.closedAt = new Date();

    await this.sessionRepo.save(session);

    // Alert if variance > 10 SAR
    if (variance.abs().greaterThan('10.000')) {
      // Send notification to manager
      this.notificationService.sendCashVarianceAlert(sessionId, variance.toFixed(2));
    }
  }
}
```

---

## 6. Loyalty Points Calculation

### 6.1 Overview

Customers earn loyalty points based on order total. Points can be redeemed for discounts.

**Tables Involved:**
- `customers` (columns: `loyalty_points_balance`)
- `loyalty_transactions` (columns: `customer_id`, `points`, `transaction_type`, `order_id`)

### 6.2 Algorithm: Award & Redeem Points

```typescript
/**
 * Loyalty Points Algorithm
 * Location: src/modules/crm/services/loyalty.service.ts
 */

@Injectable()
export class LoyaltyService {
  /**
   * Calculate points earned
   * Rule: 1 point per 10 SAR spent
   */
  private calculatePointsEarned(orderTotal: string): number {
    const total = new Decimal(orderTotal);
    const pointsPerSAR = new Decimal('0.1'); // 1 point / 10 SAR
    return Math.floor(total.times(pointsPerSAR).toNumber());
  }

  /**
   * Award points for completed order
   */
  @Transactional()
  async awardPoints(customerId: string, orderId: string, orderTotal: string): Promise<void> {
    const points = this.calculatePointsEarned(orderTotal);

    if (points === 0) return;

    // Update customer balance
    await this.customerRepo.increment(
      { id: customerId },
      'loyaltyPointsBalance',
      points
    );

    // Create transaction record
    await this.loyaltyTransactionRepo.save({
      customer: { id: customerId },
      order: { id: orderId },
      points,
      transactionType: 'EARNED',
    });
  }

  /**
   * Redeem points for discount
   * Rule: 100 points = 10 SAR discount
   */
  @Transactional()
  async redeemPoints(customerId: string, orderId: string, pointsToRedeem: number): Promise<string> {
    const customer = await this.customerRepo.findOneOrFail({ where: { id: customerId } });

    if (customer.loyaltyPointsBalance < pointsToRedeem) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    // Calculate discount amount
    const discountAmount = new Decimal(pointsToRedeem).dividedBy(10).toFixed(2); // 10 points = 1 SAR

    // Deduct points
    await this.customerRepo.decrement(
      { id: customerId },
      'loyaltyPointsBalance',
      pointsToRedeem
    );

    // Create transaction record
    await this.loyaltyTransactionRepo.save({
      customer: { id: customerId },
      order: { id: orderId },
      points: -pointsToRedeem,
      transactionType: 'REDEEMED',
    });

    return discountAmount;
  }
}
```

---

## 7. Stock Alert Monitoring

### 7.1 Algorithm: Check Low Stock

```typescript
/**
 * Stock Alert Algorithm
 * Location: src/modules/inventory/services/stock-alert.service.ts
 */

@Injectable()
export class StockAlertService {
  /**
   * Check all products for low stock conditions
   * Run as scheduled cron job (every hour)
   */
  @Cron('0 * * * *') // Every hour
  async checkLowStock(): Promise<void> {
    const products = await this.productRepo.find({
      where: { trackInventory: true },
    });

    for (const product of products) {
      const totalStock = await this.getTotalStock(product.id);

      if (totalStock.lessThanOrEqualTo(product.reorderLevel)) {
        await this.createStockAlert(product.id, totalStock.toFixed(3));
      }
    }
  }

  private async getTotalStock(productId: string): Promise<Decimal> {
    const batches = await this.batchRepo.find({
      where: { product: { id: productId } },
    });

    return batches.reduce(
      (sum, batch) => sum.plus(batch.qtyRemaining),
      new Decimal(0)
    );
  }

  private async createStockAlert(productId: string, currentStock: string): Promise<void> {
    const existingAlert = await this.alertRepo.findOne({
      where: {
        product: { id: productId },
        status: 'ACTIVE',
      },
    });

    if (!existingAlert) {
      await this.alertRepo.save({
        product: { id: productId },
        alertType: 'LOW_STOCK',
        currentQuantity: currentStock,
        status: 'ACTIVE',
      });
    }
  }
}
```

---

## 8. Transaction Rollback Scenarios

### 8.1 Critical Rollback Cases

```typescript
/**
 * Example: Order completion with full rollback on error
 */

@Transactional()
async completeOrder(orderId: string, deviceId: string): Promise<SalesOrder> {
  try {
    // 1. Validate order
    const order = await this.validateOrder(orderId);

    // 2. Validate payment
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

  } catch (error) {
    // @Transactional decorator automatically rolls back ALL database changes
    this.logger.error(`Order completion failed: ${error.message}`);
    throw error;
  }
}
```

---

**Document Version:** 2.0.0  
**Maintained By:** NerdPOS Backend Team  
**Review Frequency:** Monthly